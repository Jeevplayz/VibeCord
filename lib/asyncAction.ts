/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { showToast, Toasts } from "@webpack/common";

/**
 * Runs an async action and reports the outcome via a toast, logging any
 * failure to the console with the given label. Used by fire-and-forget
 * actions (play/queue a track, etc.) that don't need to track loading state.
 */
export async function runWithToast(
    action: () => Promise<void>,
    messages: { success: string; failure: string; },
    logLabel: string
): Promise<void> {
    try {
        await action();
        showToast(messages.success, Toasts.Type.SUCCESS);
    } catch (error) {
        console.error(`[VibeCord] ${logLabel}`, error);
        showToast(messages.failure, Toasts.Type.FAILURE);
    }
}

/**
 * Runs an async action while toggling a "busy" flag and capturing any
 * thrown error message into an error setter. Used by the search modal's
 * connect/complete flows, which both need a loading spinner and inline
 * error text but otherwise do different things on success.
 */
export async function runTracked(
    setBusy: (busy: boolean) => void,
    setError: (message: string | null) => void,
    fallbackMessage: string,
    action: () => Promise<void>,
    logLabel?: string
): Promise<void> {
    setError(null);
    setBusy(true);

    try {
        await action();
    } catch (error: any) {
        if (logLabel) console.error(`[VibeCord] ${logLabel}`, error);
        setError(error?.message || fallbackMessage);
    } finally {
        setBusy(false);
    }
}
