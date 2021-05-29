const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const resolve = p => path.resolve(fs.realpathSync(process.cwd()), p);

module.exports = {
    mode: 'development',
    entry: {
        'ts': [
            require.resolve('react-hot-loader/patch'),
            resolve('src/index.tsx')
        ]
    },
    output: {
        pathinfo: true,
        publicPath: '/',
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js'
    },
    module: {
    	rules: [
    	{
    	    test: /\.(js|jsx|ts|tsx)$/,
    	    exclude: /node_modules/,
    	    loader: "babel-loader",
    	    options: {
    	        cacheDirectory: true,
    	        plugins: ['react-hot-loader/babel'],
    	        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript']
    	    }
    	}]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    plugins: [
        new HtmlWebpackPlugin({ template: 'src/index.html' }),
        new webpack.HotModuleReplacementPlugin()
    ],
    devServer: {
        port: 8000,
        hot: true,
        disableHostCheck: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8082',
                pathRewrite: {'^/api/performance': '/', '^/api/containermanager': '/manager'}
            }
        }
    }
};
