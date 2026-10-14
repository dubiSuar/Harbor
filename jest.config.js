module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // phosphor-react-native ships per-icon .tsx sources (src/icons/*), which
  // Babel must transform like the react-native packages.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|phosphor-react-native)/)',
  ],
};
