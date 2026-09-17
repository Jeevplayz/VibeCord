/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { classNameFactory } from "@api/Styles";
import { debounce } from "@shared/debounce";
import { useEffect, useState, useStateFromStores } from "@webpack/common";

import { msToHuman } from "../lib/format";
import { SeekBar } from "../SeekBar";
import { settings } from "../settings";
import { SpotifyStore, Track } from "../SpotifyStore";

const cl = classNameFactory("vc-spotify-");

/** Plain "elapsed / total" text, shown when the seek bar setting is off. */
function PlainTimeRow({ position, duration }: { position: number; duration: number; }) {
    return (
        <div id={cl("time-row")} aria-live="polite" style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span className={cl("time-text")}>{msToHuman(position)}</span>
            <span className={cl("time-sep")}>/</span>
            <span className={cl("time-text")}>{msToHuman(duration)}</span>
        </div>
    );
}

/** Draggable seek bar flanked by elapsed / total time, shown when the seek bar setting is on. */
function SeekTimeRow({ position, duration, onPositionChange }: {
    position: number;
    duration: number;
    onPositionChange: (v: number) => void;
}) {
    return (
        <div id={cl("time-row")} className={cl("seek-row")} aria-live="polite">
            <span className={cl("time-text")}>{msToHuman(position)}</span>

            <div className={cl("slider-wrap")}>
                <SeekBar
                    className={cl("progress-slider")}
                    minValue={0}
                    maxValue={duration || 1}
                    initialValue={position}
                    asValueChanges={debounce(onPositionChange)}
                    onValueChange={debounce((v: number) => SpotifyStore.seek(v))}
                    onValueRender={msToHuman}
                />
            </div>

            <span className={cl("time-text")}>{msToHuman(duration)}</span>
        </div>
    );
}

export function ProgressRow({ track }: { track: Track; }) {
    const [position, setPosition] = useState(SpotifyStore.position ?? 0);
    const isPlaying = useStateFromStores([SpotifyStore], () => SpotifyStore.isPlaying);
    const { showSeekBar } = settings.use(["showSeekBar"]);

    // Poll the store's live position once a second so the displayed time
    // stays in sync while a track is playing.
    useEffect(() => {
        setPosition(SpotifyStore.position ?? 0);
        const id = setInterval(() => setPosition(SpotifyStore.position ?? 0), 1000);
        return () => clearInterval(id);
    }, [track?.id, isPlaying]);

    const duration = track.duration ?? 0;

    return showSeekBar
        ? <SeekTimeRow position={position} duration={duration} onPositionChange={setPosition} />
        : <PlainTimeRow position={position} duration={duration} />;
}
