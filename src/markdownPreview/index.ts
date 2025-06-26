/**
 * Main entrypoint for the markdown preview.
 * 
 * This runs in the markdown preview's webview.
 */
import mermaid, { MermaidConfig } from 'mermaid';
import { registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';
import { applyHandDrawnStyle } from '../shared-handdrawn';

function init() { 
    const configSpan = document.getElementById('markdown-mermaid');
    const darkModeTheme = configSpan?.dataset.darkModeTheme;
    const lightModeTheme = configSpan?.dataset.lightModeTheme;
    const maxTextSize = configSpan?.dataset.maxTextSize;
    const enableHandDrawnStyle = configSpan?.dataset.enableHandDrawnStyle === 'true';

    const config: MermaidConfig = {
        startOnLoad: false,
        maxTextSize: maxTextSize ? Number(maxTextSize) : 50000,
        theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? darkModeTheme ?? 'dark'
            : lightModeTheme ?? 'default' ) as MermaidConfig['theme'],
    };

    mermaid.initialize(config);
    registerMermaidAddons();
    
    renderMermaidBlocksInElement(document.body, (mermaidContainer, content) => {
        mermaidContainer.innerHTML = content;
        
        // 根据配置决定是否应用手绘风格
        if (enableHandDrawnStyle) {
            // 获取当前主题信息
            const currentTheme = config.theme || 'default';
            const isDarkMode = document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast');
            
            // 给 SVG 一些时间来加载样式，然后应用手绘风格
            setTimeout(() => {
                applyHandDrawnStyle(mermaidContainer, currentTheme, isDarkMode);
            }, 50);
        }
    });
}

window.addEventListener('vscode.markdown.updateContent', init);
init();
