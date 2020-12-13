const { resolve } = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const devServerConfig = require('./dev-server-config');

const event = process.env.npm_lifecycle_event;

const clientConfig = {
  mode: (event === 'build') ? 'production' : 'development',
  context: resolve('./src'),
  entry: './www-entry.js',
  output: {
    path: resolve('./www'),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: [
            '@babel/env',
            '@babel/react',
          ],
          plugins: [
            '@babel/transform-runtime',
            'relaks/transform-memo',
          ]
        }
      },
      {
        test: /\.scss$/,
        use: [
          MiniCSSExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ],
      },
      {
        test: /\.(jpeg|jpg|png|gif)$/,
        loader: 'file-loader',
      },
    ]
  },
  plugins: [
    new MiniCSSExtractPlugin,
    new BundleAnalyzerPlugin({
      analyzerMode: (event === 'build') ? 'static' : 'disabled',
      reportFilename: `report.html`,
      openAnalyzer: false,
    }),
  ],
  optimization: {
    concatenateModules: false,
  },
  devtool: (event === 'build') ? 'source-map' : 'inline-source-map',
  devServer: devServerConfig,
};

const serverConfig = {
  mode: clientConfig.mode,
  context: clientConfig.context,
  entry: './ssr-entry.js',
  target: 'node',
  output: {
    path: resolve('./ssr'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  module: clientConfig.module,
  plugins: clientConfig.plugins.filter((p) => !(p instanceof BundleAnalyzerPlugin)),
};

module.exports = [ clientConfig, serverConfig ];
