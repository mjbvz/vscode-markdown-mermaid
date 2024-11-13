// @ts-check
const path = require('path');
const shared = require('./shared.mermaid.webpack.config');
const webpack = require('webpack');

module.exports = {
    ...shared,
    target: 'web',
    entry: {
        'index': path.join(__dirname, '..', 'src', 'notebook', 'index.ts'),
    },
    experiments: {
        outputModule: true,
    },
    output: {
        path: path.join(__dirname, '..', 'dist-notebook'),
        filename: '[name].bundle.js',
        library: {
            type: "module",
        },
    },
    plugins: [
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
        }),
    ],
};