const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add SVG support
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// Remove svg from assetExts
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');

// Add svg to sourceExts
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;