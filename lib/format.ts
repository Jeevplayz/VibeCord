/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

/** Formats a millisecond duration as "MM:SS" (e.g. 125000 -> "02:05"). */
export function msToHuman(ms: number): string {
    if (!ms && ms !== 0) return "00:00";

    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
