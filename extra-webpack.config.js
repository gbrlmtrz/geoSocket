const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    "entry": {
        "webworker": [
            "./src/angularApp/workerLoader.ts"
        ]
    },
    "plugins": [
        new HtmlWebpackPlugin({
            "excludeChunks": [
                "webworker"
            ],
        })
    ],
    "output": {
        "globalObject": 'this'
    }
};