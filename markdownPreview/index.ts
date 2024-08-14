import mermaid from 'mermaid';
import { renderMermaidBlocksInElement } from './mermaid';
import { createZoomButton, resetView } from './zoom';

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
        // Setup container styles
        mermaidContainer.style.display = "flex"
        mermaidContainer.style.flexDirection = "column"
        
        // Set the view to be normal svg diagram
        const zoomButton = createZoomButton(mermaidContainer, content)
        resetView(zoomButton, mermaidContainer, content)
    });
}

window.addEventListener('vscode.markdown.updateContent', init);

init();
