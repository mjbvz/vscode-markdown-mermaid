import esbuild, { type BuildOptions } from 'esbuild';
import path from 'path';

const srcDir = path.join(import.meta.dirname, '..', 'src');
const distPreviewDir = path.join(import.meta.dirname, '..', 'dist-preview');
const distNotebookDir = path.join(import.meta.dirname, '..', 'dist-notebook');

const sharedOptions: BuildOptions = {
    bundle: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    target: ['es2020'],
    external: ['fs'], // mermaid requires this
};
 
async function build(options: BuildOptions) {
    await esbuild.build(options);
}

async function main() {
    const isWatch = process.argv.includes('--watch');

    const previewOptions: BuildOptions = {
        ...sharedOptions,
        entryPoints: [path.join(srcDir, 'markdownPreview', 'index.ts')],
        outfile: path.join(distPreviewDir, 'index.bundle.js'),
        format: 'iife',
    };

    const notebookOptions: BuildOptions = {
        ...sharedOptions,
        entryPoints: [path.join(srcDir, 'notebook', 'index.ts')],
        outfile: path.join(distNotebookDir, 'index.bundle.js'),
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
