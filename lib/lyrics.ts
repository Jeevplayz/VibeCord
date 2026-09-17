/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

const LRCLIB_ROOT = "https://lrclib.net/api";

export interface LyricsLine {
    /** Line start time, in milliseconds. */
    time: number;
    text: string;
}

export interface LyricsResult {
    /** Time-synced lines, or null if lrclib only has (or found) plain lyrics. */
    synced: LyricsLine[] | null;
    /** Plain, unsynced lyrics text, or null if none is available. */
    plain: string | null;
    /** True when lrclib reports this track as instrumental (no lyrics to show). */
    instrumental: boolean;
}

/** The subset of SpotifyStore's Track shape that lrclib needs to identify a song. */
export interface LookupTrack {
    name: string;
    duration: number;
    album?: { name: string; };
    artists: { name: string; }[];
}

const EMPTY_RESULT: LyricsResult = { synced: null, plain: null, instrumental: false };

/** Parses an LRC-format lyrics blob (`[mm:ss.xx]text` per line) into sorted, timestamped lines. */
function parseLRC(lrc: string): LyricsLine[] {
    const timeTag = /\[(\d{2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    const lines: LyricsLine[] = [];

    for (const raw of lrc.split("\n")) {
        const matches = [...raw.matchAll(timeTag)];
        if (!matches.length) continue;

        const text = raw.replace(timeTag, "").trim();

        for (const match of matches) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const fraction = (match[3] ?? "0").padEnd(3, "0").slice(0, 3);

            lines.push({ time: (minutes * 60 + seconds) * 1000 + parseInt(fraction, 10), text });
        }
    }

    return lines.sort((a, b) => a.time - b.time);
}

function toResult(data: any): LyricsResult {
    if (!data) return EMPTY_RESULT;
    if (data.instrumental) return { synced: null, plain: null, instrumental: true };

    return {
        synced: data.syncedLyrics ? parseLRC(data.syncedLyrics) : null,
        plain: data.plainLyrics || null,
        instrumental: false
    };
}

/**
 * Tries an exact lookup for one candidate artist. lrclib's `/get` endpoint matches
 * artist_name, track_name, album_name and duration together, so it only succeeds
 * when the artist we send is the one lrclib has the track credited under.
 */
async function getExactFor(track: LookupTrack, artistName: string): Promise<LyricsResult | null> {
    const params = new URLSearchParams({
        artist_name: artistName,
        track_name: track.name,
        album_name: track.album?.name ?? "",
        duration: String(Math.round((track.duration ?? 0) / 1000))
    });

    const response = await fetch(`${LRCLIB_ROOT}/get?${params.toString()}`);

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Lyrics request failed (${response.status})`);

    return toResult(await response.json());
}

/** True when a search result's credited artist plausibly matches one of the track's artists. */
function artistsOverlap(resultArtist: string | undefined, artistNames: string[]): boolean {
    const needle = (resultArtist ?? "").toLowerCase();
    if (!needle) return false;

    return artistNames.some(name => {
        const haystack = name.toLowerCase();
        return needle.includes(haystack) || haystack.includes(needle);
    });
}

/** Picks the best `/search` hit: prefer one whose artist overlaps ours, then the closest duration. */
function pickBestMatch(results: any[], artistNames: string[], durationSec: number): any | null {
    const candidates = (results ?? []).filter(Boolean);
    if (!candidates.length) return null;

    const scored = candidates.map(r => ({
        r,
        artistMatch: artistsOverlap(r.artistName, artistNames),
        durationDiff: Math.abs((r.duration ?? 0) - durationSec)
    }));

    scored.sort((a, b) =>
        a.artistMatch !== b.artistMatch ? (a.artistMatch ? -1 : 1) : a.durationDiff - b.durationDiff
    );

    const best = scored[0];
    // no artist match and durations way off -> probably a different song with the same title
    if (!best.artistMatch && best.durationDiff > 3) return null;

    return best.r;
}

async function searchFor(track: LookupTrack, artistName: string | undefined): Promise<any[]> {
    const params = new URLSearchParams({ track_name: track.name });
    if (artistName) params.set("artist_name", artistName);

    const response = await fetch(`${LRCLIB_ROOT}/search?${params.toString()}`);
    if (!response.ok) return [];

    return response.json();
}

/**
 * Falls back to lrclib's fuzzy search when the exact lookup finds nothing. Spotify's
 * artists[0] isn't always who lrclib credits the track to (composer vs vocalist, feature
 * order, etc), so we try each credited artist in turn before giving up and searching by
 * title alone.
 */
async function searchClosest(track: LookupTrack): Promise<LyricsResult> {
    const artistNames = track.artists.map(a => a.name).filter(Boolean);
    const durationSec = Math.round((track.duration ?? 0) / 1000);

    for (const artistName of artistNames) {
        const results = await searchFor(track, artistName);
        const best = pickBestMatch(results, artistNames, durationSec);
        if (best) return toResult(best);
    }

    const results = await searchFor(track, undefined);
    const best = pickBestMatch(results, artistNames, durationSec);
    return best ? toResult(best) : EMPTY_RESULT;
}

/** Fetches lyrics for a track, preferring an exact match and falling back to fuzzy search. */
export async function fetchLyrics(track: LookupTrack): Promise<LyricsResult> {
    if (!track?.name || !track.artists?.length) return EMPTY_RESULT;

    for (const artist of track.artists) {
        const exact = await getExactFor(track, artist.name);
        if (exact) return exact;
    }

    return searchClosest(track);
}
