const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimize for performance
config.transformer = {
  ...config.transformer,
  // Enable minification in production
  minifierConfig: {
    // Preserve function names for better error reporting
    keep_fnames: true,
    // Enable mangle for smaller bundle size
    mangle: {
      keep_fnames: true,
    },
  },
  // Enable inline requires for better code splitting
  inlineRequires: true,
};

// Optimize resolver
config.resolver = {
  ...config.resolver,
  // Enable tree shaking for better dead code elimination
  unstable_enablePackageExports: true,
  // Prefer ES modules when available
  unstable_conditionNames: ['react-native', 'browser', 'require'],
};

// Optimize watcher for faster rebuilds
config.watchFolders = [
  // Only watch source directories for changes
  __dirname + '/app',
  __dirname + '/components',
  __dirname + '/constants',
  __dirname + '/hooks',
  __dirname + '/screens',
  __dirname + '/store',
  __dirname + '/systems',
  __dirname + '/utils',
];

// Let Metro use its default cache system

// Performance optimizations for development
if (process.env.NODE_ENV === 'development') {
  // Enable source maps for better debugging
  config.transformer.enableBabelRCLookup = false;
  config.transformer.enableBabelRuntime = false;

  // Faster rebuilds in development
  config.cacheVersion = '1.0';
}

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Enable all optimizations for production builds
  config.transformer.inlineRequires = true;
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    // More aggressive minification in production
    mangle: true,
    compress: {
      drop_console: true, // Remove console.log statements
      drop_debugger: true, // Remove debugger statements
    },
  };
}

module.exports = config;
