import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { extendMarkdownItWithMermaid } from '../shared-md-mermaid';
import { configSection, injectMermaidConfig } from './config';

export function activate(ctx: vscode.ExtensionContext) {
    // Reload the previews when the configuration changes. This is needed so that the markdown plugin can see the
    // latest configuration values
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(configSection) || e.affectsConfiguration('workbench.colorTheme')) {
            vscode.commands.executeCommand('markdown.preview.refresh');
        }
    }));

    return {
        extendMarkdownIt(md: MarkdownIt) {
            extendMarkdownItWithMermaid(md, {
                languageIds: () => {
                    return vscode.workspace.getConfiguration(configSection).get<string[]>('languages', ['mermaid']);
                }
            });
            md.use(injectMermaidConfig);
            return md;
        }
    };
}
