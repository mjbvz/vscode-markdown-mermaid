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
        const darkModeTheme = sanitizeMermaidTheme(vscode.workspace.getConfiguration(configSection).get('darkModeTheme'));
        const lightModeTheme = sanitizeMermaidTheme(vscode.workspace.getConfiguration(configSection).get('lightModeTheme'));
<<<<<<< HEAD
        const maxTextSize = vscode.workspace.getConfiguration(configSection).get('maxTextSize') as number;
        return `<span id="${configSection}" aria-hidden="true"
                    data-dark-mode-theme="${darkModeTheme}"
                    data-light-mode-theme="${lightModeTheme}"
                    data-max-text-size="${maxTextSize}"></span>
=======
        const enablePanZoom = vscode.workspace.getConfiguration(configSection).get('enablePanZoom') as Boolean;
        return `<span id="${configSection}" aria-hidden="true"
                    data-dark-mode-theme="${darkModeTheme}"
                    data-light-mode-theme="${lightModeTheme}"
<<<<<<< HEAD
=======
                    data-max-text-size="${maxTextSize}"
>>>>>>> ab89051 (Removed extra '>')
                    data-enable-pan-zoom=${enablePanZoom}></span>
>>>>>>> 960537e (Added enable pan zoom config setting)
                ${render.apply(md.renderer, args)}`;
    };
    return md;
}