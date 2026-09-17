/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { classNameFactory } from "@api/Styles";
import { Paragraph } from "@components/Paragraph";
import { ContextMenuApi, React } from "@webpack/common";

import { SpotifyStore, Track } from "../SpotifyStore";
import { AlbumContextMenu, CopyContextMenu } from "./ContextMenus";
import { ProgressRow } from "./ProgressRow";

const cl = classNameFactory("vc-spotify-");

type LinkType = "Song" | "Artist" | "Album";

/**
 * Props that make an element open the given Spotify path on click and show
 * a "copy URL/URI" menu on right-click. Returns an empty object (no-op)
 * when `condition` is falsy, e.g. an artist with no id.
 */
function makeLinkProps(type: LinkType, condition: unknown, path: string): React.HTMLAttributes<HTMLElement> {
    if (!condition) return {};

    return {
        role: "link",
        onClick: () => SpotifyStore.openExternal(path),
        onContextMenu: e =>
            ContextMenuApi.openContextMenu(e, () => <CopyContextMenu type={type} path={path} />)
    };
}

function AlbumArt({ track }: { track: Track; }) {
    const img = track?.album?.image;
    if (!img) return null;

    return (
        <div className={cl("album-wrapper")}>
            <div
                className={cl("album-surface")}
                onContextMenu={e => ContextMenuApi.openContextMenu(e, () => <AlbumContextMenu track={track} />)}
                tabIndex={-1}
            >
                <img id={cl("album-image")} src={img.url} alt="Album Image" draggable={false} />
            </div>
        </div>
    );
}

function ArtistList({ track }: { track: Track; }) {
    if (!track.artists.some(a => a.name)) return null;

    return (
        <Paragraph className={cl(["ellipoverflow", "secondary-song-info"])}>
            <span className={cl("song-info-prefix")}>by&nbsp;</span>

            {track.artists.map((artist, i) => (
                <React.Fragment key={artist.name}>
                    <span
                        className={cl("artist")}
                        style={{ fontSize: 12 }}
                        title={artist.name}
                        {...makeLinkProps("Artist", artist.id, `/artist/${artist.id}`)}
                    >
                        {artist.name}
                    </span>

                    {i !== track.artists.length - 1 && <span className={cl("comma")}>{", "}</span>}
                </React.Fragment>
            ))}
        </Paragraph>
    );
}

export function Info({ track }: { track: Track; }) {
    return (
        <div id={cl("info-wrapper")}>
            <AlbumArt track={track} />

            <div id={cl("titles")}>
                <Paragraph
                    weight="semibold"
                    id={cl("song-title")}
                    className={cl("ellipoverflow")}
                    title={track.name}
                    {...makeLinkProps("Song", track.id, `/track/${track.id}`)}
                >
                    {track.name}
                </Paragraph>

                <ArtistList track={track} />

                <ProgressRow track={track} />
            </div>
        </div>
    );
}
