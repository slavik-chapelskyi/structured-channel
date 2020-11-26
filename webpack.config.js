const pkg = require('./package.json');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  output: {
    library: pkg.name,
    libraryTarget: 'umd',
    umdNamedDefine: true,
    filename: 'index.js',
    path: `${__dirname}/lib`
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
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.json']
  }
};
