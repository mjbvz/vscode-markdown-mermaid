import mermaid from 'mermaid';
import { renderMermaidBlocksInElement } from './mermaid';
import mindmap from '@mermaid-js/mermaid-mindmap'

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
    mermaid.registerExternalDiagrams([mindmap], {lazyLoad: false});

    renderMermaidBlocksInElement(document.body);
}


window.addEventListener('vscode.markdown.updateContent', init);

init();
