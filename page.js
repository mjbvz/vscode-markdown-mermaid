import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: true,
    theme: document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
        ? 'dark'
        : 'default'
});
