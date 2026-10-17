/**
 * How each size relates to the recommended one, in the words Nicole's design
 * prints under the size buttons: two or more steps below the recommendation
 * "Tight", one below "Snug", the recommendation itself "Best fit", one above
 * "Relaxed", two or more above "Oversized". Read off the piece's own size run,
 * so it holds for XS–XL and for 00–16 alike. Nothing is said until a
 * recommendation exists (a fit profile answered, or a virtual twin with a size).
 */
export type FitTone = 'tight' | 'snug' | 'best' | 'relaxed' | 'over';

export interface FitStep {
    label: string;
    tone: FitTone;
}

export const fitStepFor = (
    sizes: readonly string[],
    size: string,
    recommended: string
): FitStep | null => {
    const at = sizes.indexOf(size);
    const base = sizes.indexOf(recommended);
    if (at === -1 || base === -1) return null;
    const offset = at - base;
    if (offset <= -2) return { label: 'Tight', tone: 'tight' };
    if (offset === -1) return { label: 'Snug', tone: 'snug' };
    if (offset === 0) return { label: 'Best fit', tone: 'best' };
    if (offset === 1) return { label: 'Relaxed', tone: 'relaxed' };
    return { label: 'Oversized', tone: 'over' };
};

const ONE_SIZE_LABEL = /^(os|one[\s-]?size|o\/s)$/i;

/**
 * A one-size piece ("OS" in the catalog) has no run to size against: no
 * recommendation is asked for, no size is withheld, and the fit profile says
 * so rather than pretending. Judged by the label, not the count: a sized piece
 * with a single size left in stock is still sized, and still gets its fit copy.
 */
export const isOneSize = (sizes: readonly string[]): boolean =>
    sizes.length > 0 && sizes.every((s) => ONE_SIZE_LABEL.test(s.trim()));

/** The catalog's "OS" reads as "One size" on the page; other labels pass through. */
export const sizeLabel = (size: string): string =>
    ONE_SIZE_LABEL.test(size.trim()) ? 'One size' : size;

/**
 * US women's alpha sizes and the numeric pair each covers, ready-to-wear
 * convention (XS is 0 to 2, S is 4 to 6, and so on).
 */
const ALPHA_TO_NUMERIC: Record<string, string[]> = {
    XXS: ['00'],
    XS: ['0', '2'],
    S: ['4', '6'],
    M: ['8', '10'],
    L: ['12', '14'],
    XL: ['16', '18'],
    XXL: ['20', '22'],
};

const isNumeric = (size: string) => /^\d+$/.test(size.trim());
const norm = (size: string) => size.trim().toUpperCase();

/**
 * The size of this run that a twin's library size means. The library records
 * an alpha size (Yuna is XS); a pair of trousers is offered in numbers, so XS
 * has to read as 2 there. Returns the size itself when the run offers it, the
 * translated size when the run is in the other system and offers it, and null
 * when neither is the case.
 */
export const translateSize = (size: string, sizes: readonly string[]): string | null => {
    const wanted = norm(size);
    const exact = sizes.find((s) => norm(s) === wanted);
    if (exact) return exact;
    const runIsNumeric = sizes.length > 0 && sizes.every(isNumeric);
    if (runIsNumeric && ALPHA_TO_NUMERIC[wanted]) {
        // The larger of the pair when both are offered: a size that reads
        // roomy is a better first guess than one that reads tight.
        const pair = [...ALPHA_TO_NUMERIC[wanted]].reverse();
        for (const n of pair) {
            const offered = sizes.find((s) => norm(s) === n);
            if (offered) return offered;
        }
        return null;
    }
    const runIsAlpha = sizes.length > 0 && sizes.every((s) => !isNumeric(s));
    if (runIsAlpha && isNumeric(wanted)) {
        const alpha = Object.keys(ALPHA_TO_NUMERIC).find((a) =>
            ALPHA_TO_NUMERIC[a].includes(wanted)
        );
        return alpha ? (sizes.find((s) => norm(s) === alpha) ?? null) : null;
    }
    return null;
};

/** The alpha ladder the sized try-on grades on, in the service's own spelling. */
const TRY_ON_LADDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const;
const LADDER_SPELLINGS: Record<string, string> = { XXL: '2XL', XXXL: '3XL' };

/** A whole-number size the sized try-on grades: 00, or one or two digits. */
const isGradableNumber = (size: string) => size === '00' || /^[1-9]?\d$/.test(size);

/**
 * The rung of the try-on ladder a size stands on, or null when it has none.
 * The sized try-on grades on two ladders: alpha (XS to 3XL) and whole numbers
 * (US women's 00 to 24, men's waist inches). XXS, one-size and waist-by-inseam
 * labels have no rung.
 */
export const ladderSize = (size: string): string | null => {
    const wanted = norm(size);
    if (isNumeric(wanted)) return isGradableNumber(wanted) ? wanted : null;
    const rung = LADDER_SPELLINGS[wanted] ?? wanted;
    return (TRY_ON_LADDER as readonly string[]).includes(rung) ? rung : null;
};

/**
 * What to ask the sized try-on for when `selected` is chosen against
 * `recommended`: the two rungs, or null when the pair cannot be graded —
 * either size off both ladders, one a letter and the other a number, or both
 * on one rung — in which case the piece is shown at its recommended size.
 */
export const gradedPair = (
    selected: string,
    recommended: string
): { size: string; baseSize: string } | null => {
    const size = ladderSize(selected);
    const baseSize = ladderSize(recommended);
    if (!size || !baseSize || size === baseSize) return null;
    if (isNumeric(size) !== isNumeric(baseSize)) return null;
    return { size, baseSize };
};
