import mermaid from 'mermaid';

function processMermaidErrorOuts(processCallback: (element: HTMLElement) => void) {
    for (const possibleMermaidErrorOut of document.getElementsByTagName('svg')) {
        const parent = possibleMermaidErrorOut.parentElement;
        if (parent?.classList.contains('mermaid')) {
            processCallback(parent);
        }
    }
}

export function renderMermaidBlocksInElement(root: HTMLElement) {

    // Delete existing mermaid outputs
    processMermaidErrorOuts((mermaidErrorOut) => {
        mermaidErrorOut.remove();
    });

    for (const mermaidContainer of root.getElementsByClassName('mermaid') ?? []) {
        renderMermaidElement(mermaidContainer);
    }

    async function renderMermaidElement(mermaidContainer: Element) {
        const id = `mermaid-${crypto.randomUUID()}`;
        const source = mermaidContainer.textContent ?? '';
        mermaidContainer.innerHTML = '';

        try {
            mermaid.mermaidAPI.reset();
            await mermaid.renderAsync(id, source, (out) => {
                mermaidContainer.innerHTML = out;
            });
        } catch (error) {
            if (error instanceof Error) {
                const errorMessageNode = document.createElement('pre');

                // If error svg was appended to the body move it to the container and clean up wrapper element
                const errSvg = document.querySelector(`svg#${id}`);
                if (errSvg && errSvg.parentElement?.id === `d${id}`) {
                    errSvg.parentElement.remove();
                    mermaidContainer.prepend(errSvg);
                }

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
