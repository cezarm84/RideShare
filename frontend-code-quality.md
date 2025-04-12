# Frontend Code Quality Tools

## Tools

1. **ESLint**: JavaScript/TypeScript linter
2. **Prettier**: Code formatter
3. **TypeScript**: Static type checking
4. **Stylelint**: CSS/SCSS linter
5. **Jest**: Test runner with coverage reporting

## Configuration Files

### .eslintrc.js

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
    'prettier',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {},
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    // React
    'react/prop-types': 'off', // We use TypeScript for prop validation
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // TypeScript
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],

    // Import
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prettier/prettier': 'error',
  },
};
```

### .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### stylelint.config.js

```javascript
module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-prettier',
  ],
  plugins: [
    'stylelint-order',
  ],
  rules: {
    'order/properties-alphabetical-order': true,
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
        ],
      },
    ],
    'declaration-block-trailing-semicolon': null,
    'no-descending-specificity': null,
  },
};
```

## CI Integration

Add these checks to your CI pipeline:

```yaml
- name: Run ESLint
  run: npm run lint

- name: Run TypeScript type checking
  run: npm run type-check

- name: Run tests with coverage
  run: npm test -- --coverage
```

## Editor Integration

### VS Code settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "css.validate": false,
  "scss.validate": false,
  "stylelint.validate": ["css", "scss", "postcss"]
}
```

## Best Practices

1. **Use consistent naming conventions**
   - Components: PascalCase (e.g., `UserProfile.tsx`)
   - Hooks: camelCase with 'use' prefix (e.g., `useAuth.ts`)
   - Utilities: camelCase (e.g., `formatDate.ts`)

2. **Organize imports consistently**
   - React/libraries first
   - Components second
   - Hooks third
   - Utilities/constants last

3. **Use TypeScript effectively**
   - Define interfaces for component props
   - Use union types for state
   - Avoid `any` when possible

4. **Write maintainable CSS**
   - Use Tailwind utility classes or CSS modules
   - Avoid global styles
   - Follow BEM naming convention when using custom CSS
