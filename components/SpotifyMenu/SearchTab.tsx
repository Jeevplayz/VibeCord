/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { classes } from "@utils/misc";
import { React, TextInput, useState } from "@webpack/common";

import { SearchTrack, SimplePlaylist, SpotifyStore } from "../../SpotifyStore";
import { LoadingMessage, PlaylistGrid, StatusMessage, TrackRow } from "./rows";

interface SearchResults {
    tracks: SearchTrack[];
    playlists: SimplePlaylist[];
}

const EMPTY: SearchResults = { tracks: [], playlists: [] };

function useSpotifySearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResults>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = async () => {
        const value = query.trim();

        if (!value) {
            setResults(EMPTY);
            setSearched(false);
            return;
        }

        setLoading(true);
        setSearched(true);
        setError(null);

        try {
            setResults(await SpotifyStore.search(value));
        } catch (e: any) {
            console.error("[VibeCord] Spotify search failed:", e);
            setResults(EMPTY);
            setError(e?.message || "Spotify search failed.");
        } finally {
            setLoading(false);
        }
    };

    return { query, setQuery, results, loading, searched, error, search };
}

export function SearchTab({ onOpenPlaylist }: { onOpenPlaylist: (playlist: SimplePlaylist) => void; }) {
    const s = useSpotifySearch();
    const isEmpty = s.results.tracks.length === 0 && s.results.playlists.length === 0;

    return (
        <>
            <div className="vc-spotify-search-bar">
                <div className="vc-spotify-search-bar-icon">⌕</div>

                <div className="vc-spotify-search-bar-input">
                    <TextInput
                        autoFocus
                        value={s.query}
                        placeholder="Search songs and playlists"
                        onChange={s.setQuery}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === "Enter") s.search();
                        }}
                    />
                </div>

                {s.query && (
                    <button type="button" className="vc-spotify-search-bar-clear" onClick={() => s.setQuery("")}>×</button>
                )}

                <div className="vc-spotify-search-bar-divider" />

                <button
                    type="button"
                    className={classes("vc-spotify-search-submit", s.loading && "is-loading")}
                    onClick={s.search}
                    disabled={s.loading}
                >
                    {s.loading ? "Searching..." : "Search"}
                </button>
            </div>

            <div className="vc-spotify-search-results-list">
                {s.loading && <LoadingMessage label="Searching Spotify..." />}

                {s.error && <div className="vc-spotify-search-error">{s.error}</div>}

                {!s.searched && !s.loading && <StatusMessage>Search for a song, artist or playlist</StatusMessage>}

                {s.searched && !s.loading && !s.error && isEmpty && <StatusMessage>No results found.</StatusMessage>}

                {!s.loading && s.results.playlists.length > 0 && (
                    <>
                        <div className="vc-spotify-menu-section-title">Playlists</div>
                        <PlaylistGrid playlists={s.results.playlists} onOpen={onOpenPlaylist} />
                    </>
                )}

                {!s.loading && s.results.tracks.length > 0 && (
                    <>
                        <div className="vc-spotify-menu-section-title">Songs</div>
                        {s.results.tracks.map(track => <TrackRow key={track.id} track={track} />)}
                    </>
                )}
            </div>
        </>
    );
}
