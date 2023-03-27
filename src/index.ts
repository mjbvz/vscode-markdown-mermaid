import { extendMarkdownItWithMermaid } from './mermaid';
import * as vscode from 'vscode';

const configSection = 'markdown-mermaid';


export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(configSection) || e.affectsConfiguration('workbench.colorTheme')) {
            vscode.commands.executeCommand('markdown.preview.refresh');
        }
    }));

    return {
        extendMarkdownIt(md: any) {
            extendMarkdownItWithMermaid(md, {
                languageIds: () => {
                    return vscode.workspace.getConfiguration(configSection).get<string[]>('languages', ['mermaid']);
                }
            });
            md.use(injectMermaidTheme);
            return md;
        }
    }
}


const defaultMermaidTheme = 'default';
const validMermaidThemes = [
    'base',
    'forest',
    'dark',
    'default',
    'neutral',
];

function sanitizeMermaidTheme(theme: string | undefined) {
    return typeof theme === 'string' && validMermaidThemes.includes(theme) ? theme : defaultMermaidTheme;
}

function injectMermaidTheme(md: any) {
    const render = md.renderer.render;
    md.renderer.render = function () {
        const config = vscode.workspace.getConfiguration(configSection);
        const directives: JSON = config.get("directives") ?? {} as JSON;
        
        // Setting themeVariables will override
        // darkModeTheme and lightModeTheme
        // both will be set to "base"
        const darkModeTheme = "themeVariables" in directives ? 
            'base' : sanitizeMermaidTheme(config.get('darkModeTheme'));
        const lightModeTheme = "themeVariables" in directives ?
            'base' : sanitizeMermaidTheme(config.get('lightModeTheme'));
        
        /*
            # Directives
            
            http://mermaid.js.org/config/directives.html
            https://github.com/mermaid-js/mermaid/blob/develop/packages/mermaid/src/defaultConfig.ts
            
            For sequences add the following directive:

            sequence: {
                hideUnusedParticipants: false,
                activationWidth: 10,
                diagramMarginX: 50,
                diagramMarginY: 10,
                actorMargin: 50,
                width: 150,
                height: 65,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35,
                messageAlign: 'center',
                mirrorActors: true,
                forceMenus: false,
                bottomMarginAdj: 1,
                useMaxWidth: true,
                rightAngles: false,
                showSequenceNumbers: false,
                actorFontSize: 14,
                actorFontFamily: '"Open Sans", sans-serif',
                actorFontWeight: 400,
                noteFontSize: 14,
                noteFontFamily: '"trebuchet ms", verdana, arial, sans-serif',
                noteFontWeight: 400,
                noteAlign: 'center',
                messageFontSize: 16,
                messageFontFamily: '"trebuchet ms", verdana, arial, sans-serif',
                messageFontWeight: 400,
                wrap: false,
                wrapPadding: 10,
                labelBoxWidth: 50,
                labelBoxHeight: 20,
            }
            
            Example: 

            {
              "sequence" : {
                "mirrorActors": false
              }
            }
            
            # Theming
            
            http://mermaid.js.org/config/theming.html 
            
            themeVariables
            Note if set, theme must be set to 'base'
            
            For sequence:
            https://mermaid.js.org/config/theming.html#theme-variables-reference-table:~:text=text%20inside%20Nodes-,Sequence%20Diagram%20Variables,Sequence%20Number%20Color,-State%20Colors 
            
            actorBkg
            actorBorder
            actorTextColor
            actorLineColor
            signalColor
            signalTextColor
            labelBoxBkgColor
            labelBoxBorderColor
            loopTextColor
            activationBorderColor
            activationBkgColor
            sequenceNumberColor

            Example:
           
            {
                "themeVariables": {
                    "primaryColor": ...
                }
            }  

            Add the following to settings.json
            {
                "markdown-mermaid.directives": {
                    "sequence": {
                        "mirrorActors": false,
                    },
                    "themeVariables": {
                        "primaryColor": "#BB2528",
                        "primaryTextColor": "#fff",
                        "primaryBorderColor": "#7C0000",
                        "lineColor": "#F8B229",
                        "secondaryColor": "#006100",
                        "tertiaryColor": "#fff"
                    },
                    "debug": true,
            }
         */

        // Note: single quotes needed for directives 
        // JSON.stringify will contain double quotes
        // encodeURIcomponent could be used to be safer
        return `<span id="${configSection}" aria-hidden="true"
                    data-dark-mode-theme="${darkModeTheme}"
                    data-light-mode-theme="${lightModeTheme}"
                    data-directives='${JSON.stringify(directives)}'></span>
                ${render.apply(md.renderer, arguments)}`;
    };
    return md;
}