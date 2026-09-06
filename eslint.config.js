import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist/', 'coverage/', 'src/*.g.ts'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            'indent': ['error', 4, { SwitchCase: 1 }],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'semi': ['error', 'always'],
            'comma-dangle': ['error', 'only-multiline'],
            'eol-last': 'error',
            'no-trailing-spaces': 'error',
            'object-curly-spacing': ['error', 'never'],
            'prefer-const': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
        },
    },
);
