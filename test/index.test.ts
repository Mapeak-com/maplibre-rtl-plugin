import { afterEach, describe, expect, test, vi } from 'vitest';
import type { RTLTextPlugin } from '../src/types.ts';

/** Loads the entry point afresh, so that its one-off registration runs again for each test. */
async function importEntryPoint(): Promise<void> {
    vi.resetModules();
    await import('../src/index.ts');
}

afterEach(() => {
    delete (globalThis as { registerRTLTextPlugin?: unknown }).registerRTLTextPlugin;
});

describe('the package entry point', () => {
    test('hands MapLibre the three functions it asks a plugin for', async () => {
        let registered: RTLTextPlugin;
        (globalThis as { registerRTLTextPlugin?: unknown }).registerRTLTextPlugin =
            (plugin: RTLTextPlugin) => { registered = plugin; };

        await importEntryPoint();

        expect(typeof registered.applyArabicShaping).toBe('function');
        expect(typeof registered.processBidirectionalText).toBe('function');
        expect(typeof registered.processStyledBidirectionalText).toBe('function');
    });

    test('says where it was meant to be loaded when it is loaded somewhere else', async () => {
        await expect(importEntryPoint()).rejects.toThrow(/MapLibre worker/);
    });
});

describe('the plugin export', () => {
    test('can be registered by hand, without the entry point touching any globals', async () => {
        const { plugin } = await import('../src/plugin.ts');

        expect(plugin.applyArabicShaping('مرحبا')).toBe('ﻣﺮﺣﺒﺎ');
        expect(plugin.processBidirectionalText('שלום', [])).toEqual(['םולש']);
    });
});
