/**
 * Container-level zoom & pan support for Mermaid diagrams.
 *
 * Behaviour
 * ────────────────────────────────────────────────────────────
 * • Ctrl/⌘ + Mouse wheel   → Zoom in / out, centred on cursor
 * • Ctrl/⌘ + Left-drag     → Pan
 * • Ctrl/⌘ + Right-click   → Reset view
 *
 * Implementation notes
 * ────────────────────────────────────────────────────────────
 * • The original <svg> keeps its intrinsic dimensions; a wrapper <div>
 *   is inserted to receive `transform: translate(...) scale(...)`.
 * • All event-listeners are namespaced to the instance for easy cleanup.
 * • A WeakMap tracks instances so the public helpers can re-initialise or
 *   dispose of a diagram transparently.
 */

/**
 * Fine-tuning options for zoom & pan.
 */
export interface ContainerZoomPanConfig {
  /** Smallest allowed zoom level (default 0.2 ×) */
  minZoom?: number;
  /** Largest allowed zoom level (default 10 ×) */
  maxZoom?: number;
  /** Fractional zoom applied per wheel tick (default 0.25 = 25 %) */
  zoomStep?: number;
}

/** A 2-D coordinate or displacement in CSS pixels */
interface Point {
  readonly x: number;
  readonly y: number;
}

/** Default configuration values */
const DEFAULT_CFG: Required<ContainerZoomPanConfig> = {
  minZoom: 0.2,
  maxZoom: 10,
  zoomStep: 0.25,
};

/** Utility to bound a value to an interval */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}


class ContainerZoomPan {
  private readonly container: HTMLElement;
  private readonly svg: SVGElement;
  private readonly wrapper: HTMLDivElement;
  private readonly config: Required<ContainerZoomPanConfig>;
  private readonly statusHint: HTMLDivElement;

  private scale = 1;
  private offset: Point = { x: 0, y: 0 };
  private isPanning = false;
  private startPoint: Point = { x: 0, y: 0 };

  constructor(svg: SVGElement, container: HTMLElement, cfg: ContainerZoomPanConfig = {}) {
    this.container = container;
    this.svg = svg;
    this.config = { ...DEFAULT_CFG, ...cfg };

    this.wrapper = this.createWrapper();
    this.statusHint = this.createStatusHint();
    this.prepareContainer();
    this.prepareSvg();
    this.adjustMinHeight();
    this.bindEvents();
    this.restoreState(); // Restore state before first transform
    this.updateTransform();
  }

  //#region Initialisation helpers -------------------------------------------------

  /**
   * Wrap the SVG in a div that will receive transform styles.
   */
  private createWrapper(): HTMLDivElement {
    if (this.svg.parentElement && this.svg.parentElement !== this.container) {
      return this.svg.parentElement as HTMLDivElement;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'zoom-pan-wrapper';
    Object.assign(wrapper.style, {
      width: '100%',
      height: '100%',
      transformOrigin: '0 0',
    });

    wrapper.appendChild(this.svg);
    this.container.appendChild(wrapper);
    return wrapper;
  }

  /**
   * Create status hint overlay that shows keyboard shortcuts.
   * Positioned on container (outside zoom/pan area) so it doesn't transform.
   */
  private createStatusHint(): HTMLDivElement {
    const hint = document.createElement('div');
    hint.className = 'zoom-pan-status-hint';

    // Detect platform for correct modifier key display
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const modKey = isMac ? '⌘' : 'Ctrl';

    hint.innerHTML = `
      ${modKey}+Wheel: Zoom<br>
      ${modKey}+Drag: Pan<br>
      ${modKey}+Right-click: Reset
    `;

    Object.assign(hint.style, {
      position: 'absolute',
      top: '8px',
      right: '8px',
      background: 'rgba(0, 0, 0, 0.75)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '11px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.5',
      textAlign: 'right',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      zIndex: '100',
    });

    this.container.appendChild(hint);
    return hint;
  }

  /**
   * Apply baseline styles to the container so interactions feel natural.
   */
  private prepareContainer(): void {
    Object.assign(this.container.style, {
      overflow: 'hidden',
      position: 'relative',
      cursor: 'grab',
      userSelect: 'none',
    });
  }

  /**
   * Keep the SVG as-is, but ensure its aspect ratio is honoured on resize.
   */
  private prepareSvg(): void {
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  /**
   * Add extra vertical room for extremely wide diagrams to enable panning.
   */
  private adjustMinHeight(): void {
    const bbox = (this.svg as SVGSVGElement).getBBox();
    const aspect = bbox.width / (bbox.height || 1);

    const baseHeight = bbox.height + 60; // intrinsic height + padding
    let minHeight = baseHeight;

    if (aspect > 3) {
      minHeight = Math.max(baseHeight, 300);
    } else if (aspect > 1.5) {
      minHeight = Math.max(baseHeight, 250);
    }

    this.container.style.minHeight = `${minHeight}px`;
  }

  //#endregion --------------------------------------------------------------------

  //#region State persistence ------------------------------------------------------

  /**
   * Generate a stable storage key based on document URI and diagram index.
   * This allows state to persist across re-renders of the same file,
   * but reset when switching to different files.
   */
  private getStorageKey(): string {
    const allContainers = document.querySelectorAll('.mermaid');
    const index = Array.from(allContainers).indexOf(this.container);
    // Use document.baseURI or a data attribute if available for document identification
    const docUri = document.baseURI || window.location.href;
    return `mermaid-zoom-pan-${docUri}-${index}`;
  }

  /**
   * Save current zoom/pan state to sessionStorage.
   */
  private saveState(): void {
    try {
      const key = this.getStorageKey();
      const state = {
        scale: this.scale,
        offset: this.offset,
      };
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      // Silently fail if sessionStorage is unavailable (e.g., in restricted contexts)
    }
  }

  /**
   * Restore zoom/pan state from sessionStorage if available.
   */
  private restoreState(): void {
    try {
      const key = this.getStorageKey();
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const state = JSON.parse(saved);
        // Validate restored values
        if (typeof state.scale === 'number' && state.offset?.x !== undefined && state.offset?.y !== undefined) {
          this.scale = clamp(state.scale, this.config.minZoom, this.config.maxZoom);
          this.offset = { x: state.offset.x, y: state.offset.y };
        }
      }
    } catch (error) {
      // Silently fail if sessionStorage is unavailable or data is corrupted
    }
  }

  //#endregion --------------------------------------------------------------------

  //#region Event handling ---------------------------------------------------------

  /** Bind all required DOM events */
  private bindEvents(): void {
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('contextmenu', this.onContextMenu);
    this.container.addEventListener('mouseenter', this.onMouseEnter);
    this.container.addEventListener('mouseleave', this.onMouseLeave);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  /** Remove previously bound events */
  private unbindEvents(): void {
    this.container.removeEventListener('wheel', this.onWheel);
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('contextmenu', this.onContextMenu);
    this.container.removeEventListener('mouseenter', this.onMouseEnter);
    this.container.removeEventListener('mouseleave', this.onMouseLeave);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  // ───────────────────────── handlers ─────────────────────────
  private onWheel = (evt: WheelEvent): void => {
    if (!evt.ctrlKey && !evt.metaKey) return;
    evt.preventDefault();

    const rect = this.container.getBoundingClientRect();
    const point: Point = {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };

    const direction = evt.deltaY > 0 ? -1 : 1; // inverted for natural scrolling
    const factor = 1 + direction * this.config.zoomStep;
    this.zoom(factor, point);
  };

  private onMouseDown = (evt: MouseEvent): void => {
    if (evt.button !== 0 || (!evt.ctrlKey && !evt.metaKey)) return;
    this.isPanning = true;
    this.startPoint = { x: evt.clientX, y: evt.clientY };
    this.container.style.cursor = 'grabbing';
    evt.preventDefault();
  };

  private onMouseMove = (evt: MouseEvent): void => {
    if (!this.isPanning) return;
    const dx = evt.clientX - this.startPoint.x;
    const dy = evt.clientY - this.startPoint.y;

    this.offset = { x: this.offset.x + dx, y: this.offset.y + dy };
    this.startPoint = { x: evt.clientX, y: evt.clientY };
    this.updateTransform();
    evt.preventDefault();
  };

  private onMouseUp = (): void => {
    if (!this.isPanning) return;
    this.isPanning = false;
    this.container.style.cursor = 'grab';
  };

  private onContextMenu = (evt: MouseEvent): void => {
    if (evt.ctrlKey || evt.metaKey) {
      evt.preventDefault();
      this.reset();
    }
  };

  private onMouseEnter = (): void => {
    this.statusHint.style.opacity = '1';
  };

  private onMouseLeave = (): void => {
    this.statusHint.style.opacity = '0';
  };

  //#endregion --------------------------------------------------------------------

  //#region Core transforms --------------------------------------------------------

  /**
   * Perform a zoom operation centred around a given point in container space.
   */
  private zoom(factor: number, centre: Point): void {
    const newScale = clamp(this.scale * factor, this.config.minZoom, this.config.maxZoom);
    if (newScale === this.scale) return;

    const ratio = newScale / this.scale;
    this.offset = {
      x: centre.x - (centre.x - this.offset.x) * ratio,
      y: centre.y - (centre.y - this.offset.y) * ratio,
    };

    this.scale = newScale;
    this.updateTransform();
  }

  /** Apply `translate` & `scale` to the wrapper */
  private updateTransform(): void {
    this.wrapper.style.transform = `translate(${this.offset.x}px, ${this.offset.y}px) scale(${this.scale})`;
    this.saveState(); // Persist state after transform
  }

  //#endregion --------------------------------------------------------------------

  //#region Public API -------------------------------------------------------------

  /** Reset pan & zoom to defaults */
  public reset(): void {
    this.scale = 1;
    this.offset = { x: 0, y: 0 };
    this.updateTransform();
    // Clear saved state on reset
    try {
      const key = this.getStorageKey();
      sessionStorage.removeItem(key);
    } catch (error) {
      // Silently fail
    }
  }

  /** Clean up DOM & event-listeners */
  public destroy(): void {
    this.unbindEvents();
    this.container.style.cursor = '';
    this.wrapper.style.transform = '';
  }

  //#endregion --------------------------------------------------------------------
}

//──────────────────────────────────────────────────────────────────────────────────
// Instance management helpers
//──────────────────────────────────────────────────────────────────────────────────

const INSTANCES = new WeakMap<HTMLElement, ContainerZoomPan>();

/**
 * Initialise zoom/pan support for a given diagram container.
 */
export function initializeContainerZoomPan(
  svg: SVGElement,
  container: HTMLElement,
  config: ContainerZoomPanConfig = {}
): void {
  destroyContainerZoomPan(container); // ensure clean slate
  INSTANCES.set(container, new ContainerZoomPan(svg, container, config));
}

/** Dispose of an existing zoom/pan instance, if any. */
export function destroyContainerZoomPan(container: HTMLElement): void {
  INSTANCES.get(container)?.destroy();
  INSTANCES.delete(container);
}

export function getZoomPanConfig(): ContainerZoomPanConfig | null {
  const host = document.getElementById('markdown-mermaid');
  const safeParseFloat = (value: string | undefined, defaultValue: number): number => {
    const parsed = parseFloat(value || '');
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Check if zoom/pan is enabled
  const enabled = host?.dataset.zoomPanEnabled !== 'false';
  if (!enabled) {
    return null;
  }

  return {
    minZoom: safeParseFloat(host?.dataset.zoomMinZoom, DEFAULT_CFG.minZoom),
    maxZoom: safeParseFloat(host?.dataset.zoomMaxZoom, DEFAULT_CFG.maxZoom),
    zoomStep: safeParseFloat(host?.dataset.zoomStep, DEFAULT_CFG.zoomStep),
  };
}