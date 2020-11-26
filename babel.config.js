module.exports = {
  plugins: ['@babel/plugin-proposal-class-properties'],
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        targets: ['last 4 versions, ie >= 11']
      }
    ]
  ]
};
