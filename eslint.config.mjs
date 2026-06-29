import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// Flat config (ESLint 9 / Next 16). Replaces the legacy .eslintrc.json which
// is no longer supported by `next lint` (removed in Next 16).
const config = [
    {
        ignores: ['.next/**', 'out/**', 'node_modules/**', 'public/**', 'next-env.d.ts'],
    },
    ...nextCoreWebVitals,
    {
        // The react-hooks v6 plugin (shipped with eslint-config-next 16) adds a
        // batch of strict "React Compiler" rules that flag many pre-existing
        // patterns across the codebase. Keep them as warnings so the lint stays
        // informative without blocking, rather than rewriting the whole app.
        rules: {
            'react-hooks/refs': 'warn',
            'react-hooks/static-components': 'warn',
            'react-hooks/immutability': 'warn',
            'react-hooks/purity': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/set-state-in-render': 'warn',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },
];

export default config;
