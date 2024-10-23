/**
 * Main entrypoint for rendering notebooks.
 * 
 * Unlike the markdown preview where the Mermaid syntax support and rendering are split between the extension and the webview,
 * for notebooks everything happens inside of the notebook's webview.
 * 
 */
import type * as MarkdownIt from 'markdown-it';
import mermaid from 'mermaid';
import type { RendererContext } from 'vscode-notebook-renderer';
import { extendMarkdownItWithMermaid } from '../shared-md-mermaid';
import { loadMermaidConfig, registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';

interface MarkdownItRenderer {
    extendMarkdownIt(fn: (md: MarkdownIt) => void): void;
}

export async function activate(ctx: RendererContext<void>) {
    const markdownItRenderer = await ctx.getRenderer('vscode.markdown-it-renderer') as MarkdownItRenderer | undefined;
    if (!markdownItRenderer) {
        throw new Error(`Could not load 'vscode.markdown-it-renderer'`);
    }

    mermaid.initialize(loadMermaidConfig());
    await registerMermaidAddons();

    markdownItRenderer.extendMarkdownIt((md: MarkdownIt) => {
        extendMarkdownItWithMermaid(md, { languageIds: () => ['mermaid'] });

        const render = md.renderer.render;
        debugger;
        md.renderer.render = function (tokens, options, env) {
            const result = render.call(this, tokens, options, env);

            const shadowRoot = document.getElementById(env?.outputItem.id)?.shadowRoot;

            const temp = document.createElement('div');
            temp.innerHTML = result;
            debugger;
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
