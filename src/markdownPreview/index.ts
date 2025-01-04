/**
 * Main entrypoint for the markdown preview.
 * 
 * This runs in the markdown preview's webview.
 */
import mermaid, { MermaidConfig } from 'mermaid';
import { registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';
import { getToggleButtonStyles, newPanZoomStates, removeOldPanZoomStates, renderZoomableMermaidBlock } from './zoom';

let panZoomStates = newPanZoomStates()

async function init() { 
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;
    const enablePanZoom = configSpan?.dataset.enablePanZoom;
    const initPanZoom = enablePanZoom ? enablePanZoom == "true" : false

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
        if (initPanZoom) {
            renderZoomableMermaidBlock(mermaidContainer, content, panZoomStates, index);
        } else {
            mermaidContainer.innerHTML = content;
        }
    });

    if (initPanZoom) {
        // Some diagrams maybe removed during edits and if we have states
        // for more diagrams than there are then we should also remove them
        removeOldPanZoomStates(panZoomStates, numElements)
    } else {
        // If pan & zoom has been disabled the clear the states completely
        panZoomStates = newPanZoomStates()
    }
}

window.addEventListener('vscode.markdown.updateContent', init);
init();
