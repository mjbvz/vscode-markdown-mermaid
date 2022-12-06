// From https://github.com/mermaidjs/mermaid-webpack-demo/

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    target: 'web',
    externals: 'fs', // in order to make mermaid work
    resolve: {
        extensions: ['.ts', '.js'], // support ts-files and js-files
    },
    module: {
        rules: [
            {
                parser: {
                    amd: false
                },
                include: /node_modules\/lodash\// // https://github.com/lodash/lodash/issues/3052
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: { loader: 'babel-loader' }
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader"
                ]
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{ loader: 'ts-loader' }]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name].css",
            chunkFilename: "[id].css"
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
};