/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import "./spotifyStyles.css";

import { classNameFactory } from "@api/Styles";
import { React, useState, useStateFromStores } from "@webpack/common";

import { Controls } from "./components/Controls";
import { Info } from "./components/TrackInfo";
import { settings } from "./settings";
import { SpotifyStore } from "./SpotifyStore";

const cl = classNameFactory("vc-spotify-");

/** Track equality that also matches locally-played files, which may share an id but not a name (or vice versa). */
function isSameTrack(prev: any, next: any) {
    return prev?.id ? prev.id === next?.id : prev?.name === next?.name;
}

function isSameDevice(prev: any, next: any) {
    return prev?.id === next?.id;
}

/** How long to keep the player mounted after playback stops, before hiding it. */
const HIDE_AFTER_IDLE_MS = 5 * 60 * 1000;

export function Player() {
    const track = useStateFromStores([SpotifyStore], () => SpotifyStore.track, null, isSameTrack);
    const device = useStateFromStores([SpotifyStore], () => SpotifyStore.device, null, isSameDevice);
    const isPlaying = useStateFromStores([SpotifyStore], () => SpotifyStore.isPlaying);

    const [shouldHide, setShouldHide] = useState(false);

    const { fontFamily, fontSize, albumSize, accentColor, backgroundColor } = settings.use([
        "fontFamily",
        "fontSize",
        "albumSize",
        "accentColor",
        "backgroundColor"
    ]);

    // Keep the player visible while playing; once paused, fade it out after
    // a grace period rather than disappearing instantly.
    React.useEffect(() => {
        setShouldHide(false);
        if (isPlaying) return;

        const timeout = setTimeout(() => setShouldHide(true), HIDE_AFTER_IDLE_MS);
        return () => clearTimeout(timeout);
    }, [isPlaying]);

    if (!track || !device?.is_active || shouldHide) return null;

    const themeStyle = {
        "--vc-spotify-track-image": `url(${track?.album?.image?.url || ""})`,
        "--vc-spotify-accent": accentColor,
        "--vc-spotify-bg": backgroundColor,
        "--vc-spotify-font": fontFamily,
        "--vc-spotify-font-size": `${fontSize}px`,
        "--vc-spotify-album-size": `${albumSize}px`
        // Text/icon color is intentionally NOT set here. It's left to
        // spotifyStyles.css, which derives --vc-spotify-text /
        // --vc-spotify-secondary-text from --vc-spotify-fg / -fg-muted
        // (black on light themes, white on dark themes). Setting it here
        // as an inline style would always win over that CSS rule.
    } as React.CSSProperties;

    return (
        <div id={cl("player")} style={themeStyle}>
            <Info track={track} />
            <Controls />
        </div>
    );
}
