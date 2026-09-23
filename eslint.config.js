import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  // supabase/functions run on Deno (remote imports, Deno global) — not part of
  // the Vite/Node app, so the Node-oriented lint config doesn't apply.
  {
    ignores: [
      'dist',
      'node_modules',
      'src/types/database.generated.ts',
      'supabase/functions',
      'src-tauri',
      // Generated native shells — not app source.
      'android',
      'ios',
      // Agent worktrees are whole checkouts; linting them doubles every tsconfig root.
      '.claude',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Tailwind arbitrary values (`text-[13px]`, `rounded-[11px]`) bypass the
      // type scale, radii and colour tokens. A warning, not an error: there are
      // hundreds to retire opportunistically, and new ones should be visible.
      // Built-in rule rather than a plugin: it only has to spot `-[` in a class.
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)[!-]?[a-z][\\w:-]*-\\[[^\\]]+\\]/], CallExpression[callee.name='cn'] Literal[value=/(^|\\s)[!-]?[a-z][\\w:-]*-\\[[^\\]]+\\]/]",
          message:
            'Arbitrary Tailwind value — use a token from tailwind.config.ts (type scale, radii, colours).',
        },
      ],
    },
  },
  prettier,
)
