const path = require('path')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const appDirectory = fs.realpathSync(process.cwd())
const appSrc = path.resolve(appDirectory, 'src/index.ts')
const appDist = path.resolve(appDirectory, 'dist')


module.exports = {
    mode: 'development',
    entry: appSrc,
    output: {
        filename: 'index.js',
        path: appDist
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    },
    optimization: {
        minimize: false
    },
    plugins: [new HtmlWebpackPlugin()]
}