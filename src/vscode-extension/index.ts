import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { extendMarkdownItWithMermaid } from '../shared-md-mermaid';
import { configSection } from './config';
import { injectMermaidTheme } from './themeing';

let activeWebviewPanel: vscode.WebviewPanel | undefined;
let extensionContext: vscode.ExtensionContext;

function createMermaidWebviewPanel(source: string, index: number): vscode.WebviewPanel {
    if (activeWebviewPanel) {
        activeWebviewPanel.reveal();
        activeWebviewPanel.webview.postMessage({ command: 'updateDiagram', source, index });
        return activeWebviewPanel;
    }

    const panel = vscode.window.createWebviewPanel(
        'mermaidDiagram',
        `Mermaid Diagram ${index + 1}`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    const config = vscode.workspace.getConfiguration(configSection);
    const darkModeTheme = config.get<string>('darkModeTheme', 'dark');
    const lightModeTheme = config.get<string>('lightModeTheme', 'default');
    const isDark = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark || 
                   vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;

    panel.webview.html = getWebviewContent(source, isDark ? darkModeTheme : lightModeTheme);

    panel.onDidDispose(() => {
        activeWebviewPanel = undefined;
    });

    panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'close') {
            panel.dispose();
        }
    });

    activeWebviewPanel = panel;
    return panel;
}

function getWebviewContent(source: string, theme: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid Diagram</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
        }
        .toolbar {
            padding: 12px;
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            background: var(--vscode-editorWidget-background);
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .button {
            padding: 6px 12px;
            border: 1px solid var(--vscode-button-border);
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            border-radius: 2px;
        }
        .button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        .diagram-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
            padding: 16px;
        }
        .diagram-container svg {
            max-width: 100%;
            height: auto;
        }
        .loading, .error {
            text-align: center;
            padding: 20px;
        }
        .error {
            color: var(--vscode-errorForeground);
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <button class="button" onclick="closePanel()">Close</button>
    </div>
    <div class="diagram-container" id="diagram-container">
        <div class="loading">Rendering diagram...</div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const container = document.getElementById('diagram-container');
        const source = ${JSON.stringify(source)};
        const theme = ${JSON.stringify(theme)};

        mermaid.initialize({
            startOnLoad: false,
            theme: theme
        });

        async function renderDiagram(diagramSource) {
            const sourceToRender = diagramSource || source;
            try {
                const renderId = 'mermaid-' + Math.random().toString(36).substr(2, 9);
                const result = await mermaid.render(renderId, sourceToRender);
                container.innerHTML = result.svg;
                if (result.bindFunctions) {
                    result.bindFunctions(container);
                }
            } catch (error) {
                container.innerHTML = '<div class="error">' + (error.message || String(error)) + '</div>';
            }
        }

        function closePanel() {
            vscode.postMessage({ command: 'close' });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateDiagram') {
                const newSource = message.source;
                renderDiagram(newSource);
            }
        });

        renderDiagram();
    </script>
</body>
</html>`;
}

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(configSection) || e.affectsConfiguration('workbench.colorTheme')) {
            vscode.commands.executeCommand('markdown.preview.refresh');
        }
    }));

    extensionContext = ctx;

    const openDiagramCommand = vscode.commands.registerCommand('markdown-mermaid.openDiagram', (encoded?: string) => {
        if (!encoded) {
            console.error('Invalid arguments for markdown-mermaid.openDiagram');
            return;
        }
        
        try {
            const data = JSON.parse(decodeURIComponent(escape(atob(encoded))));
            if (data.source && typeof data.index === 'number') {
                createMermaidWebviewPanel(data.source, data.index);
            } else {
                console.error('Invalid diagram data format');
            }
        } catch (error) {
            console.error('Failed to decode diagram data:', error);
        }
    });
    ctx.subscriptions.push(openDiagramCommand);

    return {
        extendMarkdownIt(md: MarkdownIt) {
            extendMarkdownItWithMermaid(md, {
                languageIds: () => {
                    return vscode.workspace.getConfiguration(configSection).get<string[]>('languages', ['mermaid']);
                }
            });
            md.use(injectMermaidTheme);
            return md;
        }
    };
}
