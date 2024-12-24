/**
 * Main entrypoint for the markdown preview.
 * 
 * This runs in the markdown preview's webview.
 */
import mermaid from 'mermaid';
import { loadMermaidConfig, registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';

function init() { 
    const config= loadMermaidConfig();
    mermaid.initialize(config);
    registerMermaidAddons();
    
    renderMermaidBlocksInElement(document.body, (mermaidContainer, content) => {
        mermaidContainer.innerHTML = content;
    });
}

window.addEventListener('vscode.markdown.updateContent', init);
init();
