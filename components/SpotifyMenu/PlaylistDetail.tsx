/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { runWithToast } from "../../lib/asyncAction";
import { SearchTrack, SimplePlaylist, SpotifyStore } from "../../SpotifyStore";
import { useAsyncResource } from "./hooks";
import { LoadingMessage, pickImage, StatusMessage, TrackRow } from "./rows";

export function PlaylistDetail({ playlist, onBack }: { playlist: SimplePlaylist; onBack: () => void; }) {
    const tracks = useAsyncResource<SearchTrack[]>(
        () => SpotifyStore.getPlaylistTracks(playlist.id),
        [],
        [playlist.id],
        "Failed to load playlist tracks:"
    );

    const image = pickImage(playlist.images);

    const playAll = () =>
        runWithToast(
            () => SpotifyStore.playPlaylist(playlist),
            { success: `Playing ${playlist.name}`, failure: "Failed to play playlist" },
            "Failed to play playlist:"
        );

    /** Starting a track inside its playlist keeps the rest of the playlist queued behind it. */
    const playFrom = (track: SearchTrack, index: number) => {
        if (playlist.isLikedSongs) return SpotifyStore.playTracks(tracks.data.map(t => t.uri), index);
        return SpotifyStore.playContext(playlist.uri, track.uri);
    };

    return (
        <>
            <div className="vc-spotify-detail-header">
                <button type="button" className="vc-spotify-menu-back" onClick={onBack} title="Back">‹</button>

                {image ? (
                    <img className="vc-spotify-detail-art" src={image} alt="" draggable={false} />
                ) : (
                    <div className="vc-spotify-detail-art vc-spotify-playlist-art-placeholder">
                        {playlist.isLikedSongs ? "♥" : "♪"}
                    </div>
                )}

                <div className="vc-spotify-detail-info">
                    <div className="vc-spotify-detail-name" title={playlist.name}>{playlist.name}</div>

                    <div className="vc-spotify-detail-meta">
                        {[
                            playlist.owner?.display_name && `By ${playlist.owner.display_name}`,
                            playlist.tracks?.total != null && `${playlist.tracks.total} tracks`
                        ].filter(Boolean).join(" · ")}
                    </div>
                </div>

                <button type="button" className="vc-spotify-detail-play" onClick={playAll}>
                    <span style={{ marginRight: 6 }}>▶</span>Play
                </button>
            </div>

            <div className="vc-spotify-search-results-list">
                {tracks.loading && <LoadingMessage label="Loading tracks..." />}

                {tracks.error && <div className="vc-spotify-search-error">{tracks.error}</div>}

                {!tracks.loading && !tracks.error && tracks.data.length === 0 && (
                    <StatusMessage>This playlist has no playable tracks.</StatusMessage>
                )}

                {!tracks.loading && tracks.data.map((track, index) => (
                    <TrackRow
                        key={`${track.id}-${index}`}
                        track={track}
                        onPlay={() => playFrom(track, index)}
                    />
                ))}
            </div>
        </>
    );
}
