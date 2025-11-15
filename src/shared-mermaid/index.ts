import elkLayouts from '@mermaid-js/layout-elk';
import zenuml from '@mermaid-js/mermaid-zenuml';
import mermaid, { MermaidConfig } from 'mermaid';
import { iconPackConfig, requireIconPack } from './iconPackConfig';

function renderMermaidElement(
    mermaidContainer: HTMLElement,
    writeOut: (mermaidContainer: HTMLElement, content: string) => void,
): {
    containerId: string;
    p: Promise<void>;
} {
    const containerId = `mermaid-container-${crypto.randomUUID()}`;
    const diagramId = `mermaid-${crypto.randomUUID()}`;

    const source = mermaidContainer.textContent ?? '';
    mermaidContainer.id = containerId;
    mermaidContainer.dataset.mermaidSource = source;
    mermaidContainer.innerHTML = '';

    return {
        containerId,
        p: (async () => {
            try {
                // Catch any parsing errors
                await mermaid.parse(source);

                //  Render the diagram
                const renderResult = await mermaid.render(diagramId, source);
                writeOut(mermaidContainer, renderResult.svg);
                renderResult.bindFunctions?.(mermaidContainer);
            } catch (error) {
<<<<<<< HEAD
                if (error instanceof Error) {
                    const errorMessageNode = document.createElement('pre');
                    errorMessageNode.className = 'mermaid-error';
                    errorMessageNode.innerText = error.message;
                    writeOut(mermaidContainer, errorMessageNode.outerHTML);
                }

                throw error;
=======
                const errorMessageNode = document.createElement('pre');
                errorMessageNode.className = 'mermaid-error';
                errorMessageNode.innerText = error instanceof Error ? error.message : String(error);
                writeOut(mermaidContainer, errorMessageNode.outerHTML, index);
                console.error('Mermaid render failed', error);
>>>>>>> e883245 (shared-mermaid: Log to console instead of breaking)
            }
        })()
    };
}

export async function renderMermaidBlocksInElement(root: HTMLElement, writeOut: (mermaidContainer: HTMLElement, content: string) => void): Promise<void> {
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
<<<<<<< HEAD
    for (const mermaidContainer of root.querySelectorAll<HTMLElement>('.mermaid')) {
        renderPromises.push(renderMermaidElement(mermaidContainer, writeOut).p);
=======
    const mermaidElements = root.querySelectorAll<HTMLElement>('.mermaid');
    for (let i=0; i<mermaidElements.length; i++) {
        renderPromises.push(renderMermaidElement(mermaidElements[i], i, writeOut).p);
>>>>>>> e883245 (shared-mermaid: Log to console instead of breaking)
    }

    for (const p of renderPromises) {
        await p;
    }
<<<<<<< HEAD
=======

    return mermaidElements.length;
>>>>>>> e883245 (shared-mermaid: Log to console instead of breaking)
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