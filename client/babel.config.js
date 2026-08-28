module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Make sure react-native-reanimated/plugin is listed LAST
      'react-native-reanimated/plugin',
    ],
  };
};