import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'eslint.config.js'] },
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
];
