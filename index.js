"use strict"

module.exports.activate = () => {
    return {
        extendMarkdownIt(md) {
            const highlight = md.options.highlight;
            md.options.highlight = (code, lang) => {
                /* Class annotation doesn't work
                https://github.com/mjbvz/vscode-markdown-mermaid/issues/39 */
                if (code.includes("classDiagram")) {
                    code = code.replace(/<<[A-Za-z].*>>/g, "");
                }

                if (lang && lang.match(/\bmermaid\b/i)) {
                    return `<div class="mermaid">${code}</div>`;
                }
                return highlight(code, lang);
            };
            return md;
        }
    }
}
