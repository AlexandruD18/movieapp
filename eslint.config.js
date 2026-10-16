import js from '@eslint/js';
import globals from 'globals';

export default [
    { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'coverage/', 'js/config.js'] },
    js.configs.recommended,
    {
        files: ['js/**/*.js'],
        languageOptions: { globals: globals.browser },
    },
    {
        files: ['tests/**/*.js', 'scripts/**/*.js', '*.config.js'],
        languageOptions: { globals: { ...globals.node, ...globals.browser } },
    },
    {
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'prefer-const': 'error',
            eqeqeq: 'error',
            'no-var': 'error',
        },
    },
];
