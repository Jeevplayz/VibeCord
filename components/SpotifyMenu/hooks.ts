/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { React, showToast, Toasts, useEffect, useState } from "@webpack/common";

import { runTracked } from "../../lib/asyncAction";
import { settings } from "../../settings";
import { SpotifyAuth } from "../../SpotifyAuth";

/** Owns the OAuth connect/complete/disconnect flow and its loading + error state. */
export function useSpotifyConnection() {
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [callbackUrl, setCallbackUrl] = useState("");

    // Bumped after connect/disconnect so the modal re-reads SpotifyAuth's state.
    const [version, setVersion] = useState(0);

    const connected = React.useMemo(() => SpotifyAuth.isConnected(), [version]);
    const needsReauth = React.useMemo(() => SpotifyAuth.needsReauthorization(), [version]);
    const clientId = settings.store.spotifyClientId.trim();

    const connect = () =>
        runTracked(setConnecting, setError, "Failed to start Spotify authorization.", async () => {
            if (!clientId) throw new Error("Enter your Spotify Client ID in VibeCord settings first.");

            await SpotifyAuth.connect();
            setError(
                "Spotify opened in your browser. Approve access, then copy the complete callback URL from the browser address bar and paste it below."
            );
        });

    const complete = () =>
        runTracked(
            setConnecting,
            setError,
            "Failed to connect Spotify.",
            async () => {
                await SpotifyAuth.complete(callbackUrl);
                setCallbackUrl("");
                setVersion(v => v + 1);
                showToast("Spotify connected", Toasts.Type.SUCCESS);
            },
            "Spotify authorization failed:"
        );

    const disconnect = async () => {
        await SpotifyAuth.disconnect();
        setError(null);
        setVersion(v => v + 1);
        showToast("Spotify disconnected", Toasts.Type.SUCCESS);
    };

    return {
        connected,
        needsReauth,
        clientId,
        connecting,
        error,
        setError,
        callbackUrl,
        setCallbackUrl,
        connect,
        complete,
        disconnect
    };
}

export interface AsyncResource<T> {
    data: T;
    loading: boolean;
    error: string | null;
    reload: () => void;
}

/**
 * Loads an async value once (and on demand), tracking loading and error state.
 * `deps` behaves like a useEffect dependency list: changing it refetches.
 */
export function useAsyncResource<T>(
    load: () => Promise<T>,
    fallback: T,
    deps: unknown[],
    logLabel: string,
    enabled = true
): AsyncResource<T> {
    const [data, setData] = useState<T>(fallback);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        setLoading(true);
        setError(null);

        load()
            .then(result => {
                if (!cancelled) setData(result);
            })
            .catch((err: any) => {
                if (cancelled) return;
                console.error(`[VibeCord] ${logLabel}`, err);
                setData(fallback);
                setError(err?.message || "Something went wrong talking to Spotify.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, attempt, enabled]);

    return { data, loading, error, reload: () => setAttempt(a => a + 1) };
}
