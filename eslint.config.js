// ESLint nur für die Regeln, die TypeScript nicht prüft (Audit T-2): Hooks-Regeln von React.
// „rules-of-hooks“ als Fehler (Hooks nie bedingt aufrufen), „exhaustive-deps“ als Fehler, damit veraltete Anzeigen
// und Endlosschleifen auffallen. Bewusste Ausnahmen stehen mit eslint-disable-line und Begründung im Code.
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/**', '.ui-check/**', 'scripts/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { 'react-hooks': reactHooks },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
