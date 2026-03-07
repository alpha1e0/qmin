// This file is the main entry point for Electron
// The actual main process code is in src/main/background.ts and compiled to dist/background.js

const path = require('path');
// Require the compiled TypeScript file from dist directory
require(path.join(__dirname, '..', 'dist', 'background.js'));
