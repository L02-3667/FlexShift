module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/*.module.ts'],
  coverageDirectory: '<rootDir>/../reports/tests/coverage/backend',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '../reports/tests/junit/backend',
        outputName: 'junit.xml',
      },
    ],
  ],
};
