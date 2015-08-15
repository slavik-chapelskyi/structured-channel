module.exports = function (config) {
  config.set({
    basePath: '',
    browsers: ['Chrome', 'Firefox'],
    frameworks: ['mocha', 'chai'],
    files: [
      'dist/structured-channel.js',
      'tests/helper_*',
      'tests/test_*.js'
    ],
  })
};
