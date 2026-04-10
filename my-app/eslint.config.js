const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const testingLibraryPlugin = require('eslint-plugin-testing-library');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'reports/*', 'backend/dist/*'],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', 'backend/**/*.{ts,tsx}'],
    plugins: {
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      '@typescript-eslint/array-type': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@expo/vector-icons',
              message:
                'Use AppIcon so icon semantics stay centralized and testable.',
            },
          ],
        },
      ],
      'unused-imports/no-unused-imports': 'error',
    },
  },
  {
    files: ['src/components/common/AppIcon.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['jest.setup.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}'],
    plugins: {
      'testing-library': testingLibraryPlugin,
    },
    languageOptions: {
      globals: {
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      'testing-library/no-node-access': 'error',
      'testing-library/prefer-screen-queries': 'error',
    },
  },
]);
