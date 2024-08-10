import mermaid from 'mermaid';
import { renderMermaidBlocksInElement } from './mermaid';
import svgPanZoom from 'svg-pan-zoom';

function init() {
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;

    const config = {
        startOnLoad: false,
        theme: document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? darkModeTheme ?? 'dark'
            : lightModeTheme ?? 'default'
    };
    mermaid.initialize(config);

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
