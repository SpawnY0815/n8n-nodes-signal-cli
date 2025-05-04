module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  prettierPath: require.resolve('prettier'),
  testTimeout: 20000,
};
