import type * as MarkdownIt from 'markdown-it';
import mermaid from 'mermaid';
import type { RendererContext } from 'vscode-notebook-renderer';
import { renderMermaidBlocksInElement } from '../markdownPreview/mermaid';
import { extendMarkdownItWithMermaid } from '../src/mermaid';

interface MarkdownItRenderer {
    extendMarkdownIt(fn: (md: MarkdownIt) => void): void;
}

export async function activate(ctx: RendererContext<void>) {
    const markdownItRenderer = await ctx.getRenderer('vscode.markdown-it-renderer') as MarkdownItRenderer | undefined;
    if (!markdownItRenderer) {
        throw new Error(`Could not load 'vscode.markdown-it-renderer'`);
    }

    const config = {
        startOnLoad: false,
        theme: document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast') ? 'dark' : 'default'
    };
    mermaid.initialize(config);

    markdownItRenderer.extendMarkdownIt((md: MarkdownIt) => {
        extendMarkdownItWithMermaid(md, { languageIds: () => ['mermaid'] });

        const render = md.renderer.render;

        md.renderer.render = function (...args) {
            const result = render.apply(this, args);

            const temp = document.createElement('div');
            temp.innerHTML = result;
            renderMermaidBlocksInElement(temp);
            return temp.innerHTML;
        }
        return md;
    });
};