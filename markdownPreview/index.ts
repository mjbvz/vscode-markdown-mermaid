import elkLayouts from '@mermaid-js/layout-elk';
import mermaid, { MermaidConfig } from 'mermaid';
import { iconPackConfig } from '../src/iconPackConfig';
import { registerIconPacks } from '../src/mermaid';
import { renderMermaidBlocksInElement } from './mermaid';

function init() { 
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;

    const config = {
        startOnLoad: false,
        theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? darkModeTheme ?? 'dark'
            : lightModeTheme ?? 'default' ) as MermaidConfig['theme'],
    };

    registerIconPacks(iconPackConfig);
    mermaid.initialize(config);
    mermaid.registerLayoutLoaders(elkLayouts);

    renderMermaidBlocksInElement(document.body, (mermaidContainer, content) => {
        mermaidContainer.innerHTML = content;
    });
}


window.addEventListener('vscode.markdown.updateContent', init);

init();
