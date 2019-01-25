const path = require('path');
const webpack = require('webpack');

module.exports = {
	entry: path.resolve(__dirname, 'socketClient.js'),
	optimization: {
		minimize: true,
		concatenateModules: true,
	},
	mode: 'production',
	plugins : [
		new webpack.DefinePlugin({
		  'process.env': {
			'NODE_ENV': JSON.stringify('production')
		  }
		}),
		new webpack.optimize.AggressiveMergingPlugin()
	],
	output: {
		filename: 'socketClient.js',
		path: path.resolve(__dirname, 'dist')
	}
}