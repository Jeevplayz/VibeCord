/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { settings } from "./settings";

// Local loopback redirect used for Spotify's Authorization Code + PKCE flow.
// Nothing actually listens on this port; the user copies the resulting URL
// out of their browser's address bar and pastes it back into the plugin.
const REDIRECT_URI = "http://127.0.0.1:43821/callback";

const SCOPES = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-private",
    "user-library-read",
    "playlist-read-private",
    "playlist-read-collaborative"
].join(" ");

/**
 * Bumped whenever SCOPES changes. Tokens granted under an older set are treated
 * as not connected, so the user is prompted to re-authorize instead of hitting
 * confusing 403s on the playlist endpoints.
 */
const SCOPE_VERSION = 2;

function getClientId(): string {
    const clientId = settings.store.spotifyClientId?.trim();
    if (!clientId) throw new Error("Spotify Client ID is not configured.");
    return clientId;
}

function randomString(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    return Array.from(values, value => chars[value % chars.length]).join("");
}

/** PKCE code challenge: base64url(SHA-256(verifier)), per RFC 7636. */
async function createCodeChallenge(verifier: string): Promise<string> {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));

    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

/** Step 1: open Spotify's authorization page in the browser, with a fresh PKCE verifier + state stashed for `complete()`. */
async function connect(): Promise<void> {
    const clientId = getClientId();
    const verifier = randomString(64);
    const challenge = await createCodeChallenge(verifier);
    const state = randomString(32);

    settings.store.spotifyCodeVerifier = verifier;
    settings.store.spotifyOAuthState = state;

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        state,
        code_challenge_method: "S256",
        code_challenge: challenge
    });

    VencordNative.native.openExternal(`https://accounts.spotify.com/authorize?${params.toString()}`);
}

/** Step 2: validate the callback URL the user pasted back in, then exchange the auth code for tokens. */
async function complete(callbackUrl: string): Promise<void> {
    if (!callbackUrl.trim()) throw new Error("Please paste the complete Spotify callback URL.");

    let url: URL;
    try {
        url = new URL(callbackUrl.trim());
    } catch {
        throw new Error("The callback URL is not valid.");
    }

    if (url.origin !== "http://127.0.0.1:43821" || url.pathname !== "/callback") {
        throw new Error("The callback URL does not match the configured Spotify redirect URI.");
    }

    const error = url.searchParams.get("error");
    if (error) throw new Error(`Spotify authorization failed: ${error}`);

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code) throw new Error("The callback URL does not contain an authorization code.");

    const savedState = settings.store.spotifyOAuthState;
    if (!savedState) throw new Error("Spotify OAuth state is missing. Start the connection again.");
    if (state !== savedState) throw new Error("Spotify OAuth state does not match. Start the connection again.");

    const verifier = settings.store.spotifyCodeVerifier;
    if (!verifier) throw new Error("Spotify PKCE verifier is missing. Start the connection again.");

    const clientId = getClientId();

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error_description || data?.error || `Spotify token request failed with HTTP ${response.status}`);
    }
    if (!data.access_token) throw new Error("Spotify did not return an access token.");

    settings.store.spotifyAccessToken = data.access_token;
    if (data.refresh_token) settings.store.spotifyRefreshToken = data.refresh_token;
    settings.store.spotifyTokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

    settings.store.spotifyCodeVerifier = "";
    settings.store.spotifyOAuthState = "";
    settings.store.spotifyScopeVersion = SCOPE_VERSION;
}

/** Exchanges the stored refresh token for a new access token. */
async function refresh(): Promise<string> {
    const clientId = getClientId();
    const refreshToken = settings.store.spotifyRefreshToken;
    if (!refreshToken) throw new Error("No Spotify refresh token is available.");

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: "refresh_token",
            refresh_token: refreshToken
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error_description || data?.error || `Spotify token refresh failed with HTTP ${response.status}`);
    }
    if (!data.access_token) throw new Error("Spotify did not return a refreshed access token.");

    settings.store.spotifyAccessToken = data.access_token;
    if (data.refresh_token) settings.store.spotifyRefreshToken = data.refresh_token;
    settings.store.spotifyTokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

    return data.access_token;
}

/** Returns a valid access token, refreshing it first if it's missing or expiring within the next minute. */
async function getAccessToken(): Promise<string> {
    const accessToken = settings.store.spotifyAccessToken;
    const refreshToken = settings.store.spotifyRefreshToken;
    const expiresAt = settings.store.spotifyTokenExpiresAt;

    if (!accessToken && !refreshToken) throw new Error("Spotify is not connected.");

    const expiringSoon = !expiresAt || Date.now() >= expiresAt - 60_000;
    if (!accessToken || expiringSoon) return refresh();

    return accessToken;
}

function isConnected(): boolean {
    const hasToken = Boolean(settings.store.spotifyAccessToken || settings.store.spotifyRefreshToken);
    return hasToken && settings.store.spotifyScopeVersion === SCOPE_VERSION;
}

/** True when a token exists but predates the current scope set, i.e. the user needs to reconnect. */
function needsReauthorization(): boolean {
    const hasToken = Boolean(settings.store.spotifyAccessToken || settings.store.spotifyRefreshToken);
    return hasToken && settings.store.spotifyScopeVersion !== SCOPE_VERSION;
}

function disconnect(): void {
    settings.store.spotifyAccessToken = "";
    settings.store.spotifyRefreshToken = "";
    settings.store.spotifyTokenExpiresAt = 0;
    settings.store.spotifyCodeVerifier = "";
    settings.store.spotifyOAuthState = "";
    settings.store.spotifyScopeVersion = 0;
}

function getRedirectUri(): string {
    return REDIRECT_URI;
}

export const SpotifyAuth = {
    connect,
    complete,
    refresh,
    getAccessToken,
    isConnected,
    needsReauthorization,
    disconnect,
    getRedirectUri
};
