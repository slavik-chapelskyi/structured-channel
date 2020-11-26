module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: ['last 4 versions', 'ie >= 11']
      }
    ],
    '@babel/preset-typescript'
  ]
};
