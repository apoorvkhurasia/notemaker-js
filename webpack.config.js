/* eslint-disable node/no-unpublished-require */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');

module.exports = {
  devServer: {
    devMiddleware: {
      index: true,
      mimeTypes: {phtml: 'text/html'},
      publicPath: '/',
      serverSideRender: true,
      writeToDisk: true,
    },
  },
  entry: './src/index.tsx',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(ico|png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
        type: 'asset',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      favicon: './src/img/favicon.png',
      chunks: ['main'],
    }),
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: true,
    }),
    new WebpackPwaManifest({
      name: 'MDTeX Note Taker',
      short_name: 'mdtexnotes',
      description: 'Take notes in markdown and LaTeX',
      crossorigin: 'use-credentials', //can be null, use-credentials or anonymous
      start_url: '/',
      background_color: '#fffdf5',
      theme_color: '#2f3d58',
      orientation: 'any',
      display: 'standalone',
      publicPath: '/',
      icons: [
        {
          src: path.resolve('src/img/icon.png'),
          sizes: [96, 128, 192, 256, 384, 512], // multiple sizes
        },
      ],
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};
