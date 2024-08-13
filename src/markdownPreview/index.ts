/**
 * Main entrypoint for the markdown preview.
 * 
 * This runs in the markdown preview's webview.
 */
import mermaid, { MermaidConfig } from 'mermaid';
import { registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';
import svgPanZoom from 'svg-pan-zoom';

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
        mermaidContainer.style.display = "flex"
        mermaidContainer.style.flexDirection = "column"
        
        const button = document.createElement("BUTTON")
        button.innerText = "Enable Zoom"
        button.style.width = "10rem"
        button.onclick = () => {onClickZoom(button, mermaidContainer, content)}
        mermaidContainer.prepend(button);
    });
}

function onClickZoom(button: HTMLElement, mermaidContainer: HTMLElement, svgContent: string) {
    if (button.innerText == "Enable Zoom") {
        const svgEl = mermaidContainer.querySelector("svg");
        if (!svgEl) return
    
        const svgSize = svgEl.getBoundingClientRect()
        svgEl.style.width = svgSize.width+"px";
        svgEl.style.height = svgSize.height+"px";
        svgPanZoom(svgEl, {
            zoomEnabled: true,
            controlIconsEnabled: true,
            fit: true,
            center: true
        }); 
        button.innerText = "Disable Zoom"
    }
    else {
        mermaidContainer.innerHTML = svgContent;
        mermaidContainer.prepend(button);
        button.innerText = "Enable Zoom"
    }
}

window.addEventListener('vscode.markdown.updateContent', init);
init();
