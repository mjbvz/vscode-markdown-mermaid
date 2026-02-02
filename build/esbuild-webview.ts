import esbuild, { type BuildOptions, type Plugin } from 'esbuild';
import path from 'path';

const srcDir = path.join(import.meta.dirname, '..', 'src');
const distPreviewDir = path.join(import.meta.dirname, '..', 'dist-preview');
const distNotebookDir = path.join(import.meta.dirname, '..', 'dist-notebook');

// Plugin to bundle CSS files (with @import resolution) and export as text
const cssTextPlugin: Plugin = {
    name: 'css-text',
    setup(build) {
        build.onLoad({ filter: /diagramStyles\.css$/ }, async (args) => {
            // Use esbuild to bundle the CSS with imports resolved and fonts as dataurl
            const result = await esbuild.build({
                entryPoints: [args.path],
                bundle: true,
                minify: true,
                write: false,
                loader: {
                    '.ttf': 'dataurl',
                    '.woff': 'dataurl',
                    '.woff2': 'dataurl',
                },
            });
            const css = result.outputFiles[0].text;
            return {
                contents: `export default ${JSON.stringify(css)};`,
                loader: 'js',
            };
        });
    },
};

const sharedOptions: BuildOptions = {
    bundle: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    target: ['es2022'],
    external: ['fs'], // mermaid requires this,
    loader: {
        '.ttf': 'dataurl',
    },
    plugins: [cssTextPlugin],
};

async function build(options: BuildOptions) {
    await esbuild.build(options);
}

async function main() {
    const isWatch = process.argv.includes('--watch');

    const previewOptions: BuildOptions = {
        ...sharedOptions,
        entryPoints: {
            'index.bundle': path.join(srcDir, 'markdownPreview', 'index.ts'),
        },
        outdir: distPreviewDir,
        format: 'iife',
    };

    const notebookOptions: BuildOptions = {
        ...sharedOptions,
        entryPoints: {
            'index.bundle': path.join(srcDir, 'notebook', 'index.ts'),
        },
        outdir: distNotebookDir,
        format: 'esm',
    };

    if (isWatch) {
        const previewCtx = await esbuild.context(previewOptions);
        const notebookCtx = await esbuild.context(notebookOptions);
        await Promise.all([previewCtx.watch(), notebookCtx.watch()]);
        console.log('Watching for changes...');
    } else {
        await Promise.all([build(previewOptions), build(notebookOptions)]);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
