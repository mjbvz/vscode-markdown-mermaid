const mermaidScript = [].filter.call(
    document.getElementsByTagName('script'), x => x.getAttribute('src').endsWith('mermaid.min.js'))[0]

mermaidScript.onload = () => mermaid.initialize({ startOnLoad: true });