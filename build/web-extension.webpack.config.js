// @ts-check
const path = require('path');
const webpack = require('webpack');

module.exports = /** @type {webview.WebpackConfig} */ {
    context: path.dirname(__dirname),
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    target: 'webworker', // extensions run in a webworker context
    entry: {
        'index': './src/index.ts', // source of the web extension main file
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, '..', 'dist', 'web'),
        libraryTarget: 'commonjs'
    },
    resolve: {
        mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
        extensions: ['.ts', '.js'], // support ts-files and js-files
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [{
                loader: 'ts-loader'
            }]
        }]
    },
    externals: {
        'vscode': 'commonjs vscode', // ignored because it doesn't exist
    },
    performance: {
        hints: false
    },
    devtool: 'nosources-source-map' // create a source map that points to the original source file
};