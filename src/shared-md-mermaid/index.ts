import type MarkdownIt from 'markdown-it';

const mermaidLanguageId = 'mermaid';
const containerTokenName = 'mermaidContainer';

const min_markers = 3;
const marker_str = ':';
const marker_char = marker_str.charCodeAt(0);
const marker_len = marker_str.length;

/**
 * Extends markdown-it so that it can render mermaid diagrams.
 * 
 * This does not actually implement rendering of mermaid diagrams. Instead we just make sure that mermaid 
 * block syntax is properly parsed by markdown-it. All actual mermaid rendering happens in the webview
 * where the markdown is rendered.
 */
export function extendMarkdownItWithMermaid(md: MarkdownIt, config: { languageIds(): readonly string[] }) {
    // Code forked from markdown-it-container
    // Fork was done as we want to get the raw text inside container instead of treating it as markdown
    md.use((md: MarkdownIt) => {
        function container(state: MarkdownIt.StateBlock, startLine: number, endLine: number, silent: boolean) {
            let pos: number;
            let auto_closed = false;
            let start = state.bMarks[startLine] + state.tShift[startLine];
            let max = state.eMarks[startLine];

            // Check out the first character quickly,
            // this should filter out most of non-containers
            //
            if (marker_char !== state.src.charCodeAt(start)) {
                return false;
            }

            // Check out the rest of the marker string
            //
            for (pos = start + 1; pos <= max; pos++) {
                if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
                    break;
                }
            }

            const marker_count = Math.floor((pos - start) / marker_len);
            if (marker_count < min_markers) {
                return false;
            }
            pos -= (pos - start) % marker_len;

            const markup = state.src.slice(start, pos);
            const params = state.src.slice(pos, max);
            if (params.trim().split(' ')[0].toLowerCase() !== mermaidLanguageId) { return false; }

            // Since start is found, we can report success here in validation mode
            //
            if (silent) { return true; }

            // Search for the end of the block
            //
            let nextLine = startLine;

            for (; ;) {
                nextLine++;
                if (nextLine >= endLine) {
                    // unclosed block should be autoclosed by end of document.
                    // also block seems to be autoclosed by end of parent
                    break;
                }

                start = state.bMarks[nextLine] + state.tShift[nextLine];
                max = state.eMarks[nextLine];

                if (start < max && state.sCount[nextLine] < state.blkIndent) {
                    // non-empty line with negative indent should stop the list:
                    // - ```
                    //  test
                    break;
                }

                if (marker_char !== state.src.charCodeAt(start)) { continue; }

                if (state.sCount[nextLine] - state.blkIndent >= 4) {
                    // closing fence should be indented less than 4 spaces
                    continue;
                }

                for (pos = start + 1; pos <= max; pos++) {
                    if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
                        break;
                    }
                }

                // closing code fence must be at least as long as the opening one
                if (Math.floor((pos - start) / marker_len) < marker_count) { continue; }

                // make sure tail has spaces only
                pos -= (pos - start) % marker_len;
                pos = state.skipSpaces(pos);

                if (pos < max) { continue; }

                // found!
                auto_closed = true;
                break;
            }

            const old_parent = state.parentType;
            const old_line_max = state.lineMax;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            state.parentType = 'container' as any;

            // this will prevent lazy continuations from ever going past our end marker
            state.lineMax = nextLine;

            const containerToken = state.push(containerTokenName, 'div', 1);
            containerToken.markup = markup;
            containerToken.block = true;
            containerToken.info = params;
            containerToken.map = [startLine, nextLine];
            containerToken.content = state.getLines(startLine + 1, nextLine, state.blkIndent, true);

            // Advanced paste token end
            state.parentType = old_parent;
            state.lineMax = old_line_max;
            state.line = nextLine + (auto_closed ? 1 : 0);

            return true;
        }

        md.block.ruler.before('fence', containerTokenName, container, {
            alt: ['paragraph', 'reference', 'blockquote', 'list']
        });
        md.renderer.rules[containerTokenName] = (tokens: MarkdownIt.Token[], idx: number) => {
            const token = tokens[idx];
            const src = token.content;
            return `<div class="${mermaidLanguageId}">${preProcess(src)}</div>`;
        };
    });

    const highlight = md.options.highlight;
    md.options.highlight = (code: string, lang: string, attrs: string) => {
        const reg = new RegExp('\\b(' + config.languageIds().map(escapeRegExp).join('|') + ')\\b', 'i');
        if (lang && reg.test(lang)) {
            return `<pre style="all:unset;"><div class="${mermaidLanguageId}">${preProcess(code)}</div></pre>`;
        }
        return highlight?.(code, lang, attrs) ?? code;
    };
    return md;
}

function preProcess(source: string): string {
    return source
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n+$/, '')
        .trimStart();
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
