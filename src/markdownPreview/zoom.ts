import svgPanZoom from 'svg-pan-zoom';

type ZoomState = {
    enabled: Boolean
    panX: number
    panY: number
    scale: number
}

export const zoomStates: {[index: number]: ZoomState} = {}

export function renderZoomableMermaidBlock(mermaidContainer: HTMLElement, content: string, index: number) {
    mermaidContainer.innerHTML = content;

    // The content isn't svg so no zoom functionality can be setup
    if (!mermaidContainer.querySelector("svg")) return;
    
    const button = createZoomButton()
    mermaidContainer.prepend(button);
    button.innerText = "Enable Zoom";

    button.onclick = () => {
        if (!zoomState.enabled) {
            enableZoom(mermaidContainer, zoomState, button)
            zoomState.enabled = true;
        }
        else {
            mermaidContainer.innerHTML = content;
            mermaidContainer.prepend(button);
            button.innerText = "Enable Zoom";
            zoomState.enabled = false;
        }
    }

    // Load zoom state if exist
    let zoomState = zoomStates[index]
    if (zoomState == null) {
        zoomState = {
            enabled: false,
            panX: 0,
            panY: 0,
            scale: 0
        }
        zoomStates[index] = zoomState
    }

    // If preivously zoom was enabled, enable zoom and sync back the pan and zoom scale
    if (zoomState.enabled) {
        const panZoomInstance = enableZoom(mermaidContainer, zoomState, button)
        panZoomInstance?.zoom(zoomState.scale)
        panZoomInstance?.pan({
            x: zoomState.panX,
            y: zoomState.panY,
        })
    }
}

function createZoomButton(): HTMLElement {
    const button = document.createElement("BUTTON");
    button.style.width = "10rem";
    return button;
}

function enableZoom(mermaidContainer: HTMLElement, zoomState: ZoomState, button: HTMLElement): SvgPanZoom.Instance | null {
    
    // Only enable zoom if container has svg
    const svgEl = mermaidContainer.querySelector("svg");
    if (!svgEl) return null;

    // After svgPanZoom is applied the auto sizing of svg will not
    // work, so we need to define the size to exactly what it is currently
    const svgSize = svgEl.getBoundingClientRect()
    svgEl.style.width = svgSize.width+"px";
    svgEl.style.height = svgSize.height+"px";
    const panZoomInstance = svgPanZoom(svgEl, {
        zoomEnabled: true,
        controlIconsEnabled: true,
        fit: true,
    });

    // Update pan and zoom on any changes
    panZoomInstance.setOnUpdatedCTM(_ => {
        zoomState.panX = panZoomInstance.getPan().x;
        zoomState.panY = panZoomInstance.getPan().y;
        zoomState.scale = panZoomInstance.getZoom();
    })

    button.innerText = "Disable Zoom";
    return panZoomInstance;
}