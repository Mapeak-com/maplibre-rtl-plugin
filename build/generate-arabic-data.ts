/**
 * Regenerates `src/arabic_data.g.ts` from the Unicode Character Database.
 *
 * Run with `npm run generate-arabic-data` whenever the pinned UCD version moves. The generated
 * file is committed so that neither the build nor the tests need network access.
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

/** The UCD release the committed tables were generated from. */
const UCD_VERSION = '17.0.0';
const UCD_BASE = `https://www.unicode.org/Public/${UCD_VERSION}/ucd`;

type JoiningType = 'R' | 'L' | 'D' | 'C' | 'U' | 'T';

async function fetchLines(file: string): Promise<string[]> {
    const response = await fetch(`${UCD_BASE}/${file}`);
    if (!response.ok) {
        throw new Error(`Failed to download ${file}: ${response.status} ${response.statusText}`);
    }
    return (await response.text()).split('\n');
}

/**
 * The joining type of every character the UCD lists one for.
 *
 * Characters the file leaves out default to non-joining, except the combining marks and format
 * characters, which are transparent: they sit between two letters without stopping them joining, so
 * a vowel point must not break the word it is written on.
 */
async function readJoiningTypes(): Promise<Map<number, JoiningType>> {
    const joiningTypes = new Map<number, JoiningType>();

    for (const line of await fetchLines('UnicodeData.txt')) {
        const fields = line.split(';');
        if (fields.length < 3) continue;
        const category = fields[2];
        if (category === 'Mn' || category === 'Me' || category === 'Cf') {
            joiningTypes.set(parseInt(fields[0], 16), 'T');
        }
    }

    for (const line of await fetchLines('ArabicShaping.txt')) {
        const fields = line.split('#')[0].split(';');
        if (fields.length < 3) continue;
        joiningTypes.set(parseInt(fields[0], 16), fields[2].trim() as JoiningType);
    }

    return joiningTypes;
}

/**
 * The characters a vowel point is written over when it is shown on its own.
 *
 * A mark has no shape without a letter under it, so the database gives its presentation forms as
 * decompositions onto a carrier: tatweel, the stroke a word is stretched along, for the shape drawn
 * over a joined letter, and a space for the shape drawn by itself.
 */
const CARRIERS = new Set([0x0020, 0x0640]);

/** One presentation form of a letter, as the four shapes a cursive script writes it in. */
type Forms = {isolated: number; final: number; initial: number; medial: number};

/**
 * The Presentation Forms-B shape of each letter, and the two shapes of each lam-alef ligature.
 *
 * These are read out of the compatibility decompositions of the presentation block rather than
 * hard-coded, so `<final> 0628` is what tells us U+FE90 is the final form of beh.
 *
 * Only lam-alef is taken from the two-character decompositions. It is the one ligature Arabic
 * shaping is required to form; the rest of the presentation block holds typographic ligatures a
 * font offers rather than ones the text is obliged to use.
 */
async function readPresentationForms(): Promise<{
    forms: Map<number, Forms>;
    ligatures: Map<string, {isolated: number; final: number}>;
}> {
    const forms = new Map<number, Forms>();
    const ligatures = new Map<string, {isolated: number; final: number}>();

    for (const line of await fetchLines('UnicodeData.txt')) {
        const fields = line.split(';');
        if (fields.length < 6) continue;

        const codePoint = parseInt(fields[0], 16);
        if (codePoint < 0xfb50 || codePoint > 0xfeff) continue;

        const match = /^<(isolated|final|initial|medial)>\s+(.+)$/.exec(fields[5]);
        if (!match) continue;

        const shape = match[1] as keyof Forms;
        const bases = match[2].trim().split(/\s+/).map(hex => parseInt(hex, 16));

        const carried = bases.length === 2 && CARRIERS.has(bases[0]);
        const base = carried ? bases[1] : bases[0];

        if (bases.length === 1 || carried) {
            const existing = forms.get(base) ?? { isolated: 0, final: 0, initial: 0, medial: 0 };
            existing[shape] = codePoint;
            forms.set(base, existing);
        } else if (bases.length === 2 && codePoint >= 0xfef5 && codePoint <= 0xfefc) {
            const key = String.fromCodePoint(...bases);
            const existing = ligatures.get(key) ?? { isolated: 0, final: 0 };
            existing[shape] = codePoint;
            ligatures.set(key, existing);
        }
    }

    return { forms, ligatures };
}

/**
 * Packs a sorted list of code points into `start,length` pairs.
 *
 * The properties this file carries run in long unbroken stretches, so the ranges are an order of
 * magnitude smaller than the code points they stand for.
 */
function toRanges(codePoints: number[]): number[][] {
    const ranges: number[][] = [];
    for (const codePoint of codePoints.sort((a, b) => a - b)) {
        const last = ranges[ranges.length - 1];
        if (last && last[0] + last[1] === codePoint) {
            last[1]++;
        } else {
            ranges.push([codePoint, 1]);
        }
    }
    return ranges;
}

/** Renders the ranges as a string of deltas, which is a third of the size the numbers print as. */
function encodeRanges(ranges: number[][]): string {
    let previousEnd = 0;
    return ranges
        .map(([start, length]) => {
            const encoded = `${(start - previousEnd).toString(36)},${length.toString(36)}`;
            previousEnd = start + length;
            return encoded;
        })
        .join(';');
}

async function main(): Promise<void> {
    const joiningTypes = await readJoiningTypes();
    const { forms, ligatures } = await readPresentationForms();

    const byType = new Map<JoiningType, number[]>();
    for (const [codePoint, type] of joiningTypes) {
        if (type === 'U') continue;
        byType.set(type, (byType.get(type) ?? []).concat(codePoint));
    }

    const encodedTypes = [...byType]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([type, codePoints]) => `    ${type}: '${encodeRanges(toRanges(codePoints))}',`)
        .join('\n');

    const encodedForms = [...forms]
        .sort(([a], [b]) => a - b)
        .map(([base, { isolated, final, initial, medial }]) =>
            `    ${base}: [${isolated}, ${final}, ${initial}, ${medial}],`)
        .join('\n');

    const encodedLigatures = [...ligatures]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([pair, { isolated, final }]) => {
            const escaped = [...pair].map(c => `\\u${c.codePointAt(0).toString(16).padStart(4, '0')}`).join('');
            return `    '${escaped}': [${isolated}, ${final}],`;
        })
        .join('\n');

    const contents = `// Generated by build/generate-arabic-data.ts from the Unicode ${UCD_VERSION} character database. Do not edit.

/** Joining types, as \`start,length\` range pairs delta-encoded in base 36. Anything absent is non-joining. */
export const ENCODED_JOINING_TYPES: Record<string, string> = {
${encodedTypes}
};

/** Each letter's Presentation Forms-B code points, as \`[isolated, final, initial, medial]\`. Absent shapes are 0. */
export const PRESENTATION_FORMS: Record<number, [number, number, number, number]> = {
${encodedForms}
};

/** The lam-alef ligatures, keyed by the pair they replace, as \`[isolated, final]\`. */
export const LIGATURES: Record<string, [number, number]> = {
${encodedLigatures}
};
`;

    const target = join(import.meta.dirname, '..', 'src', 'arabic_data.g.ts');
    writeFileSync(target, contents);
    console.log(`Wrote ${target}: ${byType.get('T').length} transparent, ${forms.size} letters, ${ligatures.size} ligatures.`);
}

main();
