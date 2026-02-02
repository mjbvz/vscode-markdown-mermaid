import esbuild, { type BuildOptions } from 'esbuild';
import path from 'path';

const srcDir = path.join(import.meta.dirname, '..', 'src');
const distDir = path.join(import.meta.dirname, '..', 'dist');

const sharedOptions: BuildOptions = {
    bundle: true,
    external: ['vscode'],
    sourcemap: true,
};
 
async function build(options: BuildOptions) {
    await esbuild.build(options);
}

async function main() {
    const isWatch = process.argv.includes('--watch');
    const isProduction = process.argv.includes('--production');

    const nodeExtensionOptions: BuildOptions = {
        ...sharedOptions,
        entryPoints: [path.join(srcDir, 'vscode-extension', 'index.ts')],
        outfile: path.join(distDir, 'index.js'),
        format: 'cjs',
        platform: 'node',
        minify: isProduction,
        sourcemap: isProduction ? false : true,
    };

    const webExtensionOptions: BuildOptions = {
        ...sharedOptions,
        entryPoints: [path.join(srcDir, 'vscode-extension', 'index.ts')],
        outfile: path.join(distDir, 'web', 'index.js'),
        format: 'cjs',
        platform: 'browser',
        minify: isProduction,
        sourcemap: isProduction ? 'external' : true,
    };

    if (isWatch) {
        const nodeCtx = await esbuild.context(nodeExtensionOptions);
        const webCtx = await esbuild.context(webExtensionOptions);
        await Promise.all([nodeCtx.watch(), webCtx.watch()]);
        console.log('Watching for changes...');
    } else {
        await Promise.all([build(nodeExtensionOptions), build(webExtensionOptions)]);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
