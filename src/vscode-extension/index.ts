import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { extendMarkdownItWithMermaid } from '../shared-md-mermaid';
import { configSection } from './config';
import { injectMermaidTheme } from './themeing';

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(configSection) || e.affectsConfiguration('workbench.colorTheme')) {
            vscode.commands.executeCommand('markdown.preview.refresh');
        }
    }));

    // Register URI handler for mermaid diagram links
    ctx.subscriptions.push(vscode.window.registerUriHandler({
        handleUri(uri: vscode.Uri) {
            // Handle URIs like: vscode://bierner.markdown-mermaid/open?file=/path/to/file.ts&line=25
            if (uri.path === '/open') {
                const query = new URLSearchParams(uri.query);
                const fileParam = query.get('file');
                const lineParam = query.get('line');

                if (fileParam) {
                    let fileUri: vscode.Uri;

                    // Handle both absolute paths and workspace-relative paths
                    if (fileParam.startsWith('/')) {
                        // Absolute path
                        fileUri = vscode.Uri.file(fileParam);
                    } else {
                        // Relative path - resolve against workspace root
                        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                        if (workspaceFolder) {
                            fileUri = vscode.Uri.joinPath(workspaceFolder.uri, fileParam);
                        } else {
                            vscode.window.showErrorMessage(`Cannot resolve relative path: ${fileParam} (no workspace folder open)`);
                            return;
                        }
                    }

                    // Open the file
                    vscode.workspace.openTextDocument(fileUri).then(doc => {
                        const line = lineParam ? Math.max(0, parseInt(lineParam) - 1) : 0; // Convert to 0-based
                        const position = new vscode.Position(line, 0);

                        // Strategy: When user clicks a link in markdown preview, open source file
                        // in a DIFFERENT viewColumn to keep preview and source side-by-side
                        // We don't rely on activeTab (timing issues), instead we find a column
                        // that doesn't contain ANY preview tabs

                        // 1. Get all viewColumns and their tabs
                        const allTabGroups = vscode.window.tabGroups.all;
                        const columnInfo = allTabGroups.map(group => ({
                            viewColumn: group.viewColumn,
                            tabs: group.tabs.map(tab => tab.label)
                        }));

                        // 2. Find the first viewColumn that does NOT contain any Preview tabs
                        // Preview tabs typically have labels starting with "Preview "
                        let targetColumn: vscode.ViewColumn;
                        const targetColumnInfo = columnInfo.find(info =>
                            !info.tabs.some(tabLabel => tabLabel.startsWith('Preview '))
                        );

                        if (targetColumnInfo) {
                            // Found a column without any preview tabs - use it
                            targetColumn = targetColumnInfo.viewColumn;
                        } else {
                            // All columns contain preview tabs - create a new column
                            targetColumn = vscode.ViewColumn.Beside;
                        }

                        vscode.window.showTextDocument(doc, {
                            selection: new vscode.Range(position, position),
                            viewColumn: targetColumn,
                            preserveFocus: false  // Focus the opened source file
                        });
                    }, (err: Error) => {
                        vscode.window.showErrorMessage(`Failed to open file: ${err.message}`);
                    });
                }
            }
        }
    }));

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
