import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { ClickDragMode, ShowControlsMode } from '../shared-mermaid/config';

export const configSection = 'markdown-mermaid';

const defaultMermaidTheme = 'default';
const validMermaidThemes = [
    'base',
    'forest',
    'dark',
    'default',
    'neutral',
];

function sanitizeMermaidTheme(theme: string | undefined) {
    return typeof theme === 'string' && validMermaidThemes.includes(theme) ? theme : defaultMermaidTheme;
}

export function injectMermaidConfig(md: MarkdownIt) {
    const render = md.renderer.render;
    md.renderer.render = function (...args) {
        const config = vscode.workspace.getConfiguration(configSection);
        const configData = {
            darkModeTheme: sanitizeMermaidTheme(config.get('darkModeTheme')),
            lightModeTheme: sanitizeMermaidTheme(config.get('lightModeTheme')),
            maxTextSize: config.get('maxTextSize') as number,
            clickDrag: config.get<ClickDragMode>('mouseNavigation.enabled', ClickDragMode.Alt),
            showControls: config.get<ShowControlsMode>('controls.show', ShowControlsMode.OnHoverOrFocus),
            resizable: config.get<boolean>('resizable', true),
            maxHeight: config.get<string>('maxHeight', ''),
        };

        const escapedConfig = escapeHtmlAttribute(JSON.stringify(configData));
        return `<span id="${configSection}" aria-hidden="true" data-config="${escapedConfig}"></span>
                ${render.apply(md.renderer, args)}`;
    };
    return md;
}

function escapeHtmlAttribute(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
