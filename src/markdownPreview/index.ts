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
        const svgEl = mermaidContainer.querySelector("svg");
        if (!svgEl) return

        // Explicitly set svg element to it's default dimension
        // so svg-pan-zoom can setup correctly
        var bBox = svgEl.getBBox();
        svgEl.style.width = bBox.width+"px";
        svgEl.style.height = bBox.height+"px";
        svgPanZoom(svgEl, {
            zoomEnabled: true,
            controlIconsEnabled: true,
            fit: true,
            center: true
        }); 
    });
}

window.addEventListener('vscode.markdown.updateContent', init);
init();
