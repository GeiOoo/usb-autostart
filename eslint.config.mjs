import stylistic from '@stylistic/eslint-plugin';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import sortExports from 'eslint-plugin-sort-exports';

export default {
    files: [
        '**/*.tsx',
        '**/*.ts',
        'eslint.config.mjs',
    ],
    ignores: [
        'node_modules/**/*',
        'dist-electron/**/*',
    ],
    plugins: {
        '@stylistic': stylistic,
        'sort-exports': sortExports,
        'react': reactPlugin,
        '@typescript-eslint': tsPlugin,
    },
    linterOptions: {
        noInlineConfig: false,
    },
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tsParser,
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        'no-restricted-imports': [
            'error',
            {
                'paths': [
                    {
                        'name': '@emotion/react',
                        'importNames': [ 'ThemeProvider', 'useTheme' ],
                        'message': 'Importing ThemeProvider or useTheme from @emotion/react is not allowed.',
                    },
                ],
            },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-duplicate-enum-values': 'error',
        'eqeqeq': [
            'error',
            'always',
            {
                'null': 'ignore',
            },
        ],
        'sort-exports/sort-exports': [
            'error',
            {
                'sortDir': 'asc',
            },
        ],
        'no-fallthrough': [ 'error', { 'allowEmptyCase': false } ],
        'camelcase': 'error',
        'complexity': [ 'off', 10 ],
        'curly': 'error',
        'default-case-last': 'error',
        'default-param-last': 'error',
        'dot-notation': 'error',
        'max-classes-per-file': 'error',
        'no-case-declarations': 'off',
        'no-param-reassign': 'error',
        'no-var': 'error',
        'prefer-destructuring': 'error',
        'prefer-object-spread': 'error',
        'require-await': 'error',
        'yoda': 'error',
        'react/destructuring-assignment': [ 'error', 'always' ],
        'react/jsx-key': 'error',
        'react/jsx-no-useless-fragment': 'error',
        'react/react-in-jsx-scope': 'off',
        '@stylistic/array-bracket-spacing': [ 'error', 'always' ],
        '@stylistic/arrow-spacing': [ 'error', { 'before': true, 'after': true } ],
        '@stylistic/block-spacing': 'error',
        '@stylistic/comma-dangle': [
            'error',
            {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never',
                'enums': 'always-multiline',
            },
        ],
        '@stylistic/comma-spacing': 'error',
        '@stylistic/comma-style': [ 'error', 'last' ],
        '@stylistic/function-call-spacing': 'error',
        '@stylistic/implicit-arrow-linebreak': 'error',
        '@stylistic/indent': [ 'error', 4, { 'SwitchCase': 1 } ],
        '@stylistic/jsx-quotes': [ 'error', 'prefer-double' ],
        '@stylistic/key-spacing': 'error',
        '@stylistic/keyword-spacing': 'error',
        '@stylistic/member-delimiter-style': [
            'error',
            {
                'multiline': {
                    'delimiter': 'comma',
                    'requireLast': true,
                },
                'singleline': {
                    'delimiter': 'comma',
                    'requireLast': false,
                },
                'multilineDetection': 'brackets',
            },
        ],
        '@stylistic/no-extra-semi': 'error',
        '@stylistic/no-multi-spaces': 'error',
        '@stylistic/no-multiple-empty-lines': [
            'error',
            {
                'max': 1,
                'maxEOF': 0,
            },
        ],
        '@stylistic/no-trailing-spaces': 'error',
        '@stylistic/no-whitespace-before-property': 'error',
        '@stylistic/object-curly-spacing': [ 'error', 'always' ],
        '@stylistic/quotes': [ 'error', 'single', { 'avoidEscape': true } ],
        '@stylistic/rest-spread-spacing': [ 'error', 'never' ],
        '@stylistic/semi': [ 'error', 'always' ],
        '@stylistic/semi-spacing': 'error',
        '@stylistic/space-before-blocks': [ 'error', 'always' ],
        '@stylistic/space-before-function-paren': [
            'error',
            {
                'anonymous': 'never',
                'named': 'never',
                'asyncArrow': 'always',
            } ],
        '@stylistic/space-in-parens': [ 'error', 'never' ],
        '@stylistic/space-infix-ops': 'error',
        '@stylistic/space-unary-ops': 'error',
        '@stylistic/switch-colon-spacing': 'error',
        '@stylistic/template-curly-spacing': 'error',
        '@stylistic/type-annotation-spacing': [
            'error',
            {
                'before': true,
                'after': true,
                'overrides': { 'colon': { 'before': false, 'after': true } },
            },
        ],
        '@stylistic/jsx-closing-bracket-location': [
            'error',
            {
                'selfClosing': 'line-aligned',
                'nonEmpty': 'line-aligned',
            },
        ],
        '@stylistic/jsx-closing-tag-location': 'error',
        '@stylistic/jsx-curly-newline': [ 'error', 'consistent' ],
        '@stylistic/jsx-curly-spacing': [
            'error',
            {
                'attributes': { 'when': 'never' },
                'children': { 'when': 'never' },
            },
        ],
        '@stylistic/jsx-equals-spacing': [ 'error', 'never' ],
        '@stylistic/jsx-first-prop-new-line': [ 'error', 'multiline-multiprop' ],
        '@stylistic/jsx-indent': [
            'error',
            4,
            {
                'checkAttributes': true,
                'indentLogicalExpressions': true,
            },
        ],
        '@stylistic/jsx-max-props-per-line': [
            'error',
            {
                'maximum': {
                    'single': 3,
                    'multi': 1,
                },
            },
        ],
        '@stylistic/jsx-props-no-multi-spaces': 'error',
        '@stylistic/jsx-self-closing-comp': 'error',
        '@stylistic/jsx-sort-props': [
            'error',
            {
                'shorthandLast': true,
                'reservedFirst': [ 'key' ],
                'multiline': 'last',
            },
        ],
        '@stylistic/jsx-tag-spacing': [
            'error',
            {
                'closingSlash': 'never',
                'beforeSelfClosing': 'always',
                'afterOpening': 'never',
                'beforeClosing': 'never',
            },
        ],
        '@stylistic/jsx-wrap-multilines': [
            'error',
            {
                'declaration': 'parens-new-line',
                'assignment': 'parens-new-line',
                'return': 'parens-new-line',
                'arrow': 'parens-new-line',
                'condition': 'parens-new-line',
                'logical': 'parens-new-line',
                'prop': 'parens-new-line',
            },
        ],
    },
};
