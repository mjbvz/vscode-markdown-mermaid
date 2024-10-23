import elkLayouts from '@mermaid-js/layout-elk';
import zenuml from '@mermaid-js/mermaid-zenuml';
import mermaid from 'mermaid';
import { iconPackConfig, requireIconPack } from './iconPackConfig';

async function renderMermaidElement(mermaidContainer: HTMLElement, writeOut: (mermaidContainer: HTMLElement, content: string) => void) {
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
    for (const svg of document.querySelectorAll('svg')) {
        if (svg.parentElement?.id.startsWith('dmermaid')) {
            svg.parentElement.remove();
        }
    }

    for (const mermaidContainer of root.getElementsByClassName('mermaid')) {
        await renderMermaidElement(mermaidContainer as HTMLElement, writeOut);
    }
}

function registerIconPacks(config: Array<{ prefix?: string; pack: string }>) {
    const iconPacks = config.map((iconPack) => ({
        name: iconPack.prefix || '',
        loader: () => {
        try {
            const module = requireIconPack(`./${iconPack.pack.replace('@iconify-json/', '')}`);
            return module.icons || {}; 
        } catch (error) {
            console.error(`Failed to load icon pack: ${iconPack.pack}`, error);
            return {}; 
        }
        },
    }));

    mermaid.registerIconPacks(iconPacks);
}

export async function registerMermaidAddons() {
    registerIconPacks(iconPackConfig);
    mermaid.registerLayoutLoaders(elkLayouts);
    await mermaid.registerExternalDiagrams([zenuml]);
}