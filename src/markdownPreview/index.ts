/**
 * Main entrypoint for the markdown preview.
 * 
 * This runs in the markdown preview's webview.
 */
import mermaid, { MermaidConfig } from 'mermaid';
import { registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';
import { createZoomButton, resetView } from './zoom';

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
