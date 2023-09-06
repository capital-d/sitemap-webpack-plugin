import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coveragePathIgnorePatterns: ["/node_modules/", "/test/"],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  moduleNameMapper: {
    '^(.*)\\.js$': '$1',
  },
  // testEnvironment: 'jest-environment-node',
  transformIgnorePatterns: [
    'node_modules/(?!aggregate-error|clean-stack|escape-string-regexp|indent-string|p-map)',
  ],
};

export default config;