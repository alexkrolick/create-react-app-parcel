// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @remove-on-eject-end
'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');
// @remove-on-eject-begin
// Do the preflight check (only happens before eject).
const verifyPackageTree = require('./utils/verifyPackageTree');
if (process.env.SKIP_PREFLIGHT_CHECK !== 'true') {
  verifyPackageTree();
}
// @remove-on-eject-end

const chalk = require('chalk');
// const webpack = require('webpack');
// const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const paths = require('../config/paths');
// const config = require('../config/webpack.config.dev');
// const createDevServerConfig = require('../config/webpackDevServer.config');

const isInteractive = process.stdout.isTTY;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// Tools like Cloud9 rely on this.
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 1234;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(
    `Learn more here: ${chalk.yellow('http://bit.ly/CRA-advanced-config')}`
  );
  console.log();
}

// We require that you explictly set browsers and do not fall back to
// browserslist defaults.
// const { checkBrowsers } = require('react-dev-utils/browsersHelper');
const { checkBrowsers } = require('./react-dev-utils/browsersHelper');
checkBrowsers(paths.appPath)
  .then(() => {
    // We attempt to use the default port but if it is busy, we offer the user to
    // run on a different port. `choosePort()` Promise resolves to the next free port.
    return choosePort(HOST, DEFAULT_PORT);
  })
  .then(port => {
    if (port == null) {
      // We have not found a port.
      return;
    }
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const appName = require(paths.appPackageJson).name;
    const urls = prepareUrls(protocol, HOST, port);
    // // Create a webpack compiler that is configured with custom messages.
    // const compiler = createCompiler(
    //   webpack,
    //   config,
    //   appName,
    //   urls,
    //   paths.useYarn
    // );
    // Load proxy config
    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(proxySetting, paths.appPublic);

    // ************************* old webpack jank *************************
    // // Serve webpack assets generated by the compiler over a web server.
    // const serverConfig = createDevServerConfig(
    //   proxyConfig,
    //   urls.lanUrlForConfig
    // );
    // const devServer = new WebpackDevServer(compiler, serverConfig);
    // // Launch WebpackDevServer.
    // devServer.listen(port, HOST, err => {
    //   if (err) {
    //     return console.log(err);
    //   }
    //   if (isInteractive) {
    //     clearConsole();
    //   }
    //   console.log(chalk.cyan('Starting the development server...\n'));
    //   openBrowser(urls.localUrlForBrowser);
    // });
    // ************************* old webpack jank *************************

    // ************************* new parcel hotness *************************
    // https://parceljs.org/api.html
    const Bundler = require('parcel-bundler');
    const app = require('express')();

    function start() {
      const file = paths.appHtml; // Pass an absolute path to the entrypoint here
      const options = {}; // See options section of api docs, for the possibilities

      // Initialise a new bundler using a file and options
      const bundler = new Bundler(file, options);

      // Let express use the bundler middleware, this will let parcel handle every request over your express server
      app.use(bundler.middleware());

      // Listen on port 8080
      app.listen(port, err => {
        if (err) {
          return console.log(err);
        }
        if (isInteractive) {
          clearConsole();
        }
        console.log(
          'Bundling success! Your app is live at ',
          urls.localUrlForBrowser
        );
        console.log(chalk.cyan('Starting the development server...\n'));
        openBrowser(urls.localUrlForBrowser);
      });
    }

    start();
    // ************************* new parcel hotness *************************

    ['SIGINT', 'SIGTERM'].forEach(function(sig) {
      process.on(sig, function() {
        // devServer.close();
        console.log('closing CRAP');
        process.exit();
      });
    });
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
