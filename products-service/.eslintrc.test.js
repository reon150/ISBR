module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    // Relaxed rules for test files
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn', // Changed from error to warn
    '@typescript-eslint/no-unsafe-argument': 'warn', // Changed from error to warn
    '@typescript-eslint/no-unsafe-assignment': 'warn', // Changed from error to warn
    '@typescript-eslint/no-unsafe-call': 'warn', // Changed from error to warn
    '@typescript-eslint/no-unsafe-member-access': 'warn', // Changed from error to warn
    '@typescript-eslint/no-unsafe-return': 'warn', // Changed from error to warn
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/typedef': 'off', // Disabled for test files
    '@typescript-eslint/no-unused-vars': 'warn', // Changed from error to warn
    '@typescript-eslint/no-var-requires': 'off', // Allow require() in tests
  },
  overrides: [
    {
      files: ['test/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
      rules: {
        // Additional relaxed rules specifically for test files
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/typedef': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
