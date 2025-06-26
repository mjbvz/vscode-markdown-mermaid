import rough from 'roughjs';

// Copy element transformation attributes and styles
export function copyElementAttributes(from: Element, to: Element) {
    // Copy transformation attributes
    const transform = from.getAttribute('transform');
    if (transform) {
        to.setAttribute('transform', transform);
    }

    // Copy class name
    const className = from.getAttribute('class');
    if (className) {
        to.setAttribute('class', className);
    }

    // Copy ID
    const id = from.getAttribute('id');
    if (id) {
        to.setAttribute('id', id);
    }

    // Copy other attributes that may affect positioning
    const otherAttrs = ['opacity', 'filter', 'clip-path', 'mask'];
    otherAttrs.forEach(attr => {
        const value = from.getAttribute(attr);
        if (value) {
            to.setAttribute(attr, value);
        }
    });
}

// Hand-drawn style configuration
interface HandDrawnConfig {
    stroke: string;
    strokeWidth: number;
    fill: string;
    roughness: number;
    bowing: number;
    fillStyle: string;
    fillWeight: number;
    hachureAngle: number;
    hachureGap: number;
}

// Get color configuration based on theme name
function getThemeColors(theme: string) {
    switch (theme) {
        case 'default':
            return {
                sequence: { actorFill: '#ECECFF' },
                flowchart: { nodeFill: '#ECECFF' },
                pie: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'],
                class: { classFill: '#ECECFF' }
            };
        case 'dark':
            return {
                sequence: { actorFill: '#444444' },
                flowchart: { nodeFill: '#555555' },
                pie: ['#FF8A80', '#80CBC4', '#81C784', '#FFCC02', '#CE93D8'],
                class: { classFill: '#444444' }
            };
        case 'forest':
            return {
                sequence: { actorFill: '#E8F5E8' },
                flowchart: { nodeFill: '#C8E6C9' },
                pie: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800'],
                class: { classFill: '#E8F5E8' }
            };
        case 'base':
            return {
                sequence: { actorFill: '#F5F5F5' },
                flowchart: { nodeFill: '#F9F9F9' },
                pie: ['#3498DB', '#E74C3C', '#F39C12', '#2ECC71', '#9B59B6'],
                class: { classFill: '#F5F5F5' }
            };
        case 'neutral':
            return {
                sequence: { actorFill: '#F8F8F8' },
                flowchart: { nodeFill: '#FAFAFA' },
                pie: ['#607D8B', '#795548', '#FF5722', '#4CAF50', '#2196F3'],
                class: { classFill: '#F8F8F8' }
            };
        default:
            // Use default theme as fallback
            return {
                sequence: { actorFill: '#ECECFF' },
                flowchart: { nodeFill: '#ECECFF' },
                pie: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'],
                class: { classFill: '#ECECFF' }
            };
    }
}

// Get base hand-drawn configuration for a theme
function getBaseHandDrawnConfig(theme: string = 'default'): HandDrawnConfig {
    const baseConfig = {
        stroke: 'currentColor',
        strokeWidth: 1.5,
        fill: 'none',
        roughness: 1.5,
        bowing: 1.5,
        fillStyle: 'hachure',
        fillWeight: 1,
        hachureAngle: 60,
        hachureGap: 4
    };

    // Theme-specific adjustments
    switch (theme) {
        case 'dark':
            return {
                ...baseConfig,
                roughness: 1.8,
                bowing: 1.8,
                fillWeight: 1.2
            };
        case 'forest':
            return {
                ...baseConfig,
                roughness: 1.2,
                bowing: 1.2,
                hachureAngle: 45,
                fillWeight: 0.8
            };
        case 'base':
            return {
                ...baseConfig,
                roughness: 1.0,
                bowing: 1.0,
                fillStyle: 'solid'
            };
        case 'neutral':
            return {
                ...baseConfig,
                roughness: 1.3,
                bowing: 1.3,
                hachureGap: 6
            };
        default:
            return baseConfig;
    }
}

// Apply hand-drawn style to SVG elements in a container
export function applyHandDrawnStyle(container: HTMLElement, theme?: string, isDarkMode?: boolean) {
    const svg = container.querySelector('svg');
    if (!svg) return;

    // Identify chart type through aria-roledescription attribute
    const roleDescription = svg.getAttribute('aria-roledescription') || '';
    let diagramType = 'unknown';

    if (roleDescription === 'sequence') {
        diagramType = 'sequence';
    } else if (roleDescription === 'flowchart-v2') {
        diagramType = 'flowchart';
    } else if (roleDescription === 'pie') {
        diagramType = 'pie';
    } else if (roleDescription === 'class') {
        diagramType = 'class';
    } else {
        // Fallback to content matching if no aria-roledescription
        const svgContent = svg.innerHTML.toLowerCase();
        if (svgContent.includes('pie') || svgContent.includes('sector')) {
            diagramType = 'pie';
        } else if (svgContent.includes('sequence') || svgContent.includes('actor')) {
            diagramType = 'sequence';
        } else if (svgContent.includes('flowchart') || svgContent.includes('node')) {
            diagramType = 'flowchart';
        }
    }

    if (diagramType === 'pie') {
        return;
    }

    // Create rough instance
    const rc = rough.svg(svg);

    // Get base configuration for the theme
    // const baseConfig = getBaseHandDrawnConfig(theme || 'default');

    // Get all elements that need to be converted
    const elements = Array.from(svg.querySelectorAll('rect, circle, ellipse, line, path, polygon, polyline'));

    elements.forEach((element, index) => {
        try {
            let roughElement;

            switch (element.tagName.toLowerCase()) {
                case 'rect': {
                    const rect = element as SVGRectElement;
                    const x = parseFloat(rect.getAttribute('x') || '0');
                    const y = parseFloat(rect.getAttribute('y') || '0');
                    const width = parseFloat(rect.getAttribute('width') || '0');
                    const height = parseFloat(rect.getAttribute('height') || '0');

                    roughElement = rc.rectangle(x, y, width, height);
                    break;
                }
                case 'circle': {
                    const circle = element as SVGCircleElement;
                    const cx = parseFloat(circle.getAttribute('cx') || '0');
                    const cy = parseFloat(circle.getAttribute('cy') || '0');
                    const r = parseFloat(circle.getAttribute('r') || '0');

                    roughElement = rc.circle(cx, cy, r * 2);
                    break;
                }
                case 'line': {
                    const line = element as SVGLineElement;
                    const x1 = parseFloat(line.getAttribute('x1') || '0');
                    const y1 = parseFloat(line.getAttribute('y1') || '0');
                    const x2 = parseFloat(line.getAttribute('x2') || '0');
                    const y2 = parseFloat(line.getAttribute('y2') || '0');

                    roughElement = rc.line(x1, y1, x2, y2);
                    break;
                }
                case 'path': {
                    const path = element as SVGPathElement;
                    const d = path.getAttribute('d');
                    if (d) {
                        roughElement = rc.path(d);
                    }
                    break;
                }
                case 'polygon': {
                    const polygon = element as SVGPolygonElement;
                    const points = polygon.getAttribute('points');
                    if (points) {
                        // Parse points attribute and convert to Rough.js format
                        const pointsArray = points.split(/[\s,]+/).filter(p => p.length > 0);
                        const coords: [number, number][] = [];
                        for (let i = 0; i < pointsArray.length; i += 2) {
                            if (i + 1 < pointsArray.length) {
                                coords.push([parseFloat(pointsArray[i]), parseFloat(pointsArray[i + 1])]);
                            }
                        }

                        if (coords.length >= 3) {
                            roughElement = rc.polygon(coords);
                        }
                    }
                    break;
                }
                case 'polyline': {
                    const polyline = element as SVGPolylineElement;
                    const points = polyline.getAttribute('points');
                    if (points) {
                        // Parse points attribute and convert to Rough.js format
                        const pointsArray = points.split(/[\s,]+/).filter(p => p.length > 0);
                        const coords: [number, number][] = [];
                        for (let i = 0; i < pointsArray.length; i += 2) {
                            if (i + 1 < pointsArray.length) {
                                coords.push([parseFloat(pointsArray[i]), parseFloat(pointsArray[i + 1])]);
                            }
                        }

                        if (coords.length >= 2) {
                            // For polyline, convert to path data
                            const pathData = coords.map((coord, index) =>
                                index === 0 ? `M ${coord[0]} ${coord[1]}` : `L ${coord[0]} ${coord[1]}`
                            ).join(' ');

                            roughElement = rc.path(pathData);
                        }
                    }
                    break;
                }
                case 'ellipse': {
                    const ellipse = element as SVGEllipseElement;
                    const cx = parseFloat(ellipse.getAttribute('cx') || '0');
                    const cy = parseFloat(ellipse.getAttribute('cy') || '0');
                    const rx = parseFloat(ellipse.getAttribute('rx') || '0');
                    const ry = parseFloat(ellipse.getAttribute('ry') || '0');

                    roughElement = rc.ellipse(cx, cy, rx * 2, ry * 2);
                    break;
                }
            }

            if (roughElement) {
                // Copy transform attributes to maintain correct positioning
                copyElementAttributes(element, roughElement);

                // Insert hand-drawn element at original element's position
                if (element.parentNode) {
                    element.parentNode.insertBefore(roughElement, element);
                    element.setAttribute('style', 'display: none');
                } else {
                    // If no parent node, add to SVG root
                    svg.appendChild(roughElement);
                }
            }
        } catch (error) {
            console.warn('Failed to apply hand-drawn style to element:', error);
        }
    });
}
