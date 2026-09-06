import { beforeAll, describe, expect, test } from 'vitest';
import { plugin } from '../../src/plugin.ts';
import { generateLabels, lineBreaksFor } from './corpus.ts';
import { loadReferencePlugin } from './reference.ts';
import type { RTLTextPlugin } from '../../src/types.ts';

const LABEL_COUNT = 50_000;
const SEED = 7;

/**
 * The one letter the reference disagrees about, because the two were built against different
 * releases of the character database.
 *
 * Unicode 9 had U+0649 joining only to the letter before it. It joins on both sides as of Unicode
 * 11, which is what lets Uighur and Kazakh write it mid-word, and what this package follows. Arabic
 * only ever writes it at the end of a word, where both readings agree.
 */
const DOTLESS_YEH = 'ى';

let reference: RTLTextPlugin;

beforeAll(async () => {
    reference = await loadReferencePlugin();
});

describe('against @mapbox/mapbox-gl-rtl-text', () => {
    test('shapes Arabic the same way', () => {
        const differing = generateLabels(LABEL_COUNT, SEED)
            .filter(label => !label.includes(DOTLESS_YEH))
            .filter(label => reference.applyArabicShaping(label) !== plugin.applyArabicShaping(label));

        expect(differing).toEqual([]);
    });

    test('orders and breaks text the same way', () => {
        const differing = generateLabels(LABEL_COUNT, SEED).filter(label => {
            const breaks = lineBreaksFor(label, SEED);
            return JSON.stringify(reference.processBidirectionalText(label, breaks)) !==
                JSON.stringify(plugin.processBidirectionalText(label, breaks));
        });

        expect(differing).toEqual([]);
    });

    test('gives the styled and the plain version of a label the same lines', () => {
        const differing = generateLabels(LABEL_COUNT, SEED).filter(label => {
            const breaks = lineBreaksFor(label, SEED);
            const sections = [...label].flatMap((character, index) => Array(character.length).fill(index));
            const styled = plugin.processStyledBidirectionalText(label, sections, breaks);
            return JSON.stringify(styled.map(([line]) => line)) !==
                JSON.stringify(plugin.processBidirectionalText(label, breaks));
        });

        expect(differing).toEqual([]);
    });

    test('gives every code unit of a styled line a section of its own', () => {
        const ragged = generateLabels(LABEL_COUNT, SEED).filter(label => {
            const sections = [...label].flatMap((character, index) => Array(character.length).fill(index));
            return plugin.processStyledBidirectionalText(label, sections, lineBreaksFor(label, SEED))
                .some(([line, lineSections]) => line.length !== lineSections.length);
        });

        expect(ragged).toEqual([]);
    });

    test('keeps the section of the first letter of a right-to-left run, which the reference loses', () => {
        const text = 'ab שלום';
        const sections = [...text].map((_, index) => index);

        expect(plugin.processStyledBidirectionalText(text, sections, [])).toEqual([['ab םולש', [0, 1, 2, 6, 5, 4, 3]]]);
        expect(reference.processStyledBidirectionalText(text, sections, [])).toEqual([['ab םולש', [0, 1, 2, 6, 5, 4, 4]]]);
    });
});
