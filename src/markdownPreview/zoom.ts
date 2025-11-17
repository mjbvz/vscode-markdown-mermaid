import mermaid from 'mermaid';
import { renderMermaidBlocksInElement } from '../shared-mermaid';

type PanZoomState = {
    requireInit: boolean
    enabled: boolean
    panX: number
    panY: number
    scale: number
}

type PanZoomInstance = {
    svgEl: SVGSVGElement
    container: HTMLElement
    cleanup: () => void
    reset: () => void
    restore: () => void
    setScale: (scale: number) => void
    state: PanZoomState
}

const ENHANCEMENT_STYLES_ID = 'mermaid-enhancement-styles';
const MODAL_BODY_CLASS = 'mermaid-modal-open';

type ActiveModal = {
    index: number
    element: HTMLDivElement
    diagramHost: HTMLElement
    panZoomInstance: PanZoomInstance | null
    sourceContainer: HTMLElement
};

const modalPanZoomStates: {[index: number]: PanZoomState} = {};
let activeModal: ActiveModal | null = null;
let escapeKeyHandler: ((event: KeyboardEvent) => void) | null = null;

export function ensureMermaidEnhancementStyles() {
    if (document.getElementById(ENHANCEMENT_STYLES_ID)) {
        return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = ENHANCEMENT_STYLES_ID;
    styleElement.textContent = getEnhancementStyles();
    document.head.appendChild(styleElement);
}

export function attachMermaidEnhancements(mermaidContainer: HTMLElement, svgEl: SVGSVGElement, index: number) {
    ensureMermaidEnhancementStyles();

    mermaidContainer.classList.add("mermaid-enhanced");

    if (!mermaidContainer.dataset.positionSet) {
        const currentPosition = window.getComputedStyle(mermaidContainer).position;
        if (currentPosition === "static") {
            mermaidContainer.style.position = "relative";
        }
        mermaidContainer.dataset.positionSet = "true";
    }

    const existingMenu = mermaidContainer.querySelector<HTMLDivElement>(".mermaid-tool-menu");
    if (!existingMenu) {
        const menu = createHoverToolMenu(mermaidContainer, index);
        mermaidContainer.appendChild(menu);
    }

    if (mermaidContainer.dataset.toolMenuReady !== "true") {
        mermaidContainer.dataset.toolMenuReady = "true";
    }

    svgEl.classList.add("mermaid-enhanced__svg");
}

function getEnhancementStyles(): string {
    return `
    body.${MODAL_BODY_CLASS} {
        overflow: hidden;
    }

    .mermaid.mermaid-enhanced {
        position: relative;
        border: 1px solid var(--vscode-panel-border, var(--vscode-widget-border, rgba(128, 128, 128, 0.4)));
        border-radius: 4px;
        padding: 12px;
        box-sizing: border-box;
        transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .mermaid.mermaid-enhanced:hover {
        border-color: var(--vscode-focusBorder, var(--vscode-panel-border, rgba(128, 128, 128, 0.4)));
        box-shadow: 0 0 0 1px var(--vscode-focusBorder, transparent);
    }

    .mermaid-enhanced__svg {
        width: 100%;
    }

    .mermaid-tool-menu {
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 6px;
        padding: 4px;
        background: var(--vscode-editorWidget-background);
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease-in-out;
        z-index: 2;
    }

    .mermaid.mermaid-enhanced:hover .mermaid-tool-menu,
    .mermaid.mermaid-enhanced:focus-within .mermaid-tool-menu {
        opacity: 1;
        pointer-events: auto;
    }

    .mermaid-control-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border-radius: 4px;
        border: 1px solid transparent;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        cursor: pointer;
        transition: background 0.15s ease-in-out, color 0.15s ease-in-out, border-color 0.15s ease-in-out;
    }

    .mermaid-control-button:hover {
        background: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-secondaryBackground));
        border-color: var(--vscode-panel-border, transparent);
    }

    .mermaid-control-button:focus-visible {
        outline: 2px solid var(--vscode-focusBorder, rgba(14, 99, 156, 0.6));
        outline-offset: 2px;
    }

    .mermaid-control-button svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
    }

    .mermaid-modal {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .mermaid-modal__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
    }

    .mermaid-modal__body {
        position: relative;
        width: 90vw;
        height: 90vh;
        max-width: 1200px;
        max-height: 90vh;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border, var(--vscode-widget-border));
        border-radius: 8px;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
        display: flex;
        overflow: hidden;
    }

    .mermaid-modal__toolbar {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        gap: 8px;
        z-index: 10;
        background: var(--vscode-editorWidget-background);
        padding: 8px;
        border-radius: 6px;
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .mermaid-modal__diagram {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: 16px;
    }

    .mermaid-modal__diagram svg {
        width: 100%;
        height: auto;
        max-width: none;
    }

    .mermaid-modal__loading,
    .mermaid-modal__error {
        color: var(--vscode-foreground);
        font-size: 14px;
        text-align: center;
    }

    .mermaid-modal__error {
        white-space: pre-wrap;
    }
    `;
}

function createHoverToolMenu(mermaidContainer: HTMLElement, index: number): HTMLDivElement {
    const menu = document.createElement("div");
    menu.className = "mermaid-tool-menu";

    const expandButton = createControlButton("Expand diagram", getExpandIconMarkup(), "expand");
    expandButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openMermaidModal(mermaidContainer, index);
    });

    const copyButton = createControlButton("Copy Mermaid source", getCopyIconMarkup(), "copy");
    copyButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await copyMermaidSource(mermaidContainer);
    });

    menu.append(expandButton, copyButton);
    return menu;
}

function createControlButton(label: string, iconMarkup: string, action: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mermaid-control-button";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.dataset.action = action;
    button.innerHTML = iconMarkup;
    return button;
}

async function copyMermaidSource(mermaidContainer: HTMLElement): Promise<void> {
    const source = mermaidContainer.dataset.mermaidSource;
    if (!source) {
        console.warn("No Mermaid source available for copy.");
        return;
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(source);
            return;
        }
    } catch (error) {
        console.error("navigator.clipboard.writeText failed, attempting fallback copy.", error);
    }

    const textarea = document.createElement("textarea");
    textarea.value = source;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand("copy");
    } catch (error) {
        console.error("Fallback copy failed.", error);
    } finally {
        textarea.remove();
    }
}

async function openMermaidModal(mermaidContainer: HTMLElement, index: number): Promise<void> {
    const source = mermaidContainer.dataset.mermaidSource;
    if (!source) {
        console.warn("No Mermaid source available for modal rendering.");
        return;
    }

    try {
        const vscode = (window as any).acquireVsCodeApi?.();
        if (vscode) {
            const data = JSON.stringify({ source, index });
            const encoded = btoa(unescape(encodeURIComponent(data)));
            if (encoded.length < 8000) {
                const commandUri = `command:markdown-mermaid.openDiagram?${encodeURIComponent(encoded)}`;
                const link = document.createElement('a');
                link.href = commandUri;
                link.click();
                return;
            }
        }
    } catch (error) {
        console.warn("Could not access VS Code API, falling back to in-preview modal", error);
    }

    closeActiveModal();
    ensureMermaidEnhancementStyles();

    const modal = document.createElement("div");
    modal.className = "mermaid-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.dataset.diagramIndex = String(index);

    const backdrop = document.createElement("div");
    backdrop.className = "mermaid-modal__backdrop";

    const body = document.createElement("div");
    body.className = "mermaid-modal__body";

    const toolbar = document.createElement("div");
    toolbar.className = "mermaid-modal__toolbar";

    const closeButton = createControlButton("Close modal gemini", getCloseIconMarkup(), "close");
    const zoomInButton = createControlButton("Zoom in", getZoomInIconMarkup(), "zoom-in");
    const zoomOutButton = createControlButton("Zoom out", getZoomOutIconMarkup(), "zoom-out");
    const copyButton = createControlButton("Copy Mermaid source", getCopyIconMarkup(), "copy");

    toolbar.append(closeButton, zoomInButton, zoomOutButton, copyButton);

    const diagramHost = document.createElement("div");
    diagramHost.className = "mermaid-modal__diagram";

    body.append(toolbar, diagramHost);
    modal.append(backdrop, body);

    const state = modalPanZoomStates[index] ?? {
        requireInit: true,
        enabled: true,
        panX: 0,
        panY: 0,
        scale: 1
    };
    modalPanZoomStates[index] = state;

    activeModal = {
        index,
        element: modal,
        diagramHost,
        panZoomInstance: null,
        sourceContainer: mermaidContainer
    };

    document.body.appendChild(modal);
    document.body.classList.add(MODAL_BODY_CLASS);

    attachModalEventHandlers(modal);

    const loading = document.createElement("div");
    loading.className = "mermaid-modal__loading";
    loading.textContent = "Rendering diagram...";
    diagramHost.appendChild(loading);

    try {
        const renderId = `modal-mermaid-${crypto.randomUUID()}`;
        const renderResult = await mermaid.render(renderId, source);
        if (!activeModal || activeModal.element !== modal) {
            return;
        }

        diagramHost.innerHTML = renderResult.svg;
        renderResult.bindFunctions?.(diagramHost);

        const svgEl = diagramHost.querySelector("svg");
        if (!svgEl) {
            throw new Error("Mermaid modal render did not return an SVG element.");
        }

        const panZoomInstance = enablePanZoom(diagramHost, svgEl, state);
        panZoomInstance.state.enabled = true;
        setActiveModalPanZoomInstance(panZoomInstance);
    } catch (error) {
        if (!activeModal || activeModal.element !== modal) {
            return;
        }

        console.error("Failed to render Mermaid diagram in modal.", error);
        diagramHost.innerHTML = "";

        const errorNode = document.createElement("div");
        errorNode.className = "mermaid-modal__error";
        errorNode.textContent = error instanceof Error ? error.message : String(error);
        diagramHost.appendChild(errorNode);

        setActiveModalPanZoomInstance(null);
    }

    closeButton.addEventListener("click", (event) => {
        event.preventDefault();
        closeActiveModal();
    });

    zoomInButton.addEventListener("click", (event) => {
        event.preventDefault();
        const instance = activeModal?.panZoomInstance;
        if (instance) {
            const nextScale = instance.state.scale * 1.2;
            instance.setScale(nextScale);
        }
    });

    zoomOutButton.addEventListener("click", (event) => {
        event.preventDefault();
        const instance = activeModal?.panZoomInstance;
        if (instance) {
            const nextScale = instance.state.scale / 1.2;
            instance.setScale(nextScale);
        }
    });

    copyButton.addEventListener("click", async (event) => {
        event.preventDefault();
        const sourceEl = activeModal?.sourceContainer ?? mermaidContainer;
        await copyMermaidSource(sourceEl);
    });

    backdrop.addEventListener("click", (event) => {
        event.preventDefault();
        closeActiveModal();
    });
}

function setActiveModalPanZoomInstance(instance: PanZoomInstance | null) {
    if (activeModal) {
        activeModal.panZoomInstance?.cleanup();
        activeModal.panZoomInstance = instance;
    }
}

function closeActiveModal() {
    if (!activeModal) {
        return;
    }

    activeModal.panZoomInstance?.cleanup();
    activeModal.element.remove();
    document.body.classList.remove(MODAL_BODY_CLASS);
    detachModalEventHandlers();
    activeModal = null;
}

function attachModalEventHandlers(modal: HTMLDivElement) {
    detachModalEventHandlers();

    escapeKeyHandler = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            closeActiveModal();
        }
    };

    window.addEventListener("keydown", escapeKeyHandler, true);

    modal.addEventListener("wheel", (event) => {
        if (event.ctrlKey) {
            event.preventDefault();
        }
    }, { passive: false });
}

function detachModalEventHandlers() {
    if (escapeKeyHandler) {
        window.removeEventListener("keydown", escapeKeyHandler, true);
        escapeKeyHandler = null;
    }
}

function getExpandIconMarkup(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344 0a.5.5 0 0 1 .707 0l4.096 4.096V11.5a.5.5 0 1 1 1 0v3.975a.5.5 0 0 1-.5.5H11.5a.5.5 0 0 1 0-1h2.768l-4.096-4.096a.5.5 0 0 1 0-.707zm0-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707zm-4.344 0a.5.5 0 0 1-.707 0L1.025 1.732V4.5a.5.5 0 0 1-1 0V.525a.5.5 0 0 1 .5-.5H4.5a.5.5 0 0 1 0 1H1.732l4.096 4.096a.5.5 0 0 1 0 .707z"/>
    </svg>
    `;
}

function getCopyIconMarkup(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
    </svg>
    `;
}

function getCloseIconMarkup(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
    </svg>
    `;
}

function getZoomInIconMarkup(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
        <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
        <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/>
    </svg>
    `;
}

function getZoomOutIconMarkup(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
        <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
        <path fill-rule="evenodd" d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
    </svg>
    `;
}

export async function renderMermaidBlocksWithPanZoom() {
    ensureMermaidEnhancementStyles();

    const numElements = await renderMermaidBlocksInElement(document.body, (mermaidContainer, content, index) => {
        mermaidContainer.innerHTML = content;
        const svgEl = mermaidContainer.querySelector('svg');
        if (svgEl) {
            attachMermaidEnhancements(mermaidContainer, svgEl, index);
        }
    });

    removeOldModalPanZoomStates(numElements);
}

export function resetPanZoom() {
    // No-op: pan zoom state is now only managed in modals
}

export function onResize() {
    // No-op: pan zoom is now only managed in modals
}

// enablePanZoom will initialize native pan/zoom handling for the
// provided svg element using pointer and wheel events.
// If the provided pan zoom state is not initialized then
// it will be populated with default values, otherwise it will
// load the provided pan zoom state.
function enablePanZoom(mermaidContainer:HTMLElement, svgEl: SVGSVGElement, panZoomState: PanZoomState): PanZoomInstance {
    // Ensure SVG uses viewBox for aspect ratio preservation
    svgEl.style.width = "100%";
    svgEl.style.height = "auto";
    svgEl.style.maxWidth = "none";

    // Get initial viewBox if not set
    let viewBox = svgEl.viewBox.baseVal;
    if (viewBox.width === 0 || viewBox.height === 0) {
        const bbox = svgEl.getBBox();
        svgEl.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        viewBox = svgEl.viewBox.baseVal;
    }

    const initialViewBox = {
        x: viewBox.x,
        y: viewBox.y,
        width: viewBox.width,
        height: viewBox.height
    };

    const clampScale = (value: number) => Math.max(0.1, Math.min(10, value));

    const updateScale = (targetScale: number, pointer?: { clientX: number; clientY: number }) => {
        const nextScale = clampScale(targetScale);
        const svgRect = svgEl.getBoundingClientRect();

        if (svgRect.width === 0 || svgRect.height === 0) {
            panZoomState.scale = nextScale;
            applyTransform(svgEl, initialViewBox, panZoomState);
            return;
        }

        const pointerX = pointer ? pointer.clientX - svgRect.left : svgRect.width / 2;
        const pointerY = pointer ? pointer.clientY - svgRect.top : svgRect.height / 2;

        const currentViewBox = svgEl.viewBox.baseVal;
        const svgX = (pointerX / svgRect.width) * currentViewBox.width + currentViewBox.x;
        const svgY = (pointerY / svgRect.height) * currentViewBox.height + currentViewBox.y;

        const newScaledWidth = initialViewBox.width / nextScale;
        const newScaledHeight = initialViewBox.height / nextScale;

        const newX = svgX - (pointerX / svgRect.width) * newScaledWidth;
        const newY = svgY - (pointerY / svgRect.height) * newScaledHeight;

        panZoomState.panX = newX - initialViewBox.x;
        panZoomState.panY = newY - initialViewBox.y;
        panZoomState.scale = nextScale;

        applyTransform(svgEl, initialViewBox, panZoomState);
    };

    const setScale = (targetScale: number, pointer?: { clientX: number; clientY: number }) => {
        updateScale(targetScale, pointer);
    };

    // Initialize state if needed
    if (panZoomState.requireInit) {
        panZoomState.panX = 0;
        panZoomState.panY = 0;
        panZoomState.scale = 1;
        panZoomState.requireInit = false;
    }

    const restore = () => {
        applyTransform(svgEl, initialViewBox, panZoomState);
    };

    // Apply initial transform
    restore();

    let isPanning = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const handlePointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        isPanning = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        svgEl.style.cursor = 'grabbing';
        svgEl.setPointerCapture(e.pointerId);
        e.preventDefault();
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!isPanning) return;
        
        const deltaX = e.clientX - lastPointerX;
        const deltaY = e.clientY - lastPointerY;
        
        // Convert screen pixels to SVG coordinates using current viewBox
        const svgRect = svgEl.getBoundingClientRect();
        const currentViewBox = svgEl.viewBox.baseVal;
        const scaleX = currentViewBox.width / svgRect.width;
        const scaleY = currentViewBox.height / svgRect.height;
        
        panZoomState.panX -= deltaX * scaleX;
        panZoomState.panY -= deltaY * scaleY;
        
        restore();
        
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        e.preventDefault();
    };

    const handlePointerUp = (e: PointerEvent) => {
        isPanning = false;
        svgEl.style.cursor = 'grab';
        svgEl.releasePointerCapture(e.pointerId);
        e.preventDefault();
    };

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const targetScale = panZoomState.scale * zoomFactor;
        setScale(targetScale, { clientX: e.clientX, clientY: e.clientY });
    };

    svgEl.style.cursor = 'grab';
    svgEl.addEventListener('pointerdown', handlePointerDown);
    svgEl.addEventListener('pointermove', handlePointerMove);
    svgEl.addEventListener('pointerup', handlePointerUp);
    svgEl.addEventListener('pointercancel', handlePointerUp);
    svgEl.addEventListener('wheel', handleWheel, { passive: false });

    const cleanup = () => {
        svgEl.removeEventListener('pointerdown', handlePointerDown);
        svgEl.removeEventListener('pointermove', handlePointerMove);
        svgEl.removeEventListener('pointerup', handlePointerUp);
        svgEl.removeEventListener('pointercancel', handlePointerUp);
        svgEl.removeEventListener('wheel', handleWheel);
        svgEl.style.cursor = '';
    };

    const reset = () => {
        panZoomState.panX = 0;
        panZoomState.panY = 0;
        panZoomState.scale = 1;
        restore();
    };

    return {
        svgEl,
        container: mermaidContainer,
        cleanup,
        reset,
        restore,
        setScale,
        state: panZoomState
    };
}

function applyTransform(svgEl: SVGSVGElement, initialViewBox: { x: number, y: number, width: number, height: number }, state: PanZoomState) {
    // Calculate new viewBox based on pan and zoom
    const scaledWidth = initialViewBox.width / state.scale;
    const scaledHeight = initialViewBox.height / state.scale;
    
    const newX = initialViewBox.x + state.panX;
    const newY = initialViewBox.y + state.panY;
    
    svgEl.setAttribute('viewBox', `${newX} ${newY} ${scaledWidth} ${scaledHeight}`);
}


export function removeOldModalPanZoomStates(numElements: number) {
    for (const index in modalPanZoomStates) {
        if (Number(index) >= numElements) {
            delete modalPanZoomStates[index];
        }
    }
}
