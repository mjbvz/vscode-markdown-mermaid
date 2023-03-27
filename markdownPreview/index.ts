import mermaid from 'mermaid';
import { renderMermaidBlocksInElement } from './mermaid';

function init() {
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;

    const directives = JSON.parse(configSpan?.dataset.directives ?? '');
    const directivesDebug =  'debug' in directives ? directives.debug : false;

    const config = {
        startOnLoad: false,
        theme: document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? darkModeTheme ?? 'dark'
            : lightModeTheme ?? 'default',
        ...directives
    };
    mermaid.initialize(config);

    renderMermaidBlocksInElement(document.body, (mermaidContainer, content) => {
        mermaidContainer.innerHTML = content;
    });

    if (directivesDebug) {
        const paragraph = document.createElement("pre");
        paragraph.innerHTML = JSON.stringify(directives);
        document.body.append(paragraph);
    }
}


window.addEventListener('vscode.markdown.updateContent', init);

init();
