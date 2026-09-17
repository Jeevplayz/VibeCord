/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { classNameFactory } from "@api/Styles";

const cl = classNameFactory("vc-spotify-");

/** Builds a button-icon SVG component from a single path and a11y label.
 *  The viewBox is tightened to the glyph bounds (the raw paths only occupy the
 *  middle ~12/24 units) so the icon actually fills the button box. */
function iconFromPath(path: string, label: string) {
    return () => (
        <svg
            className={cl("button-icon", label)}
            viewBox="4.5 4.5 15 15"
            fill="currentColor"
            aria-label={label}
            focusable={false}
        >
            <path d={path} />
        </svg>
    );
}

export const PlayButton = iconFromPath(
    "M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z",
    "play"
);

export const PauseButton = iconFromPath(
    "M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z",
    "pause"
);

export const SkipPrev = iconFromPath(
    "M7 6c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1zm3.66 6.82l5.77 4.07c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07c-.57.4-.57 1.24 0 1.64z",
    "previous"
);

export const SkipNext = iconFromPath(
    "M17 6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1zm-3.66 6.82l-5.77 4.07c-.66.47-1.58-.01-1.58-.82V7.93c0-.81.91-1.28 1.58-.82l5.77 4.07c.57.4.57 1.24 0 1.64z",
    "next"
);

export const VolumeMuted = iconFromPath(
    "M9.25 8.687 6.999 6.437 4.75 8.687v6.626h2.25l4.5 4.5V4.187l-2.25 2.25v2.25ZM19.28 8.22l-1.06-1.06-2.22 2.22-2.22-2.22-1.06 1.06 2.22 2.22-2.22 2.22 1.06 1.06L16 11.5l2.22 2.22 1.06-1.06L17.06 10.44l2.22-2.22Z",
    "volume-muted"
);

export const VolumeLow = iconFromPath(
    "M9.25 8.687 6.999 6.437 4.75 8.687v6.626h2.25l4.5 4.5V4.187l-2.25 2.25v2.25ZM15.5 9.5v5c1.24-.62 2-1.86 2-2.5s-.76-1.88-2-2.5Z",
    "volume-low"
);

export const VolumeHigh = iconFromPath(
    "M9.25 8.687 6.999 6.437 4.75 8.687v6.626h2.25l4.5 4.5V4.187l-2.25 2.25v2.25ZM15.5 8v8c1.87-.93 3-2.7 3-4s-1.13-3.07-3-4Zm0-3.02c3.05 1.15 5 3.7 5 7.02s-1.95 5.87-5 7.02v-2.13c1.85-1.03 3-2.83 3-4.89s-1.15-3.86-3-4.89V4.98Z",
    "volume-high"
);
