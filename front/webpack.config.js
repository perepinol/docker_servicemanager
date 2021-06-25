const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    module: {
    	rules: [{
    	    test: /\.(ts|tsx|js|jsx)$/,
    	    exclude: /node_modules/,
    	    loader: 'babel-loader',
    	    options: {
    	        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript']
    	    }
    	}]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            base: '/manager/'
        })
    ]
};
