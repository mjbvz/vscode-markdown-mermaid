import elkLayouts from '@mermaid-js/layout-elk';
import zenuml from '@mermaid-js/mermaid-zenuml';
import mermaid, { MermaidConfig } from 'mermaid';
import { iconPackConfig, requireIconPack } from './iconPackConfig';

type WriteOutFN = (mermaidContainer: HTMLElement, content: string, index: number) => void

function renderMermaidElement(mermaidContainer: HTMLElement, index: number, writeOut: WriteOutFN): {
    containerId: string;
    p: Promise<void>;
} {
    const containerId = `mermaid-container-${crypto.randomUUID()}`;
    const diagramId = `mermaid-${crypto.randomUUID()}`;

    const source = mermaidContainer.textContent ?? '';
    mermaidContainer.id = containerId;
    mermaidContainer.innerHTML = '';

    return {
        containerId,
        p: (async () => {
            try {
                // Catch any parsing errors
                await mermaid.parse(source);

                //  Render the diagram
                const renderResult = await mermaid.render(diagramId, source);
                writeOut(mermaidContainer, renderResult.svg, index);
                renderResult.bindFunctions?.(mermaidContainer);
            } catch (error) {
                if (error instanceof Error) {
                    const errorMessageNode = document.createElement('pre');
                    errorMessageNode.className = 'mermaid-error';
                    errorMessageNode.innerText = error.message;
                    writeOut(mermaidContainer, errorMessageNode.outerHTML, index);
                }

                throw error;
            }
        })()
    };
}

export async function renderMermaidBlocksInElement(root: HTMLElement, writeOut: WriteOutFN): Promise<number> {
    // Delete existing mermaid outputs
    for (const el of root.querySelectorAll('.mermaid > svg')) {
        el.remove();
    }
    for (const svg of root.querySelectorAll('svg')) {
        if (svg.parentElement?.id.startsWith('dmermaid')) {
            svg.parentElement.remove();
        }
    }

    // We need to generate all the container ids sync, but then do the actual rendering async
    const renderPromises: Array<Promise<void>> = [];
    const mermaidElements = root.querySelectorAll<HTMLElement>('.mermaid')
    for (let i=0; i<mermaidElements.length; i++) {
        renderPromises.push(renderMermaidElement(mermaidElements[i], i, writeOut).p);
    }

    for (const p of renderPromises) {
        await p;
    }

    return mermaidElements.length
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

export function loadMermaidConfig(): MermaidConfig {
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;

    return {
        startOnLoad: false,
        theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? darkModeTheme ?? 'dark'
            : lightModeTheme ?? 'default') as MermaidConfig['theme'],
    };
}