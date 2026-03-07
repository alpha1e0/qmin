const path = require('path');

module.exports = {
  publicPath: '/static/',
  lintOnSave: false,  // Disable ESLint on save temporarily
  pluginOptions: {
    electronBuilder: {
      preload: 'src/preload.js',
      // Use the background.js as main process entry (which imports compiled TypeScript)
      mainProcessFile: 'src/background.js',
      // Disable main process bundling - we'll use tsc directly
      bundleMainProcess: false,
      // List of files for the main process build to watch
      mainProcessWatch: ['src/main/**/*.ts', 'src/preload.js', 'src/background.js'],
      // Remove chainWebpackMainProcess since we're not bundling
      builderOptions: {
        extraResources: [
          {
            from: 'backend/data',
            to: 'data',
          }
        ],
        win: {
          target: ['nsis'],
          artifactName: '${productName}-${version}-setup.${ext}'
        },
        mac: {
          target: ['dmg'],
          artifactName: '${productName}-${version}.${ext}'
        },
        linux: {
          target: ['AppImage'],
          artifactName: '${productName}-${version}.${ext}'
        }
      }
    }
  },
  chainWebpack: (config) => {
    // Handle the define plugin properly
    if (config.plugins.has('define')) {
      config.plugin('define').tap((definitions) => {
        Object.assign(definitions[0], {
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
        });
        return definitions;
      });
    }

    // Configure path alias
    config.resolve.alias.set('@', path.resolve(__dirname, 'src'));

    // Ensure TypeScript files are processed correctly
    config.module
      .rule('ts')
      .test(/\.ts$/)
      .use('ts-loader')
      .loader('ts-loader')
      .options({
        appendTsSuffixTo: [/\.vue$/],
        transpileOnly: true
      })
      .before('babel-loader');
  },
  transpileDependencies: [
    'sharp',
    'better-sqlite3'
  ]
}
