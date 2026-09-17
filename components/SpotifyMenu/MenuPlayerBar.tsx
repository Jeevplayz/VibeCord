/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { classNameFactory } from "@api/Styles";
import { debounce } from "@shared/debounce";
import { React, useEffect, useState, useStateFromStores } from "@webpack/common";

import { msToHuman } from "../../lib/format";
import { SeekBar } from "../../SeekBar";
import { SpotifyStore } from "../../SpotifyStore";
import { Controls } from "../Controls";
import { VolumeHigh, VolumeLow, VolumeMuted } from "../icons";

const cl = classNameFactory("vc-spotify-");

/** Track equality that also matches locally-played files, which may share an id but not a name (or vice versa). */
function isSameTrack(prev: any, next: any) {
    return prev?.id ? prev.id === next?.id : prev?.name === next?.name;
}

/** Icon + slider volume control, with a click-to-mute toggle that remembers the last non-zero level. */
function VolumeControl() {
    const volume = useStateFromStores([SpotifyStore], () => SpotifyStore.volume);
    const lastVolume = React.useRef(volume || 50);

    useEffect(() => {
        if (volume > 0) lastVolume.current = volume;
    }, [volume]);

    const setVolume = debounce((v: number) => SpotifyStore.setVolume(v));

    const toggleMute = () => {
        if (volume > 0) setVolume(0);
        else setVolume(lastVolume.current || 50);
    };

    const Icon = volume === 0 ? VolumeMuted : volume < 50 ? VolumeLow : VolumeHigh;

    return (
        <div className={cl("menu-player-volume")}>
            <button
                className={cl("button", "menu-player-volume-btn")}
                onClick={toggleMute}
                aria-label={volume === 0 ? "Unmute" : "Mute"}
                title={volume === 0 ? "Unmute" : "Mute"}
            >
                <Icon />
            </button>

            <div className={cl("menu-player-volume-slider-wrap")}>
                <SeekBar
                    className={cl("progress-slider")}
                    minValue={0}
                    maxValue={100}
                    initialValue={volume}
                    asValueChanges={setVolume}
                    onValueRender={(v: number) => `${Math.round(v)}%`}
                />
            </div>
        </div>
    );
}

/**
 * A compact "now playing" bar pinned to the bottom of the Spotify menu, so the user can
 * scrub, skip and pause without leaving the modal. Mirrors PlayerComponent/ProgressRow's
 * behaviour but in a layout that fits a single footer row instead of the small player.
 */
export function MenuPlayerBar() {
    const track = useStateFromStores([SpotifyStore], () => SpotifyStore.track, null, isSameTrack);
    const device = useStateFromStores([SpotifyStore], () => SpotifyStore.device);
    const isPlaying = useStateFromStores([SpotifyStore], () => SpotifyStore.isPlaying);

    const [position, setPosition] = useState(SpotifyStore.position ?? 0);

    // Poll the store's live position once a second so the seek bar stays in sync while playing,
    // the same approach ProgressRow uses for the small player.
    useEffect(() => {
        setPosition(SpotifyStore.position ?? 0);
        const id = setInterval(() => setPosition(SpotifyStore.position ?? 0), 1000);
        return () => clearInterval(id);
    }, [track?.id, isPlaying]);

    if (!track || !device?.is_active) return null;

    const duration = track.duration ?? 0;
    const image = track.album?.image?.url;
    const artistNames = (track.artists ?? []).map((a: any) => a.name).join(", ");

    return (
        <div className={cl("menu-player")}>
            <div className={cl("menu-player-track")}>
                {image ? (
                    <img className={cl("menu-player-art")} src={image} alt="" draggable={false} />
                ) : (
                    <div className={cl("menu-player-art", "menu-player-art-placeholder")}>♪</div>
                )}

                <div className={cl("menu-player-info")}>
                    <div className={cl("menu-player-title")} title={track.name}>{track.name}</div>
                    {artistNames && (
                        <div className={cl("menu-player-artist")} title={artistNames}>{artistNames}</div>
                    )}
                </div>
            </div>

            <div className={cl("menu-player-main")}>
                <Controls />

                <div className={cl("menu-player-seek")}>
                    <span className={cl("time-text")}>{msToHuman(position)}</span>

                    <div className={cl("menu-player-slider-wrap")}>
                        <SeekBar
                            className={cl("progress-slider")}
                            minValue={0}
                            maxValue={duration || 1}
                            initialValue={position}
                            asValueChanges={debounce(setPosition)}
                            onValueChange={debounce((v: number) => SpotifyStore.seek(v))}
                            onValueRender={msToHuman}
                        />
                    </div>

                    <span className={cl("time-text")}>{msToHuman(duration)}</span>
                </div>

                <VolumeControl />
            </div>
        </div>
    );
}
