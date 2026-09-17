/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { Player } from "./PlayerComponent";
import { useStateFromStores } from "@webpack/common";
import { SpotifyStore } from "./SpotifyStore";
import { settings } from "./settings";

// renders nothing (not even an empty div) when there's no active playback,
// so we don't leave a gap above the account panel
function PlayerWrapper() {
    const track = useStateFromStores([SpotifyStore], () => SpotifyStore.track);
    const device = useStateFromStores([SpotifyStore], () => SpotifyStore.device);

    // Hide player completely when nothing playing
    if (!track || !device?.is_active) return null;

    return (
        <div id="vc-spotify-player">
            <Player />
        </div>
    );
}

export default definePlugin({
    name: "VibeCord",
    description: "Adds a Spotify player above the account panel",
    authors: [{ name: "JellyBean", id: 714707216879583242n }],

    settings,

    patches: [
        // Wrap the account panel (identified by its "userTag / occluded" props)
        // so our player renders above it via PanelWrapper.
        {
            find: /userTag:\w+,occluded:/,
            replacement: {
                match: /(?<=\i\.jsxs?\)\()(\i),{(?=[^}]*?userTag:\i,occluded:)/,
                replace: "$self.PanelWrapper,{VencordOriginal:$1,"
            }
        },

        // Give the internal Spotify API module a `post` method (it only ships
        // `get` by default) and mark it so SpotifyStore can find it via
        // findByPropsLazy("vcSpotifyMarker"). Also disable Discord's own
        // "202 Accepted" short-circuit so our POST requests await a real result.
        {
            find: ".PLAYER_DEVICES",
            replacement: [
                {
                    match: /get:(\i)\.bind\(null,(\i\.\i)\.get\)/,
                    replace: "post:$1.bind(null,$2.post),vcSpotifyMarker:1,$&"
                },
                {
                    match: /202===\i\.status/,
                    replace: "false"
                }
            ]
        },

        // The player state event Discord dispatches doesn't include shuffle
        // state or the raw repeat mode, and filters out the current track's
        // own artist from search results. Patch both back in.
        {
            find: 'repeat:"off"!==',
            replacement: [
                {
                    match: /repeat:"off"!==(\i),/,
                    replace: "shuffle:arguments[2]?.shuffle_state??false,actual_repeat:$1,$&"
                },
                {
                    match: /(?<=artists\.filter\(\i=>).{0,20}\i\.id\)&&/,
                    replace: ""
                }
            ]
        }
    ],

    start() {
        console.log("[VibeCord] plugin loaded");
    },

    stop() {
        console.log("[VibeCord] plugin stopped");
    },

    PanelWrapper({ VencordOriginal, ...props }) {
        try {
            return (
                <>
                    <ErrorBoundary
                        fallback={() => (
                            <div id="vc-spotify-player">
                                <p>Failed to render Spotify player</p>
                                <p>Check console for errors</p>
                            </div>
                        )}
                    >
                        <PlayerWrapper />
                    </ErrorBoundary>

                    <VencordOriginal {...props} />
                </>
            );
        } catch (err) {
            console.error("[VibeCord] PanelWrapper crash:", err);
            return <VencordOriginal {...props} />;
        }
    }
});