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
        const maxTextSize = config.get('maxTextSize') as number;
        const enableZoomPan = config.get('enableZoomPan', true) as boolean;
        const minZoom = config.get('minZoom', 0.2) as number;
        const maxZoom = config.get('maxZoom', 10) as number;
        const zoomStep = config.get('zoomStep', 0.25) as number;
        return `<span id="${configSection}" aria-hidden="true"
                    data-dark-mode-theme="${darkModeTheme}"
                    data-light-mode-theme="${lightModeTheme}"
                    data-max-text-size="${maxTextSize}"
                    data-zoom-pan-enabled="${enableZoomPan}"
                    data-zoom-min-zoom="${minZoom}"
                    data-zoom-max-zoom="${maxZoom}"
                    data-zoom-step="${zoomStep}"></span>
                ${render.apply(md.renderer, args)}`;
    };
    return md;
}