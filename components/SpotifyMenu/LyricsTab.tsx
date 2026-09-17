/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { classNameFactory } from "@api/Styles";
import { classes } from "@utils/misc";
import { React, useEffect, useState, useStateFromStores } from "@webpack/common";

import { fetchLyrics, LyricsLine, LyricsResult } from "../../lib/lyrics";
import { SpotifyStore } from "../../SpotifyStore";
import { useAsyncResource } from "./hooks";
import { LoadingMessage, StatusMessage } from "./rows";

const cl = classNameFactory("vc-spotify-");

const EMPTY_LYRICS: LyricsResult = { synced: null, plain: null, instrumental: false };

/** Polls the store's extrapolated playback position while synced lyrics are shown, to drive line highlighting. */
function useLivePosition(enabled: boolean): number {
    const [position, setPosition] = useState(SpotifyStore.position ?? 0);

    useEffect(() => {
        if (!enabled) return;

        setPosition(SpotifyStore.position ?? 0);
        const id = setInterval(() => setPosition(SpotifyStore.position ?? 0), 250);
        return () => clearInterval(id);
    }, [enabled]);

    return position;
}

/** Index of the last line whose timestamp has passed, i.e. the line that should be highlighted right now. */
function findActiveIndex(lines: LyricsLine[] | null, position: number): number {
    if (!lines?.length) return -1;

    let index = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].time > position) break;
        index = i;
    }
    return index;
}

export function LyricsTab() {
    const track = useStateFromStores([SpotifyStore], () => SpotifyStore.track);
    const isPlaying = useStateFromStores([SpotifyStore], () => SpotifyStore.isPlaying);

    const lyrics = useAsyncResource<LyricsResult>(
        () => (track ? fetchLyrics(track) : Promise.resolve(EMPTY_LYRICS)),
        EMPTY_LYRICS,
        [track?.id, track?.name],
        "Failed to load lyrics:",
        Boolean(track)
    );

    const hasSynced = Boolean(lyrics.data.synced?.length);
    const position = useLivePosition(hasSynced);
    const activeIndex = findActiveIndex(lyrics.data.synced, position);

    const activeLineRef = React.useRef<HTMLDivElement | null>(null);

    // Keep the current line centered as playback advances.
    useEffect(() => {
        activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, [activeIndex]);

    if (!track) {
        return <StatusMessage>Play something on Spotify to see its lyrics.</StatusMessage>;
    }

    const artistNames = track.artists.map((a: any) => a.name).join(", ");

    return (
        <div className={cl("lyrics-tab")}>
            <div className={cl("lyrics-track")}>
                <div className={cl("lyrics-track-name")} title={track.name}>{track.name}</div>
                {artistNames && <div className={cl("lyrics-track-artist")}>{artistNames}</div>}
            </div>

            <div className={cl("lyrics-body")}>
                {lyrics.loading && <LoadingMessage label="Loading lyrics..." />}

                {!lyrics.loading && lyrics.error && (
                    <div className="vc-spotify-search-error">{lyrics.error}</div>
                )}

                {!lyrics.loading && !lyrics.error && lyrics.data.instrumental && (
                    <StatusMessage>This track is instrumental — no lyrics to show.</StatusMessage>
                )}

                {!lyrics.loading && !lyrics.error && !lyrics.data.instrumental
                    && !lyrics.data.synced && !lyrics.data.plain && (
                    <StatusMessage>No lyrics found for this track.</StatusMessage>
                )}

                {!lyrics.loading && lyrics.data.synced && (
                    <div className={cl("lyrics-synced")}>
                        {lyrics.data.synced.map((line, i) => (
                            <div
                                key={i}
                                ref={i === activeIndex ? activeLineRef : undefined}
                                className={classes(cl("lyrics-line"), i === activeIndex && "is-active")}
                            >
                                {line.text || "♪"}
                            </div>
                        ))}
                    </div>
                )}

                {!lyrics.loading && !lyrics.data.synced && lyrics.data.plain && (
                    <div className={cl("lyrics-plain")}>
                        {lyrics.data.plain.split("\n").map((line, i) => (
                            <div key={i} className={cl("lyrics-plain-line")}>{line || "\u00A0"}</div>
                        ))}
                    </div>
                )}
            </div>

            {hasSynced && !isPlaying && (
                <div className={cl("lyrics-paused-hint")}>Playback is paused — lyrics won't advance.</div>
            )}
        </div>
    );
}
