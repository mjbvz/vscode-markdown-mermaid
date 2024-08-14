import svgPanZoom from 'svg-pan-zoom';

export function createZoomButton(mermaidContainer: HTMLElement, svgContent: string): HTMLElement {
    const button = document.createElement("BUTTON")
    button.style.width = "10rem"
    button.onclick = () => {onClickZoom(button, mermaidContainer, svgContent)}
    return button
}

export function enableZoom(button: HTMLElement, mermaidContainer: HTMLElement): SvgPanZoom.Instance | null {
    const svgEl = mermaidContainer.querySelector("svg");
    if (!svgEl) return null

    // After svgPanZoom is applied the auto sizing of svg will not
    // work, so we need to define the size to exactly what it is currently
    const svgSize = svgEl.getBoundingClientRect()
    svgEl.style.width = svgSize.width+"px";
    svgEl.style.height = svgSize.height+"px";
    const panZoomInstance = svgPanZoom(svgEl, {
        zoomEnabled: true,
        controlIconsEnabled: true,
        fit: true,
        center: true
    });
    button.innerText = "Disable Zoom"
    return panZoomInstance
}

export function resetView(button: HTMLElement, mermaidContainer: HTMLElement, svgContent: string) {
    mermaidContainer.innerHTML = svgContent;
    mermaidContainer.prepend(button);
    button.innerText = "Enable Zoom"
}

function onClickZoom(button: HTMLElement, mermaidContainer: HTMLElement, svgContent: string) {
    if (button.innerText == "Enable Zoom") {
        enableZoom(button, mermaidContainer)
    }
    else {
        resetView(button, mermaidContainer, svgContent)
    }
} 

