import mermaid from 'mermaid';
import { renderMermaidBlocksInElement } from './mermaid';
import { newZoomStates, renderZoomableMermaidBlock } from './zoom';

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

    const zoomStates = newZoomStates()
    renderMermaidBlocksInElement(document.body, (mermaidContainer, content, index) => {
        // Setup container styles
        mermaidContainer.style.display = "flex"
        mermaidContainer.style.flexDirection = "column"
        
        renderZoomableMermaidBlock(mermaidContainer, content, zoomStates, index)
    });
}

window.addEventListener('vscode.markdown.updateContent', init);

init();
