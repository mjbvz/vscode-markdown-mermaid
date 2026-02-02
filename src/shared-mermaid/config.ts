export interface MermaidExtensionConfig {
    readonly darkModeTheme: string;
    readonly lightModeTheme: string;
    readonly maxTextSize: number;
    readonly clickDrag: ClickDragMode;
    readonly showControls: ShowControlsMode;
    readonly resizable: boolean;
    readonly maxHeight: string;
}

export const enum ShowControlsMode {
    Never = 'never',
    OnHoverOrFocus = 'onHoverOrFocus',
    Always = 'always'
}

export const enum ClickDragMode {
    Always = 'always',
    Alt = 'alt',
    Never = 'never'
}
