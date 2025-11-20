module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ...add other plugins you might need (like module-resolver, etc.)
    'react-native-reanimated/plugin', // 👈 MUST be last
  ],
};
