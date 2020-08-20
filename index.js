"use strict"

module.exports.activate = () => {
    const pluginKeyword = 'mermaid';
    const tokenTypeInline = 'inline';

    return {
        extendMarkdownIt(md) {
            md.use(require('markdown-it-container'), pluginKeyword, {
                anyClass: true,
                validate: () => true,

                render: (tokens, idx) => {
                    const token = tokens[idx];

                    if (token.info.trim() == pluginKeyword) {
                        for (const [i, value] of tokens.entries()) {
                            if (value.tag == 'p') {
                                value.type = tokenTypeInline
                                value.tag = ''
                                value.content = ''
                                value.children = []
                            } else if (value != undefined && value.type == tokenTypeInline) {
                                value.content = preProcess(value.content);
                            }
                        }
                    }

                    if (token.nesting === 1) {
                        return `<div class="${pluginKeyword}">`;
                    } else {
                        return '</div>';
                    }
                }
            });

            const highlight = md.options.highlight;
            md.options.highlight = (code, lang) => {
                if (lang && lang.match(/\bmermaid\b/i)) {
                    return `<div class="${pluginKeyword}">${preProcess(code)}</div>`;
                }
                return highlight(code, lang);
            };
            return md;
        }
    }
}

const preProcess = (/** @type {string} */source) =>
    source
        .replace(/\</g, '&lt;')
        .replace(/\>/g, '&gt;');