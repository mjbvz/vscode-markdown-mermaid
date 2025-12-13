/**
 * Main entrypoint for the markdown preview.
 * 
 * This runs in the markdown preview's webview.
 */
import mermaid, { MermaidConfig } from 'mermaid';
import { registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';

let zoomLevel = 1;

function addZoomControls() {
    const existingControls = document.getElementById('mermaid-zoom-controls');
    if (existingControls) return;

    const controls = document.createElement('div');
    controls.id = 'mermaid-zoom-controls';
    controls.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 1000;
        display: flex;
        gap: 5px;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 5px;
    `;

    const zoomOut = document.createElement('button');
    zoomOut.textContent = '-';
    zoomOut.style.cssText = `
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 5px 10px;
        cursor: pointer;
        border-radius: 2px;
    `;

    const resetZoom = document.createElement('button');
    resetZoom.id = 'zoom-percentage';
    resetZoom.textContent = '100%';
    resetZoom.style.cssText = zoomOut.style.cssText;

    const zoomIn = document.createElement('button');
    zoomIn.textContent = '+';
    zoomIn.style.cssText = zoomOut.style.cssText;

    zoomOut.onclick = () => applyZoom(zoomLevel / 1.2);
    resetZoom.onclick = () => applyZoom(1);
    zoomIn.onclick = () => applyZoom(zoomLevel * 1.2);

    controls.appendChild(zoomOut);
    controls.appendChild(resetZoom);
    controls.appendChild(zoomIn);
    document.body.appendChild(controls);
}

function applyZoom(newZoom: number) {
    zoomLevel = Math.max(0.1, Math.min(5, newZoom));
    const mermaidElements = document.querySelectorAll('.mermaid');
    mermaidElements.forEach(el => {
        (el as HTMLElement).style.transform = `scale(${zoomLevel})`;
        (el as HTMLElement).style.transformOrigin = 'top left';
        
        // Add horizontal scrolling when zoomed
        const parent = (el as HTMLElement).parentElement;
        if (parent && zoomLevel > 1) {
            parent.style.overflowX = 'auto';
        } else if (parent) {
            parent.style.overflowX = 'visible';
        }
    });
    
    const percentageBtn = document.getElementById('zoom-percentage');
    if (percentageBtn) {
        percentageBtn.textContent = Math.round(zoomLevel * 100) + '%';
    }
}

function addMermaidControls(mermaidContainer: HTMLElement) {
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'PNG';
    exportBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 4px 8px;
        cursor: pointer;
        border-radius: 2px;
        font-size: 11px;
        opacity: 0.7;
        z-index: 100;
    `;
    
    exportBtn.onclick = () => exportMermaidToPNG(mermaidContainer);
    
    mermaidContainer.style.position = 'relative';
    mermaidContainer.appendChild(exportBtn);
}

function exportMermaidToPNG(mermaidContainer: HTMLElement) {
    const svg = mermaidContainer.querySelector('svg');
    if (!svg) return;
    
    const svgClone = svg.cloneNode(true) as SVGElement;
    const bbox = svg.getBBox();
    svgClone.setAttribute('width', bbox.width.toString());
    svgClone.setAttribute('height', bbox.height.toString());
    svgClone.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = bbox.width * 2;
    canvas.height = bbox.height * 2;
    
    const img = new Image();
    img.onload = () => {
        ctx?.scale(2, 2);
        ctx?.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `mermaid-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function init() { 
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;
    const maxTextSize = configSpan?.dataset.maxTextSize;

    const config: MermaidConfig = {
        startOnLoad: false,
        maxTextSize: maxTextSize ? Number(maxTextSize) : 50000,
        theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? darkModeTheme ?? 'dark'
            : lightModeTheme ?? 'default' ) as MermaidConfig['theme'],
    };

    mermaid.initialize(config);
    registerMermaidAddons();
    
    renderMermaidBlocksInElement(document.body, (mermaidContainer, content) => {
        mermaidContainer.innerHTML = content;
        addMermaidControls(mermaidContainer);
    });

    addZoomControls();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
            e.preventDefault();
            applyZoom(zoomLevel * 1.2);
        } else if (e.key === '-') {
            e.preventDefault();
            applyZoom(zoomLevel / 1.2);
        } else if (e.key === '0') {
            e.preventDefault();
            applyZoom(1);
        }
    }
});

window.addEventListener('vscode.markdown.updateContent', init);
init();
