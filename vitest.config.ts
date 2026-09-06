import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        /**
         * The conformance suite is left out of the default run because it downloads the plugin it
         * compares against. `npm run test:conformance` is what runs it.
         */
        include: ['test/*.test.ts'],
        coverage: {
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts', 'src/**/*.g.ts'],
        },
    },
});
