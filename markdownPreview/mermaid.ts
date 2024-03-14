import mermaid from 'mermaid';
import zenuml from "@mermaid-js/mermaid-zenuml";

async function renderMermaidElement(mermaidContainer: HTMLElement, writeOut: (mermaidContainer: HTMLElement, content: string) => void) {
    await mermaid.registerExternalDiagrams([zenuml]);
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
        writeOut(mermaidContainer, renderResult.svg);
        renderResult.bindFunctions?.(mermaidContainer);
    } catch (error) {
        if (error instanceof Error) {
            const errorMessageNode = document.createElement('pre');
            errorMessageNode.className = 'mermaid-error';
            errorMessageNode.innerText = error.message;
            writeOut(mermaidContainer, errorMessageNode.outerHTML);
        }

        throw error;
    }
}

export async function renderMermaidBlocksInElement(root: HTMLElement, writeOut: (mermaidContainer: HTMLElement, content: string) => void): Promise<void> {
    // Delete existing mermaid outputs
    for (const el of document.querySelectorAll('.mermaid > svg')) {
        el.remove();
    }
    await mermaid.registerExternalDiagrams([zenuml]);
    for (const svg of document.querySelectorAll('svg')) {
        if (svg.parentElement?.id.startsWith('dmermaid')) {
            svg.parentElement.remove();
        }
    }

    for (const mermaidContainer of root.getElementsByClassName('mermaid')) {
        await renderMermaidElement(mermaidContainer as HTMLElement, writeOut);
    }
}
