const { override, fixBabelImports, addLessLoader } = require('customize-cra');
const path = require('path');

const loadOutput = (outputOptions) => (config) => {
  if (!config.output) {
      config.output = {}
  }

  Object.assign(config.output, {
      path: path.resolve(__dirname + '/dist'),
      filename: '[name].SendBird.js',
      publicPath: 'dist',
      library: 'SendBirdWidget',
      libraryTarget: 'umd'
  });

    return config;
};

const loadEntry = (entryOptions) => (config) => {

    if (!config.entry) {
        config.entry = {}
    }

    config.entry.widget = ['babel-polyfill', './src/js/widget.js'];

    return config;
};

module.exports = override(
       fixBabelImports('import', {
           libraryName: 'antd',
           libraryDirectory: 'es',
           style: true,
       }),
        addLessLoader({
            javascriptEnabled: true,
            modifyVars: { '@primary-color': '#754315' },
        }),
        //loadOutput({}),
        loadEntry({})
);