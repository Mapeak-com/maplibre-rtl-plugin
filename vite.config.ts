import { defineConfig } from 'vite';

/**
 * Serves `debug/index.html` against the built plugin, for checking it in a real map by eye.
 *
 * The root stays at the repository so that the page can reach both `dist` and the copy of MapLibre
 * in `node_modules` by absolute path.
 */
export default defineConfig({
    server: {
        open: '/debug/index.html',
    },
});
