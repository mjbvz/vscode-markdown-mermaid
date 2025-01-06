import svgPanZoom from 'svg-pan-zoom';
import { renderMermaidBlocksInElement } from '../shared-mermaid';

type PanZoomState = {
    requireInit: boolean
    enabled: boolean
    panX: number
    panY: number
    scale: number
}

// This is to keep track the state of pan and zoom for each diagram so when
// the markdown preview is refreshed we can turn on pan zoom for diagrams that
// had it on and restore the state to what it was. 
// Given we use a simple index to track which diagram is which, if the user 
// switches around say diagram 1 with diagram 2 and save then we may end up
// using states for diagram 2 with diagram 1 and vice versa
const panZoomStates: {[index: number]: PanZoomState} = {}

// This is to keep track of all the diagrams that have pan zoom enabled so when
// the page resizes we can loop through all these pan zoom instances and call
// .resize() on all of them
const enabledPanZoomInstances: {[index: number]: SvgPanZoom.Instance} = {}

export async function renderMermaidBlocksWithPanZoom() {
    
    // Add styles to document
    document.head.appendChild(getToggleButtonStyles())

    // On each re-render we should reset stored pan zoom instances as
    // all those old elements should be removed already
    resetEnabledPanZoomInstances() 

    // Render each mermaid block with pan zoom capabilities
    const numElements = await renderMermaidBlocksInElement(document.body, (mermaidContainer, content, index) => {

        // Setup container styles
        mermaidContainer.style.display = "flex";
        mermaidContainer.style.flexDirection = "column";

        let svgEl = addSvgEl(mermaidContainer, content)
        const input = createPanZoomToggle(mermaidContainer)

        // Create an empty pan zoom state if a previous one isn't found
        // mark this state as required for initialization which can only
        // be set when we enable pan and zoom and know what those values are
        let panZoomState = panZoomStates[index]
        if (!panZoomState) {
            panZoomState = {
                requireInit: true,
                enabled: false,
                panX: 0,
                panY: 0,
                scale: 0
            }
            panZoomStates[index] = panZoomState
        }

        // If previously pan & zoom was enabled then re-enable it
        if (panZoomState.enabled) {
            input.checked = true
            const panZoomInstance = enablePanZoom(mermaidContainer, svgEl, panZoomState)
            enabledPanZoomInstances[index] = panZoomInstance
        }

        input.onchange = () => {
            if (!panZoomState.enabled) {
                const panZoomInstance = enablePanZoom(mermaidContainer, svgEl, panZoomState)
                enabledPanZoomInstances[index] = panZoomInstance
                panZoomState.enabled = true
            }
            else {
                svgEl.remove()
                svgEl = addSvgEl(mermaidContainer, content)
                delete enabledPanZoomInstances[index]
                panZoomState.enabled = false
            }
        }
    });

    // Some diagrams maybe removed during edits and if we have states
    // for more diagrams than there are then we should also remove them
    removeOldPanZoomStates(numElements)
}

// resetPanZoom clears up all states stored as part of pan zoom functionlaity
// should be used when page is re-rendered with pan zoom turned off
export function resetPanZoom() {
    resetPanZoomStates()
    resetEnabledPanZoomInstances()
}

// onResize should added as a callback on window resize events
export function onResize() {
    resizeEnabledPanZoomInstances()
}

// enablePanZoom will modify the provided svgEl with svg-pan-zoom library
// if the provided pan zoom state is new then it will be populated with
// default pan zoom values when the library is initiated. If the pan zoom 
// state is not new then it will resync against the pan zoom state
function enablePanZoom(mermaidContainer:HTMLElement, svgEl: SVGElement, panZoomState: PanZoomState): SvgPanZoom.Instance {

    // Svg element doesn't have any width and height defined but relies on auto sizing.
    // For svg-pan-zoom to work we need to define atleast the height so we should
    // take the current height of the svg
    const svgSize = svgEl.getBoundingClientRect()
    svgEl.style.height = svgSize.height+"px";
    svgEl.style.maxWidth = "none";

    // Start up svg-pan-zoom
    const panZoomInstance = svgPanZoom(svgEl, {
        zoomEnabled: true,
        controlIconsEnabled: true,
        fit: true,
    });
    
    // The provided pan zoom state is new and needs to be intialized
    // with values once svg-pan-zoom has been started
    if (panZoomState.requireInit) {
        panZoomState.panX = panZoomInstance.getPan().x
        panZoomState.panY = panZoomInstance.getPan().y
        panZoomState.scale = panZoomInstance.getZoom()
        panZoomState.requireInit = false
        
    // Otherwise restore pan and zoom to this previous state
    } else {
        panZoomInstance?.zoom(panZoomState.scale)
        panZoomInstance?.pan({
            x: panZoomState.panX,
            y: panZoomState.panY,
        })
    }

    // Show pan zoom control incons only when mouse hovers over the diagram 
    mermaidContainer.onmouseenter = (_ => {
        panZoomInstance.enableControlIcons()
    })
    mermaidContainer.onmouseleave = (_ => {
        panZoomInstance.disableControlIcons()
    })

    // Update pan and zoom on any changes
    panZoomInstance.setOnUpdatedCTM(_ => {
        panZoomState.panX = panZoomInstance.getPan().x;
        panZoomState.panY = panZoomInstance.getPan().y;
        panZoomState.scale = panZoomInstance.getZoom();
    })

    return panZoomInstance
}

// addSvgEl inserts the svg content into the provided mermaid container
// then finds the svg element to confirm it is created and returns it
function addSvgEl(mermaidContainer:HTMLElement, content: string): SVGSVGElement {

    // Add svg string content
    mermaidContainer.insertAdjacentHTML("beforeend", content)
    
    // Svg element should be found in container
    const svgEl = mermaidContainer.querySelector("svg")
    if (!svgEl) throw("svg element not found");

    return svgEl
}

// removeOldPanZoomStates will remove all pan zoom states where their index
// is larger than the current amount of rendered elements. The usecase is 
// if the user creates many diagrams then removes them, we don't want to
// keep pan zoom states for diagrams that don't exist
function removeOldPanZoomStates(numElements: number) {
    for (const index in panZoomStates) {
        if (Number(index) >= numElements) {
            delete panZoomStates[index]
        }
    }
}

// resetPanZoomStates will remove all stored pan zoom states
function resetPanZoomStates() {
    for (var index in panZoomStates) {
        if (panZoomStates.hasOwnProperty(index)) {
            delete panZoomStates[index]
        }
    }
}

// resizeEnabledPanZoomInstances will loop through all the currently
// enabled pan zoom instances and call .resize() on them, this should
// be called only on page resizing
function resizeEnabledPanZoomInstances() {
    for (var index in enabledPanZoomInstances) {
        if (enabledPanZoomInstances.hasOwnProperty(index)) {
            const panZoomInstance = enabledPanZoomInstances[index]
            panZoomInstance.resize()
        }
    }
}

// resetEnabledPanZoomInstances will remove all stored enabled pan zoom instaces
function resetEnabledPanZoomInstances() {
    for (var index in enabledPanZoomInstances) {
        if (enabledPanZoomInstances.hasOwnProperty(index)) {
            delete enabledPanZoomInstances[index]
        }
    }
}

function createPanZoomToggle(mermaidContainer: HTMLElement): HTMLInputElement {
    const inputID = `checkbox-${crypto.randomUUID()}`;
    mermaidContainer.insertAdjacentHTML("afterbegin", `
    <div class="toggle-container">
        <input id="${inputID}" class="checkbox" type="checkbox" />
        <label class="label" for="${inputID}">
            <span class="ball" />
        </label>
        <div class="text">Pan & Zoom</div>
    </div>
    `)

    const input = mermaidContainer.querySelector("input")
    if (!input) throw Error("toggle input should be defined")

    return input;
}

function getToggleButtonStyles(): HTMLStyleElement {
    const styles = `
    .mermaid:hover .toggle-container {
        opacity: 1;
    }

    .toggle-container {
        opacity: 0;
        display: flex;
        align-items: center;
        margin-bottom: 6px;
        transition: opacity 0.2s ease-in-out;
    }

    .toggle-container .text {
        margin-left: 6px;
        font-size: 12px;
        cursor: default;
    }

    .toggle-container .checkbox {
        opacity: 0;
        position: absolute;
    }
      
    .toggle-container .label {
        background-color: var(--vscode-editorWidget-background);
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
        background-color: var(--vscode-editorWidget-foreground);
        width: 15px;
        height: 15px;
        position: absolute;
        left: 2px;
        top: 1px;
        border-radius: 50%;
        transition: transform 0.2s linear;
    }

    .toggle-container .checkbox:checked + .label .ball {
        transform: translateX(14px);
    }
    
    .toggle-container .checkbox:checked + .label {
        background-color: var(--vscode-textLink-activeForeground);
    }
    `

    const styleSheet = document.createElement("style")
    styleSheet.textContent = styles
    return styleSheet
}