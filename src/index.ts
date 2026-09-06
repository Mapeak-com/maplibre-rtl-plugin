import { plugin } from './plugin.ts';
import type { WorkerGlobalScopeInterface } from 'maplibre-gl';

const workerScope = globalThis as unknown as WorkerGlobalScopeInterface;

if (typeof workerScope.registerRTLTextPlugin === 'function') {
    workerScope.registerRTLTextPlugin(plugin);
} else {
    throw new Error(
        'maplibre-rtl-plugin must be loaded into a MapLibre worker, where `registerRTLTextPlugin` is ' +
        'defined. Load it with `importScriptInWorkers(url)` or `setRTLTextPlugin(url)`, and import ' +
        '`maplibre-rtl-plugin/plugin` instead if you mean to register it yourself.'
    );
}

export { plugin, applyArabicShaping, processBidirectionalText, processStyledBidirectionalText } from './plugin.ts';
export type { RTLTextPlugin } from './types.ts';
