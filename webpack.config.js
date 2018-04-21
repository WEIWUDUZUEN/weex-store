const path = require('path');
const webpack = require('webpack')
const uglify = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    devtool: false,
    output: {
        path: path.resolve('./dist'),
        filename: 'index.js',
        libraryTarget: 'commonjs2'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        // new uglify(),
        new webpack.DefinePlugin({
            'process.env': 'production'
        }),
        // minify with dead-code elimination
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        // optimize module ids by occurrence count
        //new webpack.optimize.OccurrenceOrderPlugin()
    ]
}