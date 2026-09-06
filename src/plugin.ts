import { applyArabicShaping } from './arabic.ts';
import { processBidirectionalText, processStyledBidirectionalText } from './bidi.ts';
import type { RTLTextPlugin } from './types.ts';

/**
 * The plugin, as an object rather than as a side effect on the worker's globals.
 *
 * Importing this instead of the package entry point gives the three functions on their own, which is
 * what the tests and anything embedding the plugin in its own worker bundle want.
 */
export const plugin: RTLTextPlugin = {
    applyArabicShaping,
    processBidirectionalText,
    processStyledBidirectionalText,
};

export { applyArabicShaping, processBidirectionalText, processStyledBidirectionalText };
export type { RTLTextPlugin } from './types.ts';
