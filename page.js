//@ts-check
import mermaid from 'mermaid';

function init() {
    mermaid.initialize({
        startOnLoad: false,
        theme: document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? 'dark'
            : 'default'
    });

    // Delete existing mermaid outputs
    for (const possibleMermaidErrorOut of document.getElementsByTagName('svg')) {
        const parent = possibleMermaidErrorOut.parentElement;
        if (parent && parent.id.startsWith('dmermaid')) {
            parent.remove();
        }
    }

    let i = 0;
    for (const mermaidContainer of document.getElementsByClassName('mermaid')) {
        const id = `mermaid-${Date.now()}-${i++}`;
        const source = mermaidContainer.textContent;

        const out = document.createElement('div');
        out.id = id;
        mermaidContainer.innerHTML = '';
        mermaidContainer.appendChild(out);

        mermaid.render(id, source, (out) => {
            console.log(out);
            mermaidContainer.innerHTML = out;
        });
    }
}


window.addEventListener('vscode.markdown.updateContent', init);

init();