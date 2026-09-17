/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { TextInput, useState } from "@webpack/common";

import { SimplePlaylist, SpotifyStore } from "../../SpotifyStore";
import { useAsyncResource } from "./hooks";
import { LoadingMessage, PlaylistGrid, StatusMessage } from "./rows";

/** Loads Liked Songs and the user's playlists together, with Liked Songs pinned first. */
async function loadLibrary(): Promise<SimplePlaylist[]> {
    const [liked, playlists] = await Promise.all([
        SpotifyStore.getLikedSongsPlaylist(),
        SpotifyStore.getMyPlaylists()
    ]);

    return liked ? [liked, ...playlists] : playlists;
}

export function LibraryTab({ onOpenPlaylist }: { onOpenPlaylist: (playlist: SimplePlaylist) => void; }) {
    const [filter, setFilter] = useState("");
    const library = useAsyncResource<SimplePlaylist[]>(loadLibrary, [], [], "Failed to load your playlists:");

    const needle = filter.trim().toLowerCase();
    const visible = needle
        ? library.data.filter(playlist => playlist.name.toLowerCase().includes(needle))
        : library.data;

    return (
        <>
            <div className="vc-spotify-menu-toolbar">
                <div className="vc-spotify-menu-filter">
                    <TextInput value={filter} placeholder="Filter your playlists" onChange={setFilter} />
                </div>

                <button type="button" className="vc-spotify-menu-refresh" onClick={library.reload} title="Refresh">⟳</button>
            </div>

            {/* Spotify's API blocks third-party apps from reading Daily Mix / Discover Weekly / Release Radar since Nov 2024, so they just won't show up here no matter what */}
            <div className="vc-spotify-menu-hint">
                Daily Mix, Discover Weekly and Release Radar can't appear here — Spotify blocks third-party
                apps from accessing those personalized playlists since a November 2024 policy change.
            </div>

            <div className="vc-spotify-search-results-list">
                {library.loading && <LoadingMessage label="Loading your library..." />}

                {library.error && <div className="vc-spotify-search-error">{library.error}</div>}

                {!library.loading && !library.error && visible.length === 0 && (
                    <StatusMessage>
                        {library.data.length === 0 ? "No playlists in your library yet." : "No playlists match that filter."}
                    </StatusMessage>
                )}

                {!library.loading && visible.length > 0 && <PlaylistGrid playlists={visible} onOpen={onOpenPlaylist} />}
            </div>
        </>
    );
}
