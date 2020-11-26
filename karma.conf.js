module.exports = function (config) {
  config.set({
    basePath: '',
    browsers: ['Chrome'],
    frameworks: ['mocha', 'chai'],
    files: [
      'lib/index.js',
      {pattern: 'tests/helper_*', included: false},
      'tests/helper_functions.js',
      'tests/test_*.js'
    ]
  });
};
