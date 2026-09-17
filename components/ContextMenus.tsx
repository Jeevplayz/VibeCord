/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { CopyIcon, ImageIcon, LinkIcon, OpenExternalIcon } from "@components/Icons";
import { debounce } from "@shared/debounce";
import { copyWithToast, openImageModal } from "@utils/discord";
import { FluxDispatcher, Menu, useStateFromStores } from "@webpack/common";

import { SpotifyStore, Track } from "../SpotifyStore";
import { openSpotifyMenu } from "./SpotifyMenu";

function closeContextMenu() {
    FluxDispatcher.dispatch({ type: "CONTEXT_MENU_CLOSE" });
}

/** Right-click menu on the album art: open album, view cover, open the Spotify menu, adjust volume. */
export function AlbumContextMenu({ track }: { track: Track; }) {
    const volume = useStateFromStores([SpotifyStore], () => SpotifyStore.volume);

    return (
        <Menu.Menu navId="spotify-album-menu" onClose={closeContextMenu} aria-label="Spotify Album Menu">
            <Menu.MenuItem
                key="open-album"
                id="open-album"
                label="Open Album"
                action={() => SpotifyStore.openExternal(`/album/${track.album.id}`)}
                icon={OpenExternalIcon}
            />

            <Menu.MenuItem
                key="view-cover"
                id="view-cover"
                label="View Album Cover"
                action={() => openImageModal(track.album.image)}
                icon={ImageIcon}
            />

            <Menu.MenuItem key="spotify-menu" id="spotify-menu" label="Open Spotify Menu" action={openSpotifyMenu} />

            <Menu.MenuControlItem
                id="spotify-volume"
                key="spotify-volume"
                label="Volume"
                control={(props, ref) => (
                    <Menu.MenuSliderControl
                        {...props}
                        ref={ref}
                        value={volume}
                        minValue={0}
                        maxValue={100}
                        onChange={debounce((v: number) => SpotifyStore.setVolume(v))}
                    />
                )}
            />
        </Menu.Menu>
    );
}

/** Right-click menu on the song title / artist name: copy Spotify URL or URI. */
export function CopyContextMenu({ type, path }: { type: string; path: string; }) {
    return (
        <Menu.Menu onClose={closeContextMenu}>
            <Menu.MenuItem
                key="copy-url"
                id="copy-url"
                label={`Copy ${type} URL`}
                action={() => copyWithToast(SpotifyStore.getExternalUrl(path))}
                icon={LinkIcon}
            />

            <Menu.MenuItem
                key="copy-uri"
                id="copy-uri"
                label={`Copy ${type} URI`}
                action={() => copyWithToast(`spotify:${type.toLowerCase()}:${path.split("/").pop()}`)}
                icon={CopyIcon}
            />
        </Menu.Menu>
    );
}
