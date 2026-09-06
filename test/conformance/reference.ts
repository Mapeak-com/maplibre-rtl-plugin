import vm from 'vm';
import type { RTLTextPlugin } from '../../src/types.ts';

/**
 * The build of the Mapbox plugin this package is measured against.
 *
 * It is pinned so that a conformance run says something repeatable, and it is the asm.js build
 * because that one runs outside a browser.
 */
const REFERENCE_URL = 'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js';

/**
 * Runs the Mapbox plugin in a sandbox and takes the implementation it registers.
 *
 * The plugin expects to be a script on a page, so the sandbox stands in for the handful of browser
 * globals it reaches for on its way to calling `registerRTLTextPlugin`.
 */
export async function loadReferencePlugin(): Promise<RTLTextPlugin> {
    const response = await fetch(REFERENCE_URL);
    if (!response.ok) {
        throw new Error(`Could not download the reference plugin: ${response.status} ${response.statusText}`);
    }

    let registered: RTLTextPlugin | null = null;
    const sandbox: Record<string, unknown> = {
        console,
        setTimeout,
        clearTimeout,
        performance,
        document: { currentScript: null, createElement: () => ({}), getElementsByTagName: () => [] },
        location: { href: 'file:///' },
        navigator: { userAgent: 'node' },
        registerRTLTextPlugin: (plugin: RTLTextPlugin) => { registered = plugin; },
    };
    sandbox.self = sandbox;
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;

    vm.createContext(sandbox);
    vm.runInContext(await response.text(), sandbox);

    if (!registered) {
        throw new Error('The reference plugin did not register itself.');
    }
    return registered;
}
