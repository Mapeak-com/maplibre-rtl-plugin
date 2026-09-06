/**
 * Bundles the plugin into the two files MapLibre can load.
 *
 * `maplibre-rtl-plugin.mjs` is the one to use: MapLibre imports a `.mjs` URL directly, so it needs
 * no `unsafe-eval` in the worker's content security policy. `maplibre-rtl-plugin.js` is the same
 * code as a classic script, for setups that cannot serve modules.
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

const root = join(import.meta.dirname, '..');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const banner = `/* maplibre-rtl-plugin ${version} | MIT | https://github.com/Mapeak-com/maplibre-rtl-plugin */`;

const shared = {
    bundle: true,
    minify: true,
    target: 'es2022',
    banner: { js: banner },
    logLevel: 'info',
} as const;

await build({
    ...shared,
    entryPoints: [join(root, 'src', 'index.ts')],
    outfile: join(root, 'dist', 'maplibre-rtl-plugin.mjs'),
    format: 'esm',
});

await build({
    ...shared,
    entryPoints: [join(root, 'src', 'index.ts')],
    outfile: join(root, 'dist', 'maplibre-rtl-plugin.js'),
    format: 'iife',
});

await build({
    ...shared,
    entryPoints: [join(root, 'src', 'plugin.ts')],
    outfile: join(root, 'dist', 'plugin.mjs'),
    format: 'esm',
});

for (const name of ['maplibre-rtl-plugin.mjs', 'maplibre-rtl-plugin.js', 'plugin.mjs']) {
    const contents = readFileSync(join(root, 'dist', name));
    const gzipped = gzipSync(contents, { level: 9 }).length;
    console.log(`${name}: ${(contents.length / 1024).toFixed(1)} kB, ${(gzipped / 1024).toFixed(1)} kB gzipped`);
}

writeFileSync(join(root, 'dist', 'version.txt'), `${version}\n`);
