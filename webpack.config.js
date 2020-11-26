const path = require('path');
const pkg = require('./package.json');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    library: pkg.name,
    libraryTarget: 'umd',
    umdNamedDefine: true,
    filename: '[name].js',
    path: path.resolve(__dirname, 'lib')
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true
        }
      }
    ]
  }
};
