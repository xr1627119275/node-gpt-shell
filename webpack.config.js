const path = require('path')
const webpack = require('webpack')
module.exports = {
    mode: process.env.NODE_ENV || 'development',
    target: 'node',
    // target: "browserslist:node 14",
    entry: './src/index.js',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    optimization: {
      minimizer: [
        new webpack.BannerPlugin({
          banner: '#!/usr/bin/env node\n',
          raw: true,
          entryOnly: true,
        })
      ]
    }
};
 