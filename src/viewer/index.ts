import mermaid, { MermaidConfig } from 'mermaid';
import { loadExtensionConfig, registerMermaidAddons, renderMermaidBlocksInElement } from '../shared-mermaid';
import { ClickDragMode } from '../shared-mermaid/config';
import { DiagramManager, FullscreenBehavior } from '../shared-mermaid/diagramManager';
import { IDisposable } from '../shared-mermaid/disposable';

let currentAbortController: AbortController | undefined;
let currentDisposables: IDisposable[] = [];
const diagramManager = new DiagramManager(loadExtensionConfig(), {
    fullscreenBehavior: FullscreenBehavior.Disabled,
});

async function init() {
    for (const disposable of currentDisposables) {
        disposable.dispose();
    }
    currentDisposables = [];

    currentAbortController?.abort();
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    const extConfig = loadExtensionConfig();
    const viewerConfig = {
        ...extConfig,
        // Auxiliary windows on Windows/VS Code steal focus on bare Alt,
        // so viewer pop-outs should not require Alt for panning.
        clickDrag: extConfig.clickDrag === ClickDragMode.Alt ? ClickDragMode.Always : extConfig.clickDrag,
        // A dedicated viewer should size to the diagram by default instead of
        // inheriting preview-specific max-height constraints.
        maxHeight: '',
    };
    diagramManager.updateConfig(viewerConfig);

    const config: MermaidConfig = {
        startOnLoad: false,
        maxTextSize: viewerConfig.maxTextSize,
        theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
            ? viewerConfig.darkModeTheme
            : viewerConfig.lightModeTheme) as MermaidConfig['theme'],
    };

    mermaid.initialize(config);
    await registerMermaidAddons();

    const activeIds = new Set<string>();
    await renderMermaidBlocksInElement(document.body, (mermaidContainer, content) => {
        mermaidContainer.innerHTML = content;
        activeIds.add(mermaidContainer.id);
        currentDisposables.push(diagramManager.setup(mermaidContainer.id, mermaidContainer));
    }, signal);

    diagramManager.retainStates(activeIds);
}

init();
