import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', '.git/**', 'dist/**', 'build/**', 'coverage/**', 'prisma/migrations/**'],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      'react/no-unescaped-entities': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/incompatible-library': 'warn',
    },
  },
]

export default config
