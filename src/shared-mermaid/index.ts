import elkLayouts from '@mermaid-js/layout-elk';
import zenuml from '@mermaid-js/mermaid-zenuml';
import mermaid, { MermaidConfig } from 'mermaid';
import { iconPacks } from './iconPackConfig';

function renderMermaidElement(
    mermaidContainer: HTMLElement,
    writeOut: (mermaidContainer: HTMLElement, content: string) => void,
    signal?: AbortSignal,
): {
    containerId: string;
    p: Promise<void>;
} | undefined {
    const containerId = `mermaid-container-${crypto.randomUUID()}`;
    const diagramId = `mermaid-${crypto.randomUUID()}`;

    const source = (mermaidContainer.textContent ?? '').trim();
    if (!source) {
        return;
    }

    mermaidContainer.id = containerId;
    mermaidContainer.innerHTML = '';

    return {
        containerId,
        p: (async () => {
            try {
                // Catch any parsing errors
                await mermaid.parse(source);
                if (signal?.aborted) {
                    throw new DOMException('Aborted', 'AbortError');
                }

                //  Render the diagram
                const renderResult = await mermaid.render(diagramId, source);
                if (signal?.aborted) {
                    throw new DOMException('Aborted', 'AbortError');
                }

                writeOut(mermaidContainer, renderResult.svg);
                renderResult.bindFunctions?.(mermaidContainer);
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    const errorMessageNode = document.createElement('pre');
                    errorMessageNode.className = 'mermaid-error';
                    errorMessageNode.innerText = error.message;
                    writeOut(mermaidContainer, errorMessageNode.outerHTML);
                }

                throw error;
            }
        })()
    };
}

export async function renderMermaidBlocksInElement(root: HTMLElement, writeOut: (mermaidContainer: HTMLElement, content: string) => void, signal?: AbortSignal): Promise<void> {
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
    for (const mermaidContainer of root.querySelectorAll<HTMLElement>('.mermaid')) {
        const result = renderMermaidElement(mermaidContainer, writeOut, signal);
        if (result) {
            renderPromises.push(result.p);
        }
    }

    await Promise.all(renderPromises);
}

export async function registerMermaidAddons() {
    mermaid.registerIconPacks(iconPacks);
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