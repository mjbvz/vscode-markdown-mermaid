import mermaid from 'mermaid';
import { renderMermaidBlocksInElement } from './mermaid';
import * as svgPanZoom from 'svg-pan-zoom';

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
        mermaidContainer.style.height = "30rem";
        const svgEl = mermaidContainer.querySelector("svg");
        
        if (svgEl) {
          svgEl.style.height = "100%";
          svgPanZoom(svgEl, {
            center: true,
            minZoom: 0.1,
          });
        }
  });
}


window.addEventListener('vscode.markdown.updateContent', init);

init();
