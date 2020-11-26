const pkg = require('./package.json');

module.exports = {
  entry: './src/index.ts',
  output: {
    library: pkg.name,
    libraryTarget: 'umd',
    filename: 'index.js',
    path: `${__dirname}/lib`,
    environment: {
      arrowFunction: false,
      destructuring: false
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        loader: 'babel-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  }
};
