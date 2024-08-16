import svgPanZoom from 'svg-pan-zoom';

type PanZoomState = {
    enabled: Boolean
    panX: number
    panY: number
    scale: number
}

// This is a map where key is the index of the diagram element and the
// value is it's pan zoom state so when we reconstruct the diagrams we know
// which pan zoom states is for which. There's limitations where if diagrams
// switches places we won't be able to tell.
type PanZoomStates = {[index: number]: PanZoomState}

export function newPanZoomStates(): PanZoomStates {
    return {}
}

export function renderZoomableMermaidBlock(mermaidContainer: HTMLElement, content: string, panZoomStates: PanZoomStates, index: number) {
    mermaidContainer.innerHTML = content;

    // The content isn't svg so no zoom functionality can be setup
    let svgEl = mermaidContainer.querySelector("svg")
    if (!svgEl) return;
    
    const { toggle, input } = createPanZoomToggle()
    mermaidContainer.prepend(toggle);

    input.onchange = () => {
        if (!svgEl) throw Error("svg element should be defined")

        if (!panZoomState.enabled) {
            enablePanZoom(svgEl, panZoomState)
            panZoomState.enabled = true;
        }
        else {
            svgEl.remove()
            mermaidContainer.insertAdjacentHTML("beforeend", content)
            svgEl = mermaidContainer.querySelector("svg")
            panZoomState.enabled = false;
        }
    }

    // Load pan zoom state if exist
    let panZoomState = panZoomStates[index]
    if (panZoomState == null) {
        panZoomState = {
            enabled: false,
            panX: 0,
            panY: 0,
            scale: 0
        }
        panZoomStates[index] = panZoomState
    }

    // If previously pan & zoom was enabled, re-enable and sync back the previous state
    if (panZoomState.enabled) {
        const panZoomInstance = enablePanZoom(svgEl, panZoomState)
        panZoomInstance?.zoom(panZoomState.scale)
        panZoomInstance?.pan({
            x: panZoomState.panX,
            y: panZoomState.panY,
        })
    }
}

// removeOldPanZoomStates will remove all pan zoom states where their index
// is larger than the current amount of rendered elements. The usecase is 
// if the user creates many diagrams then removes them, we don't want to
// keep pan zoom states for diagrams that don't exist
export function removeOldPanZoomStates(panZoomStates: PanZoomStates, numElements: number) {
    for (const index in panZoomStates) {
        if (Number(index) >= numElements) {
            delete panZoomStates[index]
        }
    }
}

function enablePanZoom(svgEl: SVGElement, panZoomState: PanZoomState, ): SvgPanZoom.Instance | null {

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
        panZoomState.panX = panZoomInstance.getPan().x;
        panZoomState.panY = panZoomInstance.getPan().y;
        panZoomState.scale = panZoomInstance.getZoom();
    })

    // toggle.innerText = "Disable Zoom";
    return panZoomInstance;
}

function createPanZoomToggle(): {
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

    const text = document.createElement("DIV");
    text.setAttribute("class", "text")
    text.textContent = "Pan & Zoom"
    toggle.appendChild(text)

    return { toggle, input };
}

export function getToggleButtonStyles(): HTMLStyleElement {
    const styles = `
    .toggle-container {
        display: flex;
        align-items: center;
        margin-bottom: 6px;
    }

    .toggle-container .text {
        margin-left: 6px;
        font-size: 12px;
    }

    .toggle-container .checkbox {
        opacity: 0;
        position: absolute;
    }
      
    .toggle-container .label {
        background-color: #111;
        width: 33px;
        height: 19px;
        border-radius: 50px;
        position: relative;
        padding: 5px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
    }

    .toggle-container .label .ball {
        background-color: #fff;
        width: 15px;
        height: 15px;
        position: absolute;
        left: 2px;
        top: 2px;
        border-radius: 50%;
        transition: transform 0.2s linear;
    }

    .toggle-container .checkbox:checked + .label .ball {
        transform: translateX(14px);
    }
    `

    const styleSheet = document.createElement("style")
    styleSheet.textContent = styles
    return styleSheet
}