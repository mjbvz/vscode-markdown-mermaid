import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { decodeBase64Url } from '../shared-mermaid/base64url';
import { MermaidExtensionConfig } from '../shared-mermaid/config';
import { extractMermaidBlocks } from '../shared-mermaid';
import { extendMarkdownItWithMermaid } from '../shared-md-mermaid';
import { configSection, getConfiguredLanguageIds, getMermaidConfigData, injectMermaidConfig } from './config';

const openMermaidViewerCommand = 'markdown-mermaid.openMermaidViewer';
const viewerViewType = 'markdown-mermaid.viewer';
const openMermaidViewerPath = '/open-mermaid-viewer';

interface MermaidViewerRequest {
    readonly source: vscode.Uri;
    readonly containerId: string;
    readonly config?: Partial<MermaidExtensionConfig>;
}

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(configSection) || e.affectsConfiguration('workbench.colorTheme')) {
            vscode.commands.executeCommand('markdown.preview.refresh');
        }
    }));

    ctx.subscriptions.push(vscode.commands.registerCommand(openMermaidViewerCommand, async (request: MermaidViewerRequest) => {
        await openMermaidViewer(ctx, request);
    }));

    ctx.subscriptions.push(vscode.window.registerUriHandler({
        handleUri: async (uri: vscode.Uri) => {
            const request = parseMermaidViewerUri(uri, ctx.extension.id);
            if (!request) {
                return;
            }

            await vscode.commands.executeCommand(openMermaidViewerCommand, request);
        }
    }));

    return {
        extendMarkdownIt(md: MarkdownIt) {
            extendMarkdownItWithMermaid(md, {
                languageIds: () => getConfiguredLanguageIds(vscode.workspace.getConfiguration(configSection)),
            });
            injectMermaidConfig(md, {
                extensionId: ctx.extension.id,
                uriScheme: vscode.env.uriScheme,
            });
            return md;
        }
    };
}

async function openMermaidViewer(ctx: vscode.ExtensionContext, request: MermaidViewerRequest): Promise<void> {
    const document = await vscode.workspace.openTextDocument(request.source);
    const workspaceConfig = vscode.workspace.getConfiguration(configSection, document.uri);
    const config = {
        ...getMermaidConfigData(workspaceConfig),
        ...request.config,
    } as MermaidExtensionConfig;
    const mermaidBlock = extractMermaidBlocks(document.getText(), getConfiguredLanguageIds(workspaceConfig))
        .find(block => block.containerId === request.containerId);

    if (!mermaidBlock) {
        vscode.window.showWarningMessage('Could not find the requested Mermaid diagram in the current Markdown document.');
        return;
    }

    const panel = vscode.window.createWebviewPanel(viewerViewType, 'Mermaid Viewer', vscode.ViewColumn.Active, {
        enableScripts: true,
        localResourceRoots: [ctx.extensionUri],
    });
    panel.webview.html = getViewerHtml(ctx, panel.webview, mermaidBlock.source, config);
    panel.reveal(vscode.ViewColumn.Active);

    try {
        await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
    } catch {
        vscode.window.setStatusBarMessage('Markdown Mermaid: opened viewer in the current window because moving editors to a new window is unavailable here.', 5000);
    }
}

function parseMermaidViewerUri(uri: vscode.Uri, extensionId: string): MermaidViewerRequest | undefined {
    if (uri.authority !== extensionId || uri.path !== openMermaidViewerPath) {
        return;
    }

    const params = new URLSearchParams(uri.query);
    const source = params.get('source');
    const containerId = params.get('containerId');
    if (!source || !containerId) {
        return;
    }

    try {
        return {
            source: vscode.Uri.parse(source, true),
            containerId,
            config: parseViewerConfig(params.get('config')),
        };
    } catch {
        vscode.window.showWarningMessage('Could not open Mermaid viewer from the current preview link.');
        return;
    }
}

function parseViewerConfig(encodedConfig: string | null): Partial<MermaidExtensionConfig> | undefined {
    if (!encodedConfig) {
        return;
    }

    try {
        const parsed = JSON.parse(decodeBase64Url(encodedConfig));
        return parsed && typeof parsed === 'object' ? parsed as Partial<MermaidExtensionConfig> : undefined;
    } catch {
        return;
    }
}

function getViewerHtml(
    ctx: vscode.ExtensionContext,
    webview: vscode.Webview,
    source: string,
    config: MermaidExtensionConfig
): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(ctx.extensionUri, 'dist-viewer', 'index.bundle.js'));
    const escapedConfig = escapeHtmlAttribute(JSON.stringify(config));
    const escapedSource = escapeHtml(source);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource} data:; script-src ${webview.cspSource};">
    <title>Mermaid Viewer</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            background: var(--vscode-editor-background);
        }

        body {
            min-height: 100vh;
            box-sizing: border-box;
            overflow: auto;
            padding: 12px;
        }

        .mermaid-viewer-root {
            display: block;
            width: 100%;
        }
    </style>
</head>
<body>
    <span id="${configSection}" aria-hidden="true" data-config="${escapedConfig}"></span>
    <div class="mermaid-viewer-root">
        <div class="mermaid">${escapedSource}</div>
    </div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value: string): string {
    return escapeHtml(value).replace(/"/g, '&quot;');
}
