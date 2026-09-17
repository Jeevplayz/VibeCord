/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { Button } from "@components/Button";
import { classes } from "@utils/misc";
import { ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { TextInput, useState } from "@webpack/common";

import { SimplePlaylist, SpotifyProfile, SpotifyStore } from "../../SpotifyStore";
import { useAsyncResource, useSpotifyConnection } from "./hooks";
import { LibraryTab } from "./LibraryTab";
import { LyricsTab } from "./LyricsTab";
import { MenuPlayerBar } from "./MenuPlayerBar";
import { PlaylistDetail } from "./PlaylistDetail";
import { pickImage } from "./rows";
import { SearchTab } from "./SearchTab";

export function openSpotifyMenu() {
    openModal(props => <SpotifyMenuModal {...props} />);
}

type TabId = "library" | "search" | "lyrics";

const TABS: { id: TabId; label: string; }[] = [
    { id: "library", label: "Your Playlists" },
    { id: "search", label: "Search" },
    { id: "lyrics", label: "Lyrics" }
];

function SpotifyLogo() {
    return (
        <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
            <path
                fill="#07150c"
                d="M12 1.8A10.2 10.2 0 1 0 12 22.2 10.2 10.2 0 0 0 12 1.8Zm4.68 14.69a.72.72 0 0 1-.99.24c-2.72-1.66-6.15-2.04-10.19-1.11a.72.72 0 1 1-.32-1.4c4.42-1.01 8.2-.57 11.26 1.3.34.21.45.66.24.97Zm1.33-2.96a.9.9 0 0 1-1.23.3c-3.12-1.92-7.88-2.48-11.58-1.36a.9.9 0 1 1-.52-1.72c4.22-1.28 9.47-.66 13.05 1.54.42.26.55.81.28 1.24Zm.12-3.08C14.39 8.1 8.23 7.9 4.66 8.98a1.08 1.08 0 0 1-.63-2.07c4.1-1.25 10.94-.99 15.07 1.47a1.08 1.08 0 0 1-.97 2.07Z"
            />
        </svg>
    );
}

/** The header avatar: the connected user's Spotify profile picture once loaded, else the Spotify glyph. */
function HeaderAvatar({ avatarUrl }: { avatarUrl?: string; }) {
    return (
        <div className="vc-spotify-search-logo">
            {avatarUrl ? (
                <img className="vc-spotify-menu-avatar-img" src={avatarUrl} alt="" draggable={false} />
            ) : (
                <SpotifyLogo />
            )}
        </div>
    );
}

/** Shown until the user has authorized Spotify (or when their token predates the playlist scopes). */
function ConnectPanel({ conn }: { conn: ReturnType<typeof useSpotifyConnection>; }) {
    return (
        <div className="vc-spotify-search-connect">
            <div className="vc-spotify-search-connect-heading">
                {conn.needsReauth ? "Reconnect your Spotify account" : "Connect your Spotify account"}
            </div>

            <div className="vc-spotify-search-connect-desc">
                {conn.needsReauth
                    ? "This version needs extra permissions to read your playlists. Reconnect to grant them."
                    : "Connect Spotify to browse your playlists, see Spotify's own playlists, and search for music."}
            </div>

            <Button onClick={conn.connect} disabled={conn.connecting || !conn.clientId}>
                {conn.connecting ? "Opening Spotify..." : conn.needsReauth ? "Reconnect Spotify" : "Connect Spotify"}
            </Button>

            <div className="vc-spotify-search-callback-input">
                <TextInput
                    value={conn.callbackUrl}
                    placeholder="Paste Spotify callback URL"
                    onChange={conn.setCallbackUrl}
                />
            </div>

            <div className="vc-spotify-search-callback-actions">
                <Button onClick={conn.complete} disabled={conn.connecting || !conn.callbackUrl.trim()}>
                    Complete Connection
                </Button>
            </div>
        </div>
    );
}

function SpotifyMenuModal({ transitionState, onClose }: ModalProps) {
    const conn = useSpotifyConnection();
    const [tab, setTab] = useState<TabId>("library");

    const profile = useAsyncResource<SpotifyProfile | null>(
        () => SpotifyStore.getMe(),
        null,
        [conn.connected],
        "Failed to load Spotify profile:",
        conn.connected
    );

    const avatarUrl = conn.connected ? pickImage(profile.data?.images) : undefined;
    const displayName = conn.connected && profile.data?.display_name ? profile.data.display_name : "Spotify";

    // When set, the detail view replaces the tab content until the user goes back.
    const [openPlaylist, setOpenPlaylist] = useState<SimplePlaylist | null>(null);

    const selectTab = (id: TabId) => {
        setOpenPlaylist(null);
        setTab(id);
    };

    const disconnect = async () => {
        await conn.disconnect();
        setOpenPlaylist(null);
        setTab("library");
    };

    return (
        <ModalRoot transitionState={transitionState} size={ModalSize.MEDIUM} aria-label="Spotify">
            <div className="vc-spotify-search-modal vc-spotify-menu-modal">
                <div className="vc-spotify-search-header">
                    <HeaderAvatar avatarUrl={avatarUrl} />

                    <div className="vc-spotify-search-title-block">
                        <div className="vc-spotify-search-title">{displayName}</div>
                        <div className="vc-spotify-search-subtitle">Your soundtrack, without leaving Discord</div>
                    </div>

                    <button type="button" className="vc-spotify-search-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="vc-spotify-search-body">
                    {!conn.connected ? (
                        <ConnectPanel conn={conn} />
                    ) : (
                        <>
                            <div className="vc-spotify-menu-tabs" role="tablist">
                                {TABS.map(({ id, label }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        role="tab"
                                        aria-selected={tab === id}
                                        className={classes("vc-spotify-menu-tab", tab === id && "is-active")}
                                        onClick={() => selectTab(id)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {openPlaylist ? (
                                <PlaylistDetail playlist={openPlaylist} onBack={() => setOpenPlaylist(null)} />
                            ) : (
                                <>
                                    {tab === "library" && <LibraryTab onOpenPlaylist={setOpenPlaylist} />}
                                    {tab === "search" && <SearchTab onOpenPlaylist={setOpenPlaylist} />}
                                    {tab === "lyrics" && <LyricsTab />}
                                </>
                            )}
                        </>
                    )}

                    {conn.error && <div className="vc-spotify-search-error">{conn.error}</div>}
                </div>

                {conn.connected && <MenuPlayerBar />}

                <div className="vc-spotify-search-footer">
                    {conn.connected ? (
                        <div className="vc-spotify-search-connected">
                            <span className="vc-spotify-search-connected-dot" />
                            Connected to Spotify

                            <button type="button" className="vc-spotify-search-disconnect" onClick={disconnect}>
                                ⟳&nbsp; Disconnect
                            </button>
                        </div>
                    ) : <div />}

                    <button type="button" className="vc-spotify-search-footer-close" onClick={onClose}>Close</button>
                </div>
            </div>
        </ModalRoot>
    );
}
