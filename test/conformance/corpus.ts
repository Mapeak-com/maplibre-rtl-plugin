/** A repeatable pseudo-random source, so a conformance run tests the same corpus every time. */
function makeRandom(seed: number): () => number {
    let state = seed;
    return function next(): number {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
    };
}

const SCRIPTS: Record<string, string[]> = {
    arabic: [...'ابتثجحخدذرزسشصضطظعغفقكلمنهيأإآءةؤئ'],
    persian: [...'پچژگک'],
    hebrew: [...'אבגדהוזחטיכךלמםנןסעפףצץקרשת'],
    latin: [...'abcdefghijklmnopqrstuvwxyz'],
    digits: [...'0123456789٠١٢٣٤٥٦٧٨٩'],
};

const TASHKEEL = [...'ًٌٍَُِّْ'];
const HEBREW_POINTS = [...'ְֱֲֳִֵֶַָֹֻּׁׂ'];
const PUNCTUATION = [...' .,:;!?()[]"\'-/'];

/**
 * The scripts a word may be written in, weighted towards Arabic because that is the script the
 * shaping half of the plugin has anything to do.
 */
const WORD_SCRIPTS = ['arabic', 'arabic', 'arabic', 'persian', 'hebrew', 'latin', 'digits'];

/**
 * Labels that look like the ones a map draws: words in one script apiece, vowel points written on
 * the script they belong to, and no bidi control characters.
 *
 * Text is generated rather than listed so that the corpus reaches further than a handful of
 * hand-picked strings, and seeded so that a failure can be reproduced.
 */
export function generateLabels(count: number, seed: number): string[] {
    const random = makeRandom(seed);
    const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];

    function word(): string {
        const script = pick(WORD_SCRIPTS);
        const letters = SCRIPTS[script];
        let text = '';
        for (let i = 0, length = 1 + Math.floor(random() * 8); i < length; i++) {
            text += pick(letters);
            if (script === 'arabic' && random() < 0.25) text += pick(TASHKEEL);
            if (script === 'hebrew' && random() < 0.25) text += pick(HEBREW_POINTS);
        }
        return text;
    }

    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
        let label = word();
        for (let j = 0, words = Math.floor(random() * 5); j < words; j++) {
            label += pick(PUNCTUATION) + word();
        }
        labels.push(label);
    }
    return labels;
}

/** Where a label is broken, chosen from the same seeded source so the whole corpus is repeatable. */
export function lineBreaksFor(label: string, seed: number): number[] {
    const random = makeRandom(seed + label.length);
    return random() < 0.4 ? [1 + Math.floor(random() * Math.max(1, label.length - 1))] : [];
}
