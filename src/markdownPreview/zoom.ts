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
}

// This is to keep track the state of pan and zoom for each diagram so when
// the markdown preview is refreshed we can turn on pan zoom for diagrams that
// had it on and restore the state to what it was. 
// Given we use a simple index to track which diagram is which, if the user 
// switches around say diagram 1 with diagram 2 and save then we may end up
// using states for diagram 2 with diagram 1 and vice versa
const panZoomStates: {[index: number]: PanZoomState} = {};

// This is to keep track of all the diagrams that have pan zoom enabled so when
// the page resizes we can loop through all these pan zoom instances and call
// restore on all of them
const enabledPanZoomInstances: {[index: number]: PanZoomInstance} = {};
const TOGGLE_STYLES_ID = 'mermaid-pan-zoom-toggle-styles';

export async function renderMermaidBlocksWithPanZoom() {
    
    // Add styles to document
    if (!document.getElementById(TOGGLE_STYLES_ID)) {
        const styleElement = getToggleButtonStyles();
        styleElement.id = TOGGLE_STYLES_ID;
        document.head.appendChild(styleElement);
    }

    // On each re-render we should reset stored pan zoom instances as
    // all those old elements should be removed already
    resetEnabledPanZoomInstances(); 

    // Render each mermaid block with pan zoom capabilities
    const numElements = await renderMermaidBlocksInElement(document.body, (mermaidContainer, content, index) => {

        // Setup container styles
        mermaidContainer.style.display = "flex";
        mermaidContainer.style.flexDirection = "column";

        let svgEl = addSvgEl(mermaidContainer, content);
        const input = createPanZoomToggle(mermaidContainer);

        // Create an empty pan zoom state if a previous one isn't found
        // mark this state as required for initialization which can only
        // be set when we enable pan and zoom and know what those values are
        let panZoomState = panZoomStates[index];
        if (!panZoomState) {
            panZoomState = {
                requireInit: true,
                enabled: false,
                panX: 0,
                panY: 0,
                scale: 0
            };
            panZoomStates[index] = panZoomState;
        }

        // If previously pan & zoom was enabled then re-enable it
        if (panZoomState.enabled) {
            input.checked = true;
            const panZoomInstance = enablePanZoom(mermaidContainer, svgEl, panZoomState);
            enabledPanZoomInstances[index] = panZoomInstance;
        }

        input.onchange = () => {
            if (!panZoomState.enabled) {
                const panZoomInstance = enablePanZoom(mermaidContainer, svgEl, panZoomState);
                enabledPanZoomInstances[index] = panZoomInstance;
                panZoomState.enabled = true;
            }
            else {
                const instance = enabledPanZoomInstances[index];
                if (instance) {
                    instance.cleanup();
                }
                svgEl.remove();
                svgEl = addSvgEl(mermaidContainer, content);
                delete enabledPanZoomInstances[index];
                panZoomState.enabled = false;
            }
        };
    });

    // Some diagrams maybe removed during edits and if we have states
    // for more diagrams than there are then we should also remove them
    removeOldPanZoomStates(numElements);
}

// resetPanZoom clears up all states stored as part of pan zoom functionlaity
// should be used when page is re-rendered with pan zoom turned off
export function resetPanZoom() {
    resetPanZoomStates();
    resetEnabledPanZoomInstances();
}

// onResize should added as a callback on window resize events
export function onResize() {
    resizeEnabledPanZoomInstances();
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
        
        const svgRect = svgEl.getBoundingClientRect();
        const pointerX = e.clientX - svgRect.left;
        const pointerY = e.clientY - svgRect.top;
        
        // Convert pointer position to SVG coordinates using current viewBox
        const currentViewBox = svgEl.viewBox.baseVal;
        const svgX = (pointerX / svgRect.width) * currentViewBox.width + currentViewBox.x;
        const svgY = (pointerY / svgRect.height) * currentViewBox.height + currentViewBox.y;
        
        // Zoom factor
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(10, panZoomState.scale * zoomFactor));
        
        // Adjust pan so the point under cursor stays fixed
        const newScaledWidth = initialViewBox.width / newScale;
        const newScaledHeight = initialViewBox.height / newScale;
        
        // Calculate new pan to keep svgX, svgY at the same screen position
        const newX = svgX - (pointerX / svgRect.width) * newScaledWidth;
        const newY = svgY - (pointerY / svgRect.height) * newScaledHeight;
        
        panZoomState.panX = newX - initialViewBox.x;
        panZoomState.panY = newY - initialViewBox.y;
        panZoomState.scale = newScale;
        
        applyTransform(svgEl, initialViewBox, panZoomState);
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
        restore
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

// addSvgEl inserts the svg content into the provided mermaid container
// then finds the svg element to confirm it is created and returns it
function addSvgEl(mermaidContainer:HTMLElement, content: string): SVGSVGElement {

    // Add svg string content
    mermaidContainer.insertAdjacentHTML("beforeend", content);
    
    // Svg element should be found in container
    const svgEl = mermaidContainer.querySelector("svg");
    if (!svgEl) throw("svg element not found");

    return svgEl;
}

// removeOldPanZoomStates will remove all pan zoom states where their index
// is larger than the current amount of rendered elements. The usecase is 
// if the user creates many diagrams then removes them, we don't want to
// keep pan zoom states for diagrams that don't exist
function removeOldPanZoomStates(numElements: number) {
    for (const index in panZoomStates) {
        if (Number(index) >= numElements) {
            delete panZoomStates[index];
        }
    }
}

// resetPanZoomStates will remove all stored pan zoom states
function resetPanZoomStates() {
    for (const index in panZoomStates) {
        if (Object.prototype.hasOwnProperty.call(panZoomStates, index)) {
            delete panZoomStates[index];
        }
    }
}

// resizeEnabledPanZoomInstances will loop through all the currently
// enabled pan zoom instances and call restore on them, this should
// be called only on page resizing
function resizeEnabledPanZoomInstances() {
    for (const index in enabledPanZoomInstances) {
        if (Object.prototype.hasOwnProperty.call(enabledPanZoomInstances, index)) {
            const panZoomInstance = enabledPanZoomInstances[index];
            panZoomInstance.restore();
        }
    }
}

// resetEnabledPanZoomInstances will remove all stored enabled pan zoom instances
function resetEnabledPanZoomInstances() {
    for (const index in enabledPanZoomInstances) {
        if (Object.prototype.hasOwnProperty.call(enabledPanZoomInstances, index)) {
            const instance = enabledPanZoomInstances[index];
            instance.cleanup();
            delete enabledPanZoomInstances[index];
        }
    }
}

function createPanZoomToggle(mermaidContainer: HTMLElement): HTMLInputElement {
    const inputID = `checkbox-${crypto.randomUUID()}`;
    mermaidContainer.insertAdjacentHTML("afterbegin", `
    <div class="toggle-container">
        <input id="${inputID}" class="checkbox" type="checkbox" />
        <label class="label" for="${inputID}">
            <span class="ball" />
        </label>
        <div class="text">Pan & Zoom</div>
    </div>
    `);

    const input = mermaidContainer.querySelector("input");
    if (!input) throw Error("toggle input should be defined");

    return input;
}

function getToggleButtonStyles(): HTMLStyleElement {
    const styles = `
    .mermaid:hover .toggle-container {
        opacity: 1;
    }

    .toggle-container {
        opacity: 0;
        display: flex;
        align-items: center;
        margin-bottom: 6px;
        transition: opacity 0.2s ease-in-out;
    }

    .toggle-container .text {
        margin-left: 6px;
        font-size: 12px;
        cursor: default;
    }

    .toggle-container .checkbox {
        opacity: 0;
        position: absolute;
    }
      
    .toggle-container .label {
        background-color: var(--vscode-editorWidget-background);
        width: 33px;
        height: 19px;
        border-radius: 50px;
        position: relative;
        padding: 5px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
    }

    .toggle-container .label .ball {
        background-color: var(--vscode-editorWidget-foreground);
        width: 15px;
        height: 15px;
        position: absolute;
        left: 2px;
        top: 1px;
        border-radius: 50%;
        transition: transform 0.2s linear;
    }

    .toggle-container .checkbox:checked + .label .ball {
        transform: translateX(14px);
    }
    
    .toggle-container .checkbox:checked + .label {
        background-color: var(--vscode-textLink-activeForeground);
    }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    return styleSheet;
}