/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

/**
 * Accepts hex, rgb()/rgba(), a CSS var() reference (so a Discord theme variable like
 * var(--text-normal) can be used to track the active Discord theme), or "transparent";
 * otherwise returns an error string for the settings UI.
 */
const hexOrNamed = (v: string) =>
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ||
    v === "transparent" ||
    v.startsWith("rgba(") ||
    v.startsWith("rgb(") ||
    v.startsWith("var(") ||
    "Enter a valid hex color (e.g. #1ed760), rgb()/rgba(), var(--discord-variable), or \"transparent\"";

export const settings = definePluginSettings({
    spotifyClientId: {
        type: OptionType.STRING,
        description:
            "Spotify Developer Client ID. Do not enter a Client Secret.",
        default: ""
    },

    spotifyAccessToken: {
        type: OptionType.STRING,
        description: "",
        default: "",
        hidden: true
    },

    spotifyRefreshToken: {
        type: OptionType.STRING,
        description: "",
        default: "",
        hidden: true
    },

    spotifyTokenExpiresAt: {
        type: OptionType.NUMBER,
        description: "",
        default: 0,
        hidden: true
    },

    spotifyScopeVersion: {
        type: OptionType.NUMBER,
        description: "",
        default: 0,
        hidden: true
    },

    spotifyCodeVerifier: {
        type: OptionType.STRING,
        description: "",
        default: "",
        hidden: true
    },

    spotifyOAuthState: {
        type: OptionType.STRING,
        description: "",
        default: "",
        hidden: true
    },

    useSpotifyUris: {
        type: OptionType.BOOLEAN,
        description:
            "Open Spotify URIs instead of Spotify URLs. Requires Spotify installed.",
        default: false
    },

    previousButtonRestartsTrack: {
        type: OptionType.BOOLEAN,
        description:
            "Restart currently playing track when pressing previous if playtime >3s",
        default: true
    },

    showSeekBar: {
        type: OptionType.BOOLEAN,
        description:
            "Show a draggable seek bar to scrub through the track. Turn off to go back to plain elapsed / total time text.",
        default: true
    },

    autoplayFallback: {
        type: OptionType.BOOLEAN,
        description:
            "If a track finishes and playback just stops (queue/context empty, Spotify's own Autoplay off), " +
            "automatically start a random track from your Liked Songs instead of leaving it stopped.",
        default: true
    },

    fontFamily: {
        type: OptionType.SELECT,
        description: "Font used for the player's text",
        options: [
            {
                label: "Discord Default",
                value: "inherit",
                default: true
            },
            {
                label: "Sans Serif",
                value: "'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif"
            },
            {
                label: "Serif",
                value: "Georgia, 'Times New Roman', serif"
            },
            {
                label: "Monospace",
                value: "'Consolas', 'Courier New', monospace"
            },
            {
                label: "Rounded",
                value: "'Varela Round', 'Segoe UI Rounded', sans-serif"
            }
        ]
    },

    fontSize: {
        type: OptionType.SLIDER,
        description:
            "Base font size (px) for the song title, artist and time",
        markers: [11, 12, 13, 14, 15, 16, 17, 18],
        default: 13,
        stickToMarkers: true
    },

    albumSize: {
        type: OptionType.SLIDER,
        description: "Album art size (px)",
        markers: [30, 34, 38, 42, 46, 50, 54, 58],
        default: 42,
        stickToMarkers: true
    },

    accentColor: {
        type: OptionType.STRING,
        description:
            "Accent color, used for the seek bar fill (defaults to Discord's brand color)",
        default: "var(--brand-experiment, #5865f2)",
        isValid: hexOrNamed
    },

    backgroundColor: {
        type: OptionType.STRING,
        description:
            "Player background color (hex, rgba(), var(--discord-variable), or \"transparent\")",
        default: "transparent",
        isValid: hexOrNamed
    }
});