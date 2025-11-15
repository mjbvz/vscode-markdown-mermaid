/**
 * Main entrypoint for the markdown preview.
 * 
 * This runs in the markdown preview's webview.
 */
import mermaid, { MermaidConfig } from 'mermaid';
import { registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';
import { renderMermaidBlocksWithPanZoom, resetPanZoom, onResize, ensureMermaidEnhancementStyles, attachMermaidEnhancements, removeOldModalPanZoomStates } from './zoom';

async function init() { 
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;
    const maxTextSize = configSpan?.dataset.maxTextSize;
    const enablePanZoomStr = configSpan?.dataset.enablePanZoom;
    const enablePanZoom = enablePanZoomStr ? enablePanZoomStr == "true" : false;

    const config: MermaidConfig = {
        startOnLoad: false,
        maxTextSize: maxTextSize ? Number(maxTextSize) : 50000,
        theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? darkModeTheme ?? 'dark'
            : lightModeTheme ?? 'default' ) as MermaidConfig['theme'],
    };

    mermaid.initialize(config);
    registerMermaidAddons();

    if (enablePanZoom) {
        renderMermaidBlocksWithPanZoom();
    } else {
        ensureMermaidEnhancementStyles();
        const renderedCount = await renderMermaidBlocksInElement(document.body, (mermaidContainer, content, index) => {
            mermaidContainer.innerHTML = content;
            const svgEl = mermaidContainer.querySelector('svg');
            if (svgEl) {
                attachMermaidEnhancements(mermaidContainer, svgEl, index);
            }
        });
        removeOldModalPanZoomStates(renderedCount);

        // Reset everything as pan zoom has been disabled
        resetPanZoom();
    }
}

window.addEventListener('resize', onResize);
window.addEventListener('vscode.markdown.updateContent', init);
init();
