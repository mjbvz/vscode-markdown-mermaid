/**
 * Combine mermaid light and dark css, and adapt them to use vscode styles instead
 * 
 */
'use strict';

const path = require('path');
const fs = require('fs');
const sass = require('node-sass');

const inputPath = path.join('node_modules', 'mermaid', 'dist');
const fullPath = path.join(__dirname, '..', inputPath);


function buildMermaidCss(light, dark) {
    const css = `/* Generated from '${inputPath}' */

${light}

.vscode-dark {
    ${dark}
}
`
    return sass.renderSync({ data: css }).css;
} 


const light = fs.readFileSync(path.join(inputPath, 'mermaid.css'), 'utf8');
const dark = fs.readFileSync(path.join(inputPath, 'mermaid.dark.css'), 'utf8');

fs.writeFileSync(
    path.join(__dirname, '..', 'mermaid-markdown.css'),
    buildMermaidCss(light, dark));