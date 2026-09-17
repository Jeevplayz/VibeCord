/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { isPluginEnabled } from "@api/PluginManager";
import { Settings } from "@api/Settings";
import OpenInAppPlugin from "@plugins/openInApp";
import { findByProps, findByPropsLazy, proxyLazyWebpack } from "@webpack";
import { Flux, FluxDispatcher } from "@webpack/common";

import { SpotifyAuth } from "./SpotifyAuth";

export interface Track {
    id: string;
    name: string;
    duration: number;
    isLocal: boolean;

    album: {
        id: string;
        name: string;
        image: { height: number; width: number; url: string; };
    };

    artists: { id: string; href: string; name: string; type: string; uri: string; }[];
}

export interface SearchTrack {
    id: string;
    name: string;
    uri: string;

    artists: { id: string; name: string; }[];

    album: {
        id: string;
        name: string;
        images: { height: number; width: number; url: string; }[];
    };
}

export interface SimplePlaylist {
    id: string;
    name: string;
    uri: string;
    description?: string;
    images: { url: string; height?: number; width?: number; }[];
    owner: { id: string; display_name?: string; };
    tracks?: { total: number; };

    /** Set by the store for pseudo-playlists (Liked Songs) that aren't real Spotify playlists. */
    isLikedSongs?: boolean;
}

export interface SpotifyProfile {
    id: string;
    display_name: string | null;
    images: { url: string; height?: number; width?: number; }[];
}

interface PlayerState {
    accountId: string;
    track: Track | null;
    volumePercent: number;
    isPlaying: boolean;
    repeat: boolean;
    position: number;
    context?: any;
    device?: Device;
    actual_repeat: Repeat;
    shuffle: boolean;
}

interface Device {
    id: string;
    is_active: boolean;
}

type Repeat = "off" | "track" | "context";

/** Id used for the Liked Songs pseudo-playlist, which has no real playlist id. */
export const LIKED_SONGS_ID = "__liked_songs__";



export const SpotifyStore = proxyLazyWebpack(() => {
    const { Store } = Flux;

    // The socket Discord already holds open to Spotify (used for the classic
    // "post"-less player state calls), and the wrapped fetch wrapper we patch
    // a `post` method onto in index.tsx's ".PLAYER_DEVICES" patch.
    const SpotifySocket = findByProps("getActiveSocketAndDevice");
    const SpotifyAPI = findByPropsLazy("vcSpotifyMarker");

    const API_ROOT = "https://api.spotify.com/v1";

    class SpotifyStore extends Store {
        // Position is tracked as a (base, timestamp) pair rather than a plain
        // number so `position` can extrapolate smoothly between the periodic
        // SPOTIFY_PLAYER_STATE updates instead of jumping once a second.
        public mPosition = 0;
        public _start = 0;

        public track: Track | null = null;
        public device: Device | null = null;
        public isPlaying = false;
        public repeat: Repeat = "off";
        public shuffle = false;
        public volume = 0;

        /** True while a seek request is in flight, to avoid the position snapping back before the new state arrives. */
        public isSettingPosition = false;

        /** Guards against overlapping autoplay-fallback requests and repeated triggers off the same stop event. */
        private _fallbackInFlight = false;
        private _lastFallbackAt = 0;

        /** Opens a Spotify path either as a spotify: URI (desktop app) or an open.spotify.com URL, per user settings. */
        public openExternal(path: string) {
            const useUri = Settings.plugins.VibeCord.useSpotifyUris || isPluginEnabled(OpenInAppPlugin.name);

            const url = useUri
                ? "spotify:" + path.replaceAll("/", (_, idx) => (idx === 0 ? "" : ":"))
                : "https://open.spotify.com" + path;

            VencordNative.native.openExternal(url);
        }

        public getExternalUrl(path: string) {
            return "https://open.spotify.com" + path;
        }

        public get position(): number {
            let pos = this.mPosition;
            if (this.isPlaying) pos += Date.now() - this._start;
            return pos;
        }

        public set position(p: number) {
            this.mPosition = p;
            this._start = Date.now();
        }

        prev() {
            return this._req("post", "/previous");
        }

        next() {
            return this._req("post", "/next");
        }

        setVolume(percent: number) {
            return this._req("put", "/volume", { query: { volume_percent: Math.round(percent) } }).then(() => {
                this.volume = percent;
                this.emitChange();
            });
        }

        setPlaying(playing: boolean) {
            return this._req("put", playing ? "/play" : "/pause");
        }

        async playTrack(uri: string) {
            const query = this.device?.is_active ? { device_id: this.device.id } : undefined;
            return this._webApi("PUT", "/me/player/play", { uris: [uri] }, query);
        }

        /** Picks a random track from the user's Liked Songs and plays it. Used as the autoplay fallback. */
        async playRandomSavedTrack() {
            const first = await this._webApi("GET", "/me/tracks", undefined, { limit: "1" });
            const total: number = first?.total ?? 0;
            if (!total) return;

            const offset = Math.floor(Math.random() * total);
            const page = await this._webApi("GET", "/me/tracks", undefined, { limit: "1", offset: String(offset) });
            const uri: string | undefined = page?.items?.[0]?.track?.uri;
            if (!uri) return;

            return this.playTrack(uri);
        }

        async queueTrack(uri: string) {
            return this._webApi("POST", "/me/player/queue", undefined, { uri });
        }

        /** The connected Spotify account's profile (display name + avatar), for personalizing the menu header. */
        async getMe(): Promise<SpotifyProfile | null> {
            return this._webApi("GET", "/me");
        }

        async searchTracks(query: string, limit = 20): Promise<SearchTrack[]> {
            const trimmed = query.trim();
            if (!trimmed) return [];

            const result = await this._webApi("GET", "/search", undefined, {
                q: trimmed,
                type: "track",
                limit: String(limit)
            });

            return (result?.tracks?.items ?? []).filter(Boolean);
        }

        /** Searches tracks and playlists in one request, for the menu's search tab. */
        async search(query: string): Promise<{ tracks: SearchTrack[]; playlists: SimplePlaylist[]; }> {
            const trimmed = query.trim();
            if (!trimmed) return { tracks: [], playlists: [] };

            const result = await this._webApi("GET", "/search", undefined, {
                q: trimmed,
                type: "track,playlist",
                limit: "12"
            });

            return {
                // Spotify occasionally returns null entries in these arrays, hence the filter.
                tracks: (result?.tracks?.items ?? []).filter(Boolean),
                playlists: (result?.playlists?.items ?? []).filter(Boolean)
            };
        }

        /** All playlists in the user's library (own, followed and collaborative), paginated. */
        async getMyPlaylists(max = 150): Promise<SimplePlaylist[]> {
            const playlists: SimplePlaylist[] = [];
            let offset = 0;

            while (playlists.length < max) {
                const page = await this._webApi("GET", "/me/playlists", undefined, {
                    limit: "50",
                    offset: String(offset)
                });

                const items: SimplePlaylist[] = (page?.items ?? []).filter(Boolean);
                playlists.push(...items);

                if (!page?.next || items.length === 0) break;
                offset += 50;
            }

            return playlists.slice(0, max);
        }

        /** A pseudo-playlist entry for Liked Songs, so it can sit alongside real playlists in the UI. */
        async getLikedSongsPlaylist(): Promise<SimplePlaylist | null> {
            try {
                const first = await this._webApi("GET", "/me/tracks", undefined, { limit: "1" });

                return {
                    id: LIKED_SONGS_ID,
                    name: "Liked Songs",
                    uri: "",
                    description: "Songs you've saved on Spotify",
                    images: [],
                    owner: { id: "", display_name: "You" },
                    tracks: { total: first?.total ?? 0 },
                    isLikedSongs: true
                };
            } catch (err) {
                console.error("[VibeCord] Failed to load Liked Songs", err);
                return null;
            }
        }

        /** Tracks of a playlist, or of Liked Songs when given the pseudo-playlist id. */
        async getPlaylistTracks(playlistId: string, max = 100): Promise<SearchTrack[]> {
            const route = playlistId === LIKED_SONGS_ID ? "/me/tracks" : `/playlists/${playlistId}/tracks`;
            const tracks: SearchTrack[] = [];
            let offset = 0;

            while (tracks.length < max) {
                const page = await this._webApi("GET", route, undefined, {
                    limit: "50",
                    offset: String(offset)
                });

                const items = (page?.items ?? [])
                    .map((item: any) => item?.track)
                    .filter((track: any) => track?.uri && track.type !== "episode");

                tracks.push(...items);

                if (!page?.next || (page?.items ?? []).length === 0) break;
                offset += 50;
            }

            return tracks.slice(0, max);
        }

        async getPlaylist(playlistId: string): Promise<SimplePlaylist | null> {
            if (playlistId === LIKED_SONGS_ID) return this.getLikedSongsPlaylist();
            return this._webApi("GET", `/playlists/${playlistId}`);
        }

        /** Starts playback of a playlist/album context, optionally from a specific track. */
        async playContext(contextUri: string, offsetUri?: string) {
            const query = this.device?.is_active ? { device_id: this.device.id } : undefined;

            const body: any = { context_uri: contextUri };
            if (offsetUri) body.offset = { uri: offsetUri };

            return this._webApi("PUT", "/me/player/play", body, query);
        }

        /** Plays a list of track URIs. Used for Liked Songs, which has no playable context URI. */
        async playTracks(uris: string[], startIndex = 0) {
            if (!uris.length) return;

            const query = this.device?.is_active ? { device_id: this.device.id } : undefined;
            const ordered = [...uris.slice(startIndex), ...uris.slice(0, startIndex)];

            return this._webApi("PUT", "/me/player/play", { uris: ordered.slice(0, 50) }, query);
        }

        /** Plays a playlist from the start, handling the Liked Songs special case. */
        async playPlaylist(playlist: SimplePlaylist) {
            if (!playlist.isLikedSongs) return this.playContext(playlist.uri);

            const tracks = await this.getPlaylistTracks(LIKED_SONGS_ID, 50);
            return this.playTracks(tracks.map(t => t.uri));
        }

        setRepeat(state: Repeat) {
            return this._req("put", "/repeat", { query: { state } });
        }

        setShuffle(state: boolean) {
            return this._req("put", "/shuffle", { query: { state } }).then(() => {
                this.shuffle = state;
                this.emitChange();
            });
        }

        seek(ms: number) {
            if (this.isSettingPosition) return Promise.resolve();
            this.isSettingPosition = true;

            return this._req("put", "/seek", { query: { position_ms: Math.round(ms) } }).catch((e: any) => {
                console.error("[VibeCord] Failed to seek", e);
                this.isSettingPosition = false;
            });
        }

        /** Calls the Spotify Web API directly (used for search/play/queue, which the internal socket API doesn't cover). */
        async _webApi(method: "GET" | "POST" | "PUT", route: string, body?: any, query?: Record<string, string>) {
            const token = await SpotifyAuth.getAccessToken();
            const url = new URL(API_ROOT + route);

            if (query) {
                for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
            }

            const response = await fetch(url.toString(), {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...(body !== undefined ? { "Content-Type": "application/json" } : {})
                },
                ...(body !== undefined ? { body: JSON.stringify(body) } : {})
            });

            if (response.status === 204) return null;

            const text = await response.text();
            let data: any = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                data = null;
            }

            if (!response.ok) {
                const message = data?.error?.message || data?.error_description || `Spotify API request failed (${response.status})`;
                throw new Error(message);
            }

            return data;
        }

        /** Calls the Spotify Web API through Discord's own authenticated socket connection. */
        _apiReq(method: "post" | "get" | "put", route: string, data: any = {}) {
            const { socket } = SpotifySocket.getActiveSocketAndDevice();

            return SpotifyAPI[method](socket.accountId, socket.accessToken, {
                url: API_ROOT + route,
                ...data
            });
        }

        /** Like `_apiReq`, but scoped to `/me/player` and targeting the currently active device when there is one. */
        _req(method: "post" | "get" | "put", route: string, data: any = {}) {
            if (this.device?.is_active) (data.query ??= {}).device_id = this.device.id;
            return this._apiReq(method, "/me/player" + route, data);
        }

        /**
         * Called on every player-state update with the *previous* values. If those previous values show a track
         * that was playing and had run to (near) its end, and the new state is now stopped on that same track,
         * Spotify had nothing queued to continue with (its own Autoplay is off, or the context/queue was empty).
         * If the user has the fallback setting on, grab a random track from Liked Songs instead of just stopping.
         */
        _maybeAutoplayFallback(prevTrackId: string | undefined, prevWasPlaying: boolean, prevDuration: number, prevPosition: number) {
            if (!Settings.plugins.VibeCord.autoplayFallback) return;
            if (this._fallbackInFlight) return;
            if (Date.now() - this._lastFallbackAt < 4000) return;
            if (!this.device?.is_active) return;

            const sameTrackStopped = prevWasPlaying && !this.isPlaying && prevTrackId && prevTrackId === this.track?.id;
            const ranToEnd = prevDuration > 0 && prevPosition >= prevDuration - 1200;
            if (!sameTrackStopped || !ranToEnd) return;

            this._fallbackInFlight = true;
            this._lastFallbackAt = Date.now();

            this.playRandomSavedTrack()
                .catch((err: any) => console.error("[VibeCord] Autoplay fallback failed", err))
                .finally(() => { this._fallbackInFlight = false; });
        }
    }

    const store = new SpotifyStore(FluxDispatcher, {
        SPOTIFY_PLAYER_STATE(e: PlayerState) {
            // Snapshot pre-update, so the fallback check below can tell a track that just
            // ran to the end and stopped apart from one that's simply mid-playback.
            const prevTrackId = store.track?.id;
            const prevWasPlaying = store.isPlaying;
            const prevDuration = store.track?.duration ?? 0;
            const prevPosition = store.position;

            store.track = e.track;
            store.device = e.device ?? null;
            store.isPlaying = e.isPlaying ?? false;
            store.volume = e.volumePercent ?? 0;
            store.repeat = e.actual_repeat || "off";
            store.shuffle = e.shuffle ?? false;
            store.position = e.position ?? 0;
            store.isSettingPosition = false;

            store.emitChange();

            store._maybeAutoplayFallback(prevTrackId, prevWasPlaying, prevDuration, prevPosition);
        },

        SPOTIFY_SET_DEVICES({ devices }: { devices: Device[]; }) {
            store.device = devices.find(d => d.is_active) ?? devices[0] ?? null;
            store.emitChange();
        }
    });

    return store;
});
