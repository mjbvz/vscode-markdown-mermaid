# Markdown Preview Mermaid Support

[![](https://vsmarketplacebadges.dev/version/bierner.markdown-mermaid.png)](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)

Adds [Mermaid](https://mermaid-js.github.io/mermaid/#/) diagram and flowchart support to VS Code's builtin Markdown preview and to Markdown cells in notebooks.

![A mermaid diagram in VS Code's built-in markdown preview](https://github.com/mjbvz/vscode-markdown-mermaid/raw/master/docs/example.png)

Currently supports Mermaid version 11.12.0.

## Usage

Create diagrams in markdown using `mermaid` fenced code blocks:

~~~markdown
```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```
~~~

You can also use `:::` blocks:

```markdown
::: mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
:::
```

Supports [MDI](https://icon-sets.iconify.design/mdi/) and [logos](https://icon-sets.iconify.design/logos/) icons from Iconify:

~~~markdown
```mermaid
architecture-beta
    service user(mdi:account)
    service lambda(logos:aws-lambda)

    user:R --> L:lambda
```
~~~


## Interactive Diagrams

This extension supports clickable links in Mermaid diagrams that can open files and jump to specific line numbers in VS Code.

### Basic Usage

Add click handlers to diagram nodes using the `click` directive with a custom `vscode://` URI:

~~~markdown
```mermaid
graph TD
    A[View Implementation]
    B[Check Configuration]

    click A "vscode://bierner.markdown-mermaid/open?file=src/index.ts&line=42"
    click B "vscode://bierner.markdown-mermaid/open?file=config.json"
```
~~~

### URI Format

The URI format is: `vscode://bierner.markdown-mermaid/open?file=<path>&line=<number>`

**Parameters:**
- `file` (required): Path to the file to open
  - Can be an absolute path: `/Users/username/project/src/file.ts`
  - Or relative to workspace root: `src/file.ts` or `../src/file.ts`
- `line` (optional): Line number to jump to (1-based)

### Examples

**Example 1: Open file at specific line**
~~~markdown
```mermaid
graph LR
    Server[Server Code - Line 156]
    Client[Client Code - Line 42]

    click Server "vscode://bierner.markdown-mermaid/open?file=src/server/index.ts&line=156"
    click Client "vscode://bierner.markdown-mermaid/open?file=src/client/app.ts&line=42"
```
~~~

**Example 2: Architecture documentation**
~~~markdown
```mermaid
graph TD
    Auth[Authentication Module]
    DB[Database Layer]
    API[API Routes]

    click Auth "vscode://bierner.markdown-mermaid/open?file=src/auth/index.ts&line=1" "View auth implementation"
    click DB "vscode://bierner.markdown-mermaid/open?file=src/db/connection.ts&line=10" "View DB setup"
    click API "vscode://bierner.markdown-mermaid/open?file=src/routes/api.ts&line=25" "View API routes"
```
~~~

**Example 3: Flowchart with navigation**
~~~markdown
```mermaid
flowchart TD
    Start[Start Here] --> Process[Processing Logic]
    Process --> Decision{Check Status}
    Decision -->|Success| End[Complete]
    Decision -->|Error| Error[Error Handler]

    click Start "vscode://bierner.markdown-mermaid/open?file=src/main.ts&line=15"
    click Process "vscode://bierner.markdown-mermaid/open?file=src/processor.ts&line=45"
    click Error "vscode://bierner.markdown-mermaid/open?file=src/errorHandler.ts&line=20"
```
~~~

### Tips

- **Multi-panel support**: When you click a link in the markdown preview, the source file opens in an adjacent editor panel, allowing you to view both the diagram and code simultaneously
- Use relative paths when documenting project files that may be in different locations
- Include line numbers to point to specific functions or important sections
- Add tooltips (the third parameter in click directive) to describe what users will see
- This feature works in both Markdown preview and exported HTML (when viewing in VS Code)


## Configuration

- `markdown-mermaid.lightModeTheme` — Configures the Mermaid theme used when VS Code is using a light color theme. Supported values are: `"base"`, `"forest"`, `"dark"`, `"default"`, `"neutral"`. Currently not supported in notebooks.

- `markdown-mermaid.darkModeTheme` — Configures the Mermaid theme used when VS Code is using a dark color theme. Supported values are: `"base"`, `"forest"`, `"dark"`, `"default"`, `"neutral"`. Currently not supported in notebooks.

- `markdown-mermaid.languages` — Configures language ids for Mermaid code blocks. The default is `["mermaid"]`.

### Using custom CSS in the Markdown Preview

You can use the built-in functionality to add custom CSS. More info can be found in the [markdown.styles documentation](https://code.visualstudio.com/Docs/languages/markdown#_using-your-own-css)

For example, add Font Awesome like this:

```
"markdown.styles": [
    "https://use.fontawesome.com/releases/v5.7.1/css/all.css"
]
```

Use it like this:

~~~markdown
```mermaid
graph LR
    fa:fa-check-->fa:fa-coffee
```
~~~
