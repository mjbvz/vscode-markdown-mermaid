import mermaid from 'mermaid';
import { renderMermaidBlocksInElement } from './mermaid';
import { newZoomStates, removeOldZoomStates, renderZoomableMermaidBlock } from './zoom';

async function init() {
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
    const numElements = await renderMermaidBlocksInElement(document.body, (mermaidContainer, content, index) => {
        // Setup container styles
        mermaidContainer.style.display = "flex"
        mermaidContainer.style.flexDirection = "column"
        
        renderZoomableMermaidBlock(mermaidContainer, content, zoomStates, index)
    });
    removeOldZoomStates(zoomStates, numElements)
}

window.addEventListener('vscode.markdown.updateContent', init);

init();
