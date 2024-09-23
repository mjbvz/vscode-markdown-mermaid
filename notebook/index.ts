import type * as MarkdownIt from 'markdown-it';
import mermaid from 'mermaid';
import { registerIconPacks } from '../src/mermaid';
import type { RendererContext } from 'vscode-notebook-renderer';
import { renderMermaidBlocksInElement } from '../markdownPreview/mermaid';
import { extendMarkdownItWithMermaid } from '../src/mermaid';
import { iconPackConfig } from '../src/iconPackConfig';

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
        theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast') ? 'dark' : 'default') as 'default' | 'dark',
    };
    
    registerIconPacks(iconPackConfig);
    mermaid.initialize(config);

    markdownItRenderer.extendMarkdownIt((md: MarkdownIt) => {
        extendMarkdownItWithMermaid(md, { languageIds: () => ['mermaid'] });

        const render = md.renderer.render;

        md.renderer.render = function (tokens, options, env) {
            const result = render.call(this, tokens, options, env);

            const shadowRoot = document.getElementById(env?.outputItem.id)?.shadowRoot;

            const temp = document.createElement('div');
            temp.innerHTML = result;
            renderMermaidBlocksInElement(temp, (mermaidContainer, content) => {
                // The original element we are rendering to has been disconnected.
                const liveEl = shadowRoot?.getElementById(mermaidContainer.id);
                if (liveEl) {
                    liveEl.innerHTML = content;
                }
            });
            return temp.innerHTML;
        }
        return md;
    });
};