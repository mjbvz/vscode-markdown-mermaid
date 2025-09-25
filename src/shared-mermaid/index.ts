import elkLayouts from '@mermaid-js/layout-elk';
import zenuml from '@mermaid-js/mermaid-zenuml';
import mermaid, { MermaidConfig } from 'mermaid';
import { iconPackConfig, requireIconPack } from './iconPackConfig';
import { initializeContainerZoomPan, destroyContainerZoomPan, getZoomPanConfig } from './containerZoomPan';

function renderMermaidElement(
  mermaidContainer: HTMLElement,
  writeOut: (mermaidContainer: HTMLElement, content: string) => void,
): {
  containerId: string;
  p: Promise<void>;
} {
  const containerId = `mermaid-container-${crypto.randomUUID()}`;
  const diagramId = `mermaid-${crypto.randomUUID()}`;

  const source = mermaidContainer.textContent ?? '';
  mermaidContainer.id = containerId;
  mermaidContainer.innerHTML = '';

  return {
    containerId,
    p: (async () => {
      try {
        // Catch any parsing errors
        await mermaid.parse(source);

        // Render the diagram
        const renderResult = await mermaid.render(diagramId, source);
        writeOut(mermaidContainer, renderResult.svg);
        renderResult.bindFunctions?.(mermaidContainer);
      } catch (error) {
        if (error instanceof Error) {
          const errorMessageNode = document.createElement('pre');
          errorMessageNode.className = 'mermaid-error';
          errorMessageNode.innerText = error.message;
          writeOut(mermaidContainer, errorMessageNode.outerHTML);
        }

        throw error;
      }
    })()
  };
}

export async function renderMermaidBlocksInElement(
  root: HTMLElement,
  writeOut: (mermaidContainer: HTMLElement, content: string) => void
): Promise<void> {
  // Cleanup existing zoom instances (new implementation)
  for (const container of root.querySelectorAll<HTMLElement>('.mermaid')) {
    destroyContainerZoomPan(container);
  }

  // Delete existing mermaid outputs
  for (const el of root.querySelectorAll('.mermaid > svg')) {
    el.remove();
  }
  for (const svg of root.querySelectorAll('svg')) {
    if (svg.parentElement?.id.startsWith('dmermaid')) {
      svg.parentElement.remove();
    }
  }

  // Get configuration
  const config = getZoomPanConfig(); // from new implementation

  // Process each mermaid container
  const renderPromises: Array<Promise<void>> = [];

  for (const mermaidContainer of root.querySelectorAll<HTMLElement>('.mermaid')) {
    const renderPromise = renderMermaidElement(mermaidContainer, writeOut).p;
    renderPromises.push(renderPromise.then(() => {
      const svg = mermaidContainer.querySelector('svg');
      if (svg) {
        // Ensure SVG keeps original dimensions; only wrapper will be transformed
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      }
      if (svg && config) {
        // Initialize zoom/pan after rendering
        setTimeout(() => {
          initializeContainerZoomPan(svg, mermaidContainer, config);
        }, 50);
      }
    }));
  }

  await Promise.all(renderPromises);
}

function registerIconPacks(config: Array<{ prefix?: string; pack: string; }>) {
  const iconPacks = config.map((iconPack) => ({
    name: iconPack.prefix || '',
    loader: () => {
      try {
        const module = requireIconPack(`./${iconPack.pack.replace('@iconify-json/', '')}`);
        return module.icons || {};
      } catch (error) {
        console.error(`Failed to load icon pack: ${iconPack.pack}`, error);
        return {};
      }
    },
  }));

  mermaid.registerIconPacks(iconPacks);
}

// Removed local getZoomPanConfig; using implementation from containerZoomPan.ts

export async function registerMermaidAddons() {
  registerIconPacks(iconPackConfig);
  mermaid.registerLayoutLoaders(elkLayouts);
  await mermaid.registerExternalDiagrams([zenuml]);
}

export function loadMermaidConfig(): MermaidConfig {
  const configSpan = document.getElementById('markdown-mermaid');
  const darkModeTheme = configSpan?.dataset.darkModeTheme;
  const lightModeTheme = configSpan?.dataset.lightModeTheme;

  return {
    startOnLoad: false,
    theme: (document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast')
      ? darkModeTheme ?? 'dark'
      : lightModeTheme ?? 'default') as MermaidConfig['theme'],
  };
}