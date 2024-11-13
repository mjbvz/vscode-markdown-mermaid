/**
 * Main entrypoint for the markdown preview.
 * 
 * This runs in the markdown preview's webview.
 */
import mermaid, { MermaidConfig } from 'mermaid';
import { registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';
import { getToggleButtonStyles, newPanZoomStates, removeOldPanZoomStates, renderZoomableMermaidBlock } from './zoom';

const panZoomStates = newPanZoomStates()

async function init() { 
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;

    const config: MermaidConfig = {
        startOnLoad: false,
        theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? darkModeTheme ?? 'dark'
            : lightModeTheme ?? 'default' ) as MermaidConfig['theme'],
    };

    mermaid.initialize(config);
    registerMermaidAddons();
    
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
