/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { React } from "@webpack/common";

import { runWithToast } from "../../lib/asyncAction";
import { SearchTrack, SimplePlaylist, SpotifyStore } from "../../SpotifyStore";

/** Picks the smallest image that's still big enough to look sharp at thumbnail size. */
export function pickImage(images: { url: string; width?: number; }[] | undefined): string | undefined {
    if (!images?.length) return undefined;

    const sorted = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
    return (sorted.find(image => (image.width ?? 0) >= 120) ?? sorted[sorted.length - 1])?.url;
}

export function StatusMessage({ children }: { children: React.ReactNode; }) {
    return <div className="vc-spotify-search-status">{children}</div>;
}

export function LoadingMessage({ label }: { label: string; }) {
    return (
        <div className="vc-spotify-search-status">
            <span className="vc-spotify-search-spinner" />
            {label}
        </div>
    );
}

/** A single track row with play / queue actions. Used by search results and playlist detail alike. */
export function TrackRow({ track, onPlay }: { track: SearchTrack; onPlay?: () => Promise<any>; }) {
    const image = pickImage(track.album?.images);
    const artistNames = (track.artists ?? []).map(a => a.name).join(", ");

    const play = () =>
        runWithToast(
            () => (onPlay ? onPlay() : SpotifyStore.playTrack(track.uri)),
            { success: `Playing ${track.name}`, failure: "Failed to play track" },
            "Failed to play track:"
        );

    const queue = () =>
        runWithToast(
            () => SpotifyStore.queueTrack(track.uri),
            { success: `Added ${track.name} to queue`, failure: "Failed to add track to queue" },
            "Failed to queue track:"
        );

    return (
        <div className="vc-spotify-search-result">
            {image ? (
                <img className="vc-spotify-search-result-art" src={image} alt="" width={50} height={50} draggable={false} />
            ) : (
                <div className="vc-spotify-search-result-art-placeholder">♪</div>
            )}

            <div className="vc-spotify-search-result-info">
                <div className="vc-spotify-search-result-title" title={track.name}>{track.name}</div>
                <div className="vc-spotify-search-result-artists" title={artistNames}>{artistNames}</div>
            </div>

            <div className="vc-spotify-search-result-actions">
                <button type="button" className="vc-spotify-search-result-play" onClick={play}>
                    <span style={{ marginRight: 5 }}>▶</span>Play
                </button>

                <button type="button" className="vc-spotify-search-result-queue" onClick={queue}>
                    <span style={{ marginRight: 5, fontSize: 16 }}>+</span>Queue
                </button>
            </div>
        </div>
    );
}

/** A playlist tile: click to open its track list, or hit the play badge to start it straight away. */
export function PlaylistCard({ playlist, onOpen }: { playlist: SimplePlaylist; onOpen: () => void; }) {
    const image = pickImage(playlist.images);
    const total = playlist.tracks?.total;

    const subtitle = playlist.isLikedSongs
        ? `${total ?? 0} saved songs`
        : [playlist.owner?.display_name && `By ${playlist.owner.display_name}`, total != null && `${total} tracks`]
            .filter(Boolean)
            .join(" · ");

    const play = (e: React.MouseEvent) => {
        e.stopPropagation();

        runWithToast(
            () => SpotifyStore.playPlaylist(playlist),
            { success: `Playing ${playlist.name}`, failure: "Failed to play playlist" },
            "Failed to play playlist:"
        );
    };

    return (
        <div
            className="vc-spotify-playlist-card"
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") onOpen();
            }}
        >
            <div className="vc-spotify-playlist-art-wrap">
                {image ? (
                    <img className="vc-spotify-playlist-art" src={image} alt="" draggable={false} />
                ) : (
                    <div className={`vc-spotify-playlist-art vc-spotify-playlist-art-placeholder${playlist.isLikedSongs ? " is-liked" : ""}`}>
                        {playlist.isLikedSongs ? "♥" : "♪"}
                    </div>
                )}

                <button type="button" className="vc-spotify-playlist-play" title={`Play ${playlist.name}`} onClick={play}>▶</button>
            </div>

            <div className="vc-spotify-playlist-name" title={playlist.name}>{playlist.name}</div>
            <div className="vc-spotify-playlist-meta" title={subtitle}>{subtitle}</div>
        </div>
    );
}

export function PlaylistGrid({ playlists, onOpen }: { playlists: SimplePlaylist[]; onOpen: (playlist: SimplePlaylist) => void; }) {
    return (
        <div className="vc-spotify-playlist-grid">
            {playlists.map(playlist => (
                <PlaylistCard key={playlist.id} playlist={playlist} onOpen={() => onOpen(playlist)} />
            ))}
        </div>
    );
}
