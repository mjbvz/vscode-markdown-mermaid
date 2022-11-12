import * as mdItContainer from 'markdown-it-container';
import vscode from 'vscode';

const configSection = 'markdown-mermaid';

const pluginKeyword = 'mermaid';
const tokenTypeInline = 'inline';
const ttContainerOpen = 'container_' + pluginKeyword + '_open';
const ttContainerClose = 'container_' + pluginKeyword + '_close';

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(configSection) || e.affectsConfiguration('workbench.colorTheme')) {
            vscode.commands.executeCommand('markdown.preview.refresh');
        }
    }));

    return {
        extendMarkdownIt(md: any) {
            md.use(mdItContainer, pluginKeyword, {
                anyClass: true,
                validate: (info: string) => {
                    return info.trim() === pluginKeyword;
                },

                render: (tokens: any[], idx: number) => {
                    const token = tokens[idx];

                    var src = '';
                    if (token.type === ttContainerOpen) {
                        for (var i = idx + 1; i < tokens.length; i++) {
                            const value = tokens[i]
                            if (value === undefined || value.type === ttContainerClose) {
                                break;
                            }
                            src += value.content;
                            if (value.block && value.nesting <= 0) {
                                src += '\n';
                            }
                            // Clear these out so markdown-it doesn't try to render them
                            value.tag = '';
                            value.type = tokenTypeInline;
                            // Code can be triggered multiple times, even if tokens are not updated (eg. on editor losing and regaining focus). Content must be preserved, so src can be realculated in such instances.
                            //value.content = ''; 
                            value.children = [];
                        }
                    }

                    if (token.nesting === 1) {
                        return `<div class="${pluginKeyword}">${preProcess(src)}`;
                    } else {
                        return '</div>';
                    }
                }
            });

            md.use(injectMermaidTheme);

            const highlight = md.options.highlight;
            md.options.highlight = (code: string, lang: string) => {
                if (lang && lang.match(/\b(mermaid)|(graph)\b/i)) {
                    return `<pre style="all:unset;"><div class="${pluginKeyword}">${preProcess(code)}</div></pre>`;
                }
                return highlight(code, lang);
            };
            return md;
        }
    }
}

const preProcess = (source: string) =>
    source
        .replace(/\</g, '&lt;')
        .replace(/\>/g, '&gt;');

const defaultMermaidTheme = 'default';
const validMermaidThemes = [
    'base',
    'forest',
    'dark',
    'default',
    'neutral',
];
function sanitizeMermaidTheme(theme: string | undefined) {
    if (typeof theme !== 'string') {
        return defaultMermaidTheme;
    }
    return validMermaidThemes.includes(theme) ? theme : defaultMermaidTheme;
}

function injectMermaidTheme(md: any) {
    const render = md.renderer.render;
    md.renderer.render = function () {
        const darkModeTheme = sanitizeMermaidTheme(vscode.workspace.getConfiguration(configSection).get('darkModeTheme'));
        const lightModeTheme = sanitizeMermaidTheme(vscode.workspace.getConfiguration(configSection).get('lightModeTheme'));
        return `<span id="${configSection}" aria-hidden="true"
                    data-dark-mode-theme="${darkModeTheme}"
                    data-light-mode-theme="${lightModeTheme}"></span>
                ${render.apply(md.renderer, arguments)}`;
    };
    return md;
}