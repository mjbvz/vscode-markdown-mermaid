import mermaid from 'mermaid';

function processMermaidErrorOuts(processCallback: (element: HTMLElement) => void) {
    for (const possibleMermaidErrorOut of document.getElementsByTagName('svg')) {
        const parent = possibleMermaidErrorOut.parentElement;
        if (parent?.classList.contains('mermaid')) {
            processCallback(parent);
        }
    }
}

export async function renderMermaidBlocksInElement(root: HTMLElement) {

    // Delete existing mermaid outputs
    processMermaidErrorOuts((mermaidErrorOut) => {
        mermaidErrorOut.remove();
    });

    for (const mermaidContainer of root.getElementsByClassName('mermaid') ?? []) {
        await renderMermaidElement(mermaidContainer);
    }

    async function renderMermaidElement(mermaidContainer: Element) {
        const id = `mermaid-${crypto.randomUUID()}`;
        const source = mermaidContainer.textContent ?? '';

        const out = document.createElement('div');
        out.id = id;
        mermaidContainer.innerHTML = '';
        mermaidContainer.appendChild(out);

        try {
            mermaid.mermaidAPI.reset();
            const {svg, bindFunctions} = await mermaid.render(id, source, mermaidContainer);
            mermaidContainer.innerHTML = svg;
            bindFunctions?.(mermaidContainer);
        } catch (error) {
            if (error instanceof Error) {
                const errorMessageNode = document.createElement('pre');

                errorMessageNode.innerText = error.message;

                processMermaidErrorOuts((mermaidErrorOut) => {
                    mermaidErrorOut.appendChild(errorMessageNode);
                });
            }

            // don't break standard mermaid flow
            throw error;
        }
    }
}
