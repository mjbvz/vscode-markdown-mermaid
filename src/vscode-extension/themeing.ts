import type MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { configSection } from './config';

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

export function injectMermaidTheme(md: MarkdownIt) {
    const render = md.renderer.render;
    md.renderer.render = function (...args) {
        const config = vscode.workspace.getConfiguration(configSection);

        const darkModeTheme = sanitizeMermaidTheme(config.get('darkModeTheme'));
        const lightModeTheme = sanitizeMermaidTheme(config.get('lightModeTheme'));
        
        let directivesAttr = '';
        try {
            const rawDirectives = config.get<object>("directives", {});
            directivesAttr = JSON.stringify(rawDirectives);
        } catch (e) {
            console.error('Failed to serialize mermaid directives', e);
        }

        return `<span id="${configSection}" aria-hidden="true"
                    data-dark-mode-theme="${darkModeTheme}"
                    data-light-mode-theme="${lightModeTheme}"
                    data-directives='${directivesAttr.replaceAll(`'`, '&apos;')}'></span>
                ${render.apply(md.renderer, args)}`;
    };
    return md;
}