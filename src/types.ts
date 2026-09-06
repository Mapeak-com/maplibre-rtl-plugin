/**
 * The three functions MapLibre asks a right-to-left text plugin for.
 *
 * This is the interface `@mapbox/mapbox-gl-rtl-text` exposes, reproduced here so that this package
 * is a drop-in replacement for it. MapLibre calls all three on the worker thread while it lays out a
 * label, and indexes every argument and result in UTF-16 code units.
 */
export type RTLTextPlugin = {
    /**
     * Rewrites Arabic letters as the shape they take in the word they sit in.
     *
     * @param text - a run of text in logical order
     * @returns the same text with its Arabic letters replaced by presentation forms
     */
    applyArabicShaping: (text: string) => string;
    /**
     * Puts text into the order it is read on screen, and breaks it into lines.
     *
     * @param text - a whole label in logical order
     * @param lineBreakPoints - the code unit offsets the label is to be broken at
     * @returns one string per line, each in visual order
     */
    processBidirectionalText: (text: string, lineBreakPoints: number[]) => string[];
    /**
     * The same as {@link RTLTextPlugin.processBidirectionalText}, keeping track of which formatting
     * section each code unit came from so that a label built out of several `format` sections keeps
     * its styling once the text has been reordered.
     *
     * @param text - a whole label in logical order
     * @param styleIndices - the section each code unit of `text` belongs to
     * @param lineBreakPoints - the code unit offsets the label is to be broken at
     * @returns one `[line, styleIndices]` pair per line, each in visual order
     */
    processStyledBidirectionalText: (
        text: string,
        styleIndices: number[],
        lineBreakPoints: number[]
    ) => Array<[string, number[]]>;
};
