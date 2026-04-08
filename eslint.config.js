import nextEslintPlugin from '@next/eslint-plugin-next';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: [
      '.next',
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      'prisma/migrations',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextEslintPlugin,
    },
    rules: {
      ...nextEslintPlugin.configs.recommended.rules,
      ...nextEslintPlugin.configs['core-web-vitals'].rules,
    },
  },
];


