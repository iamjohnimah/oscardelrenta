/**
 * Render and photo URLs are presigned object-store links that expire (about
 * thirty minutes on dev). They are cached across visits, so before one is
 * shown its signature is checked and, when stale, a fresh link is fetched
 * from the request or image it came from.
 */
const SAFETY_MS = 60 * 1000;

const parseAmzDate = (value: string): number | null => {
    const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value);
    if (!match) return null;
    const [, y, mo, d, h, mi, s] = match;
    return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
};

/** True when the URL is presigned and its window has (nearly) closed. */
export const isPresignedUrlExpired = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        const date = parsed.searchParams.get('X-Amz-Date');
        const expires = parsed.searchParams.get('X-Amz-Expires');
        if (!date || !expires) return false;
        const issued = parseAmzDate(date);
        if (issued === null) return false;
        return Date.now() > issued + Number(expires) * 1000 - SAFETY_MS;
    } catch {
        return false;
    }
};
