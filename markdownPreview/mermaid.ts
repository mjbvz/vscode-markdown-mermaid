import mermaid from 'mermaid';

type WriteOutFN = (mermaidContainer: HTMLElement, content: string, index: number) => void

async function renderMermaidElement(mermaidContainer: HTMLElement, index: number, writeOut: WriteOutFN) {
    const containerId = `mermaid-container-${crypto.randomUUID()}`;
    mermaidContainer.id = containerId;

    const id = `mermaid-${crypto.randomUUID()}`;
    const source = mermaidContainer.textContent ?? '';
    mermaidContainer.innerHTML = '';

    try {
        mermaid.mermaidAPI.reset();

        // Catch any parsing errors
        await mermaid.parse(source);

        //  Render the diagram
        const renderResult = await mermaid.render(id, source);
        writeOut(mermaidContainer, renderResult.svg, index);
        renderResult.bindFunctions?.(mermaidContainer);
    } catch (error) {
        if (error instanceof Error) {
            const errorMessageNode = document.createElement('pre');
            errorMessageNode.className = 'mermaid-error';
            errorMessageNode.innerText = error.message;
            writeOut(mermaidContainer, errorMessageNode.outerHTML, index);
        }
    }
}

export async function renderMermaidBlocksInElement(root: HTMLElement, writeOut: WriteOutFN): Promise<void> {
    // Delete existing mermaid outputs
    for (const el of document.querySelectorAll('.mermaid > svg')) {
        el.remove();
    }
    for (const svg of document.querySelectorAll('svg')) {
        if (svg.parentElement?.id.startsWith('dmermaid')) {
            svg.parentElement.remove();
        }
    }

    const mermaidElements = root.getElementsByClassName('mermaid')
    for (let i=0; i<mermaidElements.length; i++) {
        await renderMermaidElement(mermaidElements[i] as HTMLElement, i, writeOut);
    }
}
