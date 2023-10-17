const path = require("path");                                       /* see: https://nodejs.org/api/path.html */
const HtmlWebpackPlugin = require("html-webpack-plugin");           /* see: https://webpack.js.org/plugins/html-webpack-plugin/ */
const MiniCssExtractPlugin = require("mini-css-extract-plugin");    /* see: https://webpack.js.org/plugins/mini-css-extract-plugin/ */
const StormPlugin = require("../dist/plugin/StormPlugin.js");       /* see: https://github.com/tmslpm/storm-snippets */

// 0) setup all configuration and run webpack command
// 1) webpack generate template with JS and CSS (html-webpack-plugin)
// 2) webpack get template generated and generate static website (StormPlugin)
const CFG = {
    ENTRY: [
        "./storm.config.json",
        "./public/app.js",
        "./public/theme.css"
    ],
    /* define html base url */
    HTML_BASE_URL: "http://127.0.0.1:3000/example/dist/",
    /* define html template used */
    HTML_PATH_INDEX: "public/index.html",
    /* define path folder output*/
    FOLDER_OUTPUT: "dist",
    /* define name for bundle js */
    NAME_BUNDLE_JS: "bundle"
}

module.exports = {
    /* [GEN] config entry  */
    entry: CFG.ENTRY,

    /* [GEN] config output  */
    output: {
        path: path.resolve(__dirname, CFG.FOLDER_OUTPUT),
        filename: `${CFG.NAME_BUNDLE_JS}`,
        clean: true,
    },

    /* [GEN] add plugin to webpack process */
    plugins: [
        new HtmlWebpackPlugin({ hash: true, base: CFG.HTML_BASE_URL, template: CFG.HTML_PATH_INDEX }),
        new MiniCssExtractPlugin(),
        new StormPlugin()
    ],

    /* [GEN] add loader for the css */
    module: {
        rules: [
            { test: /\.css$/i, use: [MiniCssExtractPlugin.loader, "css-loader"] },
        ],
    },

    /* [GEN] config enable optimization */
    optimization: {
        minimize: true, removeEmptyChunks: true
    },

    /* [DEV] config watch behavior */
    watchOptions: {
        aggregateTimeout: 200, poll: 1000, ignored: ["**/node_modules", path.posix.resolve(__dirname, CFG.FOLDER_OUTPUT)]
    },

    /* [DEV] config localhost server */
    devServer: {
        compress: true, port: 8080, contentBase: path.join(__dirname, CFG.FOLDER_OUTPUT)
    },

    /* [DEV] config for infrastructure level logging */
    infrastructureLogging: {
        appendOnly: true, level: 'verbose'
    },
}; 
