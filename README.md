# maplibre-rtl-plugin

Right-to-left text for [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js): Arabic shaping
and the Unicode bidirectional algorithm, written in JavaScript rather than compiled from ICU.

It is a drop-in replacement for [`@mapbox/mapbox-gl-rtl-text`](https://github.com/mapbox/mapbox-gl-rtl-text),
implementing the same three functions, and is about a quarter of the size.

| plugin | raw | gzipped |
| --- | ---: | ---: |
| `@mapbox/mapbox-gl-rtl-text@0.2.3` (asm.js) | 427 kB | 59 kB |
| `@mapbox/mapbox-gl-rtl-text@0.4.0` | 133 kB | 37 kB |
| **`maplibre-rtl-plugin`** | **20 kB** | **9 kB** |

## Installing

```sh
npm install maplibre-rtl-plugin
```

Or use it straight from a CDN, which is what the examples below do.

## Using it

MapLibre runs text layout on a worker, so the plugin has to be loaded there. There are two ways in,
and the first is better.

### `importScriptInWorkers`

```js
import {Map, importScriptInWorkers} from 'maplibre-gl';

await importScriptInWorkers('https://unpkg.com/maplibre-rtl-plugin/dist/maplibre-rtl-plugin.mjs');

const map = new Map({container: 'map', style: 'https://demotiles.maplibre.org/style.json'});
```

MapLibre imports a `.mjs` URL as a module, so nothing is `eval`ed and the worker needs neither
`unsafe-eval` nor `script-src blob:` in its content security policy. It also skips MapLibre's
deferred-plugin state machine entirely: there is no plugin status to track and no lazy-load to wait
on.

**Load it before the map starts parsing tiles.** Await the import before constructing the `Map`, as
above. Tiles parsed before the plugin arrives are laid out without it and are not reloaded once it
lands, so their labels stay unshaped.

### `setRTLTextPlugin`

The classic entry point works too, including its deferred third argument:

```js
import {setRTLTextPlugin} from 'maplibre-gl';

setRTLTextPlugin('https://unpkg.com/maplibre-rtl-plugin/dist/maplibre-rtl-plugin.mjs', false);
```

### Registering it yourself

If you bundle your own worker, import the functions and hand them over without touching any globals:

```js
import {plugin} from 'maplibre-rtl-plugin/plugin';

self.registerRTLTextPlugin(plugin);
```

`applyArabicShaping`, `processBidirectionalText` and `processStyledBidirectionalText` are exported
individually as well, and can be used on their own outside MapLibre.

## What it does

**Arabic shaping.** Arabic is cursive: a letter is drawn differently depending on whether the letters
beside it reach out to touch it. MapLibre asks for one glyph at a time by code point, so the shape
has to be chosen up front and named by the Presentation Forms-B code point that stands for it. The
joining types, the presentation forms and the lam-alef ligatures are generated from the Unicode
character database into [`src/arabic_data.g.ts`](src/arabic_data.g.ts).

**Bidirectional text.** [`bidi-js`](https://github.com/lojjic/bidi-js) supplies the embedding levels
of the Unicode Bidirectional Algorithm, and this package applies rules L1 and L2 per line on top of
them, mirrors brackets in right-to-left runs, and drops the control characters that steer the
algorithm without being drawn.

Reordering happens one code point at a time, as ICU does it, which leaves the combining marks of a
right-to-left run before the letter they belong to. That is deliberate: MapLibre puts them back
itself once it has the line.

## How closely it matches the reference

`npm run test:conformance` downloads `@mapbox/mapbox-gl-rtl-text@0.2.3`, runs it in a sandbox, and
compares both implementations over 50,000 generated labels. Shaping and reordering are identical on
every one of them.

Four differences are known, and each is a deliberate choice rather than an accident:

**The reference loses one section per right-to-left run.** In
`processStyledBidirectionalText`, the first character of every right-to-left run comes back carrying
its neighbour's section instead of its own. For `'ab שלום'` with one section per character, the
sections should be `[0, 1, 2, 6, 5, 4, 3]`; the reference returns `[0, 1, 2, 6, 5, 4, 4]`. This
package returns the correct order, so a `format` expression that styles part of a right-to-left
label no longer mis-styles a character of it.

**The reference drops labels containing U+200F.** Its
`processStyledBidirectionalText` returns an empty array for text with a right-to-left mark in it,
which loses the label. This package returns the line.

**The reference keeps bidi controls in styled text.** Its plain path strips
them and its styled path does not. This package strips them in both, and also strips U+061C ARABIC
LETTER MARK, which the reference leaves in.

**Unicode has moved on since the reference was built.** It carries the
character database as of Unicode 9; this package generates its tables from Unicode 17. The visible
difference is U+0649: it joined only backwards in Unicode 9 and joins on both sides as of Unicode
11, which is what lets Uighur and Kazakh write it mid-word. Arabic only ever writes it at the end of
a word, where both readings agree. Transparency is also taken from the current database, so a letter
joins across any combining mark rather than only across the Arabic vowel points ICU knew about.

## Two things worth knowing about MapLibre itself

Neither is caused by this plugin, and both are worth fixing upstream.

- `is-supported-script` reads the plugin's *status*, not whether an implementation is registered.
  Loading through `importScriptInWorkers` never sets that status, so the expression reports Arabic
  and Hebrew as unsupported even though they render correctly. Layout itself is unaffected: it
  checks for the registered functions.
- Nothing reloads tiles that were parsed before the plugin arrived, because no `RTLPluginLoaded`
  event is fired on this path. Await the import before the map starts loading, as above.

## Developing

```sh
npm install
npm test                  # unit tests
npm run test:conformance  # differential test against the reference plugin, needs network access
npm run lint
npm run typecheck
npm run build             # dist/*.mjs, dist/*.js and the type declarations
npm start                 # the manual check in debug/, against a real map
```

`npm run generate-arabic-data` regenerates the Unicode tables. The result is committed so that
neither the build nor the tests need network access, and CI checks the committed copy is current.

## Releasing

Publishing runs from [`.github/workflows/release.yml`](.github/workflows/release.yml) on a `v*` tag,
using npm trusted publishing: the package is signed with a short-lived OIDC token from the workflow
run, so no npm token is stored in the repository. Before the first release, add this repository and
the `release.yml` workflow as a trusted publisher on the package's npm settings page.

## Licence

MIT
