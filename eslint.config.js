import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';

const noServerImports = {
  regex: '^(\\.\\./)+(api|server)/',
  message: 'The browser app must not import server code. Use `@shared/*` for contracts.',
};

const noBrowserImports = [
  {
    regex: '^(\\.\\./)+src/',
    message: 'Server and shared code must not import from the browser app.',
  },
  {
    group: ['@/*'],
    message: 'Server and shared code must not import from the browser app.',
  },
];

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettierConfig,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/features/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            noServerImports,
            {
              group: ['@/features/*/*'],
              message: "Import from the feature's public `index.ts` instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noServerImports] }],
    },
  },
  {
    files: ['api/**/*.ts', 'server/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-restricted-imports': ['error', { patterns: noBrowserImports }],
    },
  },
  {
    files: ['shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...noBrowserImports,
            {
              regex: '^(\\.\\./)+(api|server)/',
              message: 'Shared contracts must not import server code.',
            },
          ],
        },
      ],
    },
  },
]);
