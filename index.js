"use strict"

module.exports.activate = () => {
    return {
        extendMarkdownIt(md) {
            const highlight = md.options.highlight;
            md.options.highlight = (code, lang) => {
                if (lang && lang.toLowerCase() === 'mermaid') {
                    return `<div class="mermaid">${code}</div>`;
                }
                return highlight(code, lang);
            };
            return md;
        }
    }
}