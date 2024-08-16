import mermaid from 'mermaid';
import { renderMermaidBlocksInElement } from './mermaid';
import { getToggleButtonStyles, newPanZoomStates, removeOldPanZoomStates, renderZoomableMermaidBlock } from './zoom';

const panZoomStates = newPanZoomStates()

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

    document.head.appendChild(getToggleButtonStyles())
    const numElements = await renderMermaidBlocksInElement(document.body, (mermaidContainer, content, index) => {
        // Setup container styles
        mermaidContainer.style.display = "flex"
        mermaidContainer.style.flexDirection = "column"
        
        renderZoomableMermaidBlock(mermaidContainer, content, panZoomStates, index)
    });
    removeOldPanZoomStates(panZoomStates, numElements)
}

window.addEventListener('vscode.markdown.updateContent', init);

init();
