export interface MermaidBlockMatch {
    readonly containerId: string;
    readonly contentHash: string;
    readonly source: string;
}

export function extractMermaidBlocks(markdown: string, languageIds: readonly string[]): MermaidBlockMatch[] {
    const normalizedLanguageIds = new Set(languageIds.map(id => id.toLowerCase()));
    const matches: MermaidBlockMatch[] = [];
    const usedIds = new Set<string>();
    const lines = markdown.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        const fenceMatch = parseMermaidFence(lines, i, normalizedLanguageIds);
        if (fenceMatch) {
            if (fenceMatch.source) {
                matches.push({
                    source: fenceMatch.source,
                    contentHash: hashString(fenceMatch.source),
                    containerId: generateContentId(fenceMatch.source, usedIds),
                });
            }
            i = fenceMatch.endLine;
            continue;
        }

        const containerMatch = parseMermaidContainer(lines, i);
        if (containerMatch) {
            if (containerMatch.source) {
                matches.push({
                    source: containerMatch.source,
                    contentHash: hashString(containerMatch.source),
                    containerId: generateContentId(containerMatch.source, usedIds),
                });
            }
            i = containerMatch.endLine;
        }
    }

    return matches;
}

export function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateContentId(source: string, usedIds: Set<string>): string {
    const hash = hashString(source);
    let id = `mermaid-${hash}`;
    let counter = 0;

    while (usedIds.has(id)) {
        counter++;
        id = `mermaid-${hash}-${counter}`;
    }

    usedIds.add(id);
    return id;
}

function parseMermaidFence(lines: readonly string[], startLine: number, languageIds: ReadonlySet<string>) {
    const line = lines[startLine];
    const match = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(line);
    if (!match) {
        return;
    }

    const [, indent, fence, info] = match;
    const languageId = info.trim().split(/\s+/)[0]?.toLowerCase();
    if (!languageId || !languageIds.has(languageId)) {
        return;
    }

    let endLine = startLine + 1;
    while (endLine < lines.length) {
        const closingLine = lines[endLine];
        const closingMatch = /^(\s*)(`{3,}|~{3,})\s*$/.exec(closingLine);
        if (closingMatch && closingMatch[2][0] === fence[0] && closingMatch[2].length >= fence.length && closingMatch[1].length <= indent.length + 3) {
            break;
        }
        endLine++;
    }

    const source = lines.slice(startLine + 1, endLine).join('\n').trim();
    return { source, endLine };
}

function parseMermaidContainer(lines: readonly string[], startLine: number) {
    const line = lines[startLine];
    const match = /^(\s*)(:{3,})(.*)$/.exec(line);
    if (!match) {
        return;
    }

    const [, indent, marker, info] = match;
    const languageId = info.trim().split(/\s+/)[0]?.toLowerCase();
    if (languageId !== 'mermaid') {
        return;
    }

    let endLine = startLine + 1;
    while (endLine < lines.length) {
        const closingLine = lines[endLine];
        const closingMatch = /^(\s*)(:{3,})\s*$/.exec(closingLine);
        if (closingMatch && closingMatch[2].length >= marker.length && closingMatch[1].length <= indent.length + 3) {
            break;
        }
        endLine++;
    }

    const source = lines.slice(startLine + 1, endLine).join('\n').trim();
    return { source, endLine };
}
