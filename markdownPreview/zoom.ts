import svgPanZoom from 'svg-pan-zoom';

type ZoomState = {
    enabled: Boolean
    panX: number
    panY: number
    scale: number
}

// This is a map where key is the index of the diagram element and the
// value is it's zoom state so when we reconstruct the diagrams we know
// which zoom states is for which. There's limitations where if diagrams
// switches places we won't be able to tell.
type ZoomStates = {[index: number]: ZoomState}

export function newZoomStates(): ZoomStates {
    return {}
}

export function renderZoomableMermaidBlock(mermaidContainer: HTMLElement, content: string, zoomStates: ZoomStates, index: number) {
    mermaidContainer.innerHTML = content;

    // The content isn't svg so no zoom functionality can be setup
    let svgEl = mermaidContainer.querySelector("svg")
    if (!svgEl) return;
    
    const { toggle, input } = createZoomToggle()
    mermaidContainer.prepend(toggle);

    input.onchange = () => {
        if (!svgEl) throw Error("svg element should be defined")

        if (!zoomState.enabled) {
            enableZoom(svgEl, zoomState)
            zoomState.enabled = true;
        }
        else {
            svgEl.remove()
            mermaidContainer.insertAdjacentHTML("beforeend", content)
            svgEl = mermaidContainer.querySelector("svg")
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
        const panZoomInstance = enableZoom(svgEl, zoomState)
        panZoomInstance?.zoom(zoomState.scale)
        panZoomInstance?.pan({
            x: zoomState.panX,
            y: zoomState.panY,
        })
    }
}

// removeOldZoomStates will remove all zoom states where their index is
// larger than the current amount of rendered elements. The usecase is 
// if the user creates many diagrams then removes them, we don't want 
// to keep zoom states for diagrams that don't exist
export function removeOldZoomStates(zoomStates: ZoomStates, numElements: number) {
    for (const index in zoomStates) {
        if (Number(index) >= numElements) {
            delete zoomStates[index]
        }
    }
}

function enableZoom(svgEl: SVGElement, zoomState: ZoomState, ): SvgPanZoom.Instance | null {

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

    // toggle.innerText = "Disable Zoom";
    return panZoomInstance;
}

function createZoomToggle(): {
    toggle: HTMLElement,
    input: HTMLElement,
} {
    const toggle = document.createElement("DIV");
    toggle.setAttribute("class", "toggle-container")

    const input = document.createElement("INPUT");
    const id = `checkbox-${crypto.randomUUID()}`;
    input.setAttribute("type", "checkbox");
    input.setAttribute("class", "checkbox")
    input.setAttribute("id", id);
    toggle.appendChild(input)

    const label = document.createElement("LABEL");
    label.setAttribute("class", "label")
    label.setAttribute("for", id)
    toggle.appendChild(label)

    const ball = document.createElement("SPAN");
    ball.setAttribute("class", "ball")
    label.appendChild(ball)

    return { toggle, input };
}

export function getToggleButtonStyles(): HTMLStyleElement {
    const styles = `
    .toggle-container {
        display: flex
    }

    .toggle-container .checkbox {
        opacity: 0;
        position: absolute;
    }
      
    .toggle-container .label {
        background-color: #111;
        width: 50px;
        height: 26px;
        border-radius: 50px;
        position: relative;
        padding: 5px;
        margin: 0 5px 5px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
    }

    .toggle-container .label .ball {
        background-color: #fff;
        width: 22px;
        height: 22px;
        position: absolute;
        left: 2px;
        top: 2px;
        border-radius: 50%;
        transition: transform 0.2s linear;
    }

    .toggle-container .checkbox:checked + .label .ball {
        transform: translateX(24px);
    }
    `

    const styleSheet = document.createElement("style")
    styleSheet.textContent = styles
    return styleSheet
}