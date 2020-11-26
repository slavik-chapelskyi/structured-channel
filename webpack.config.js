module.exports = {
  entry: './src/index.ts',
  output: {
    library: 'StructuredChannel',
    libraryTarget: 'umd',
    path: `${__dirname}/lib`,
    globalObject: 'this',
    environment: {
      arrowFunction: false
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
