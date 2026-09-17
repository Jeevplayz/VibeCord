/*
 * Vencord, a modification for Discord's desktop app
 * GPL v3
 */

import { classNameFactory } from "@api/Styles";
import { Flex } from "@components/Flex";
import { classes } from "@utils/misc";
import { React, useStateFromStores } from "@webpack/common";

import { settings } from "../settings";
import { SpotifyStore } from "../SpotifyStore";
import { PauseButton, PlayButton, SkipNext, SkipPrev } from "./icons";

const cl = classNameFactory("vc-spotify-");

function ButtonWrapper(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button className={cl("button")} {...props}>
            {props.children}
        </button>
    );
}

/** Restarts the current track if it's played more than 3s in, otherwise skips to the previous one. */
function handlePrevious() {
    const restartsTrack = settings.store.previousButtonRestartsTrack;

    if (restartsTrack && SpotifyStore.position > 3000) {
        SpotifyStore.seek(0);
    } else {
        SpotifyStore.prev();
    }
}

export function Controls() {
    const isPlaying = useStateFromStores([SpotifyStore], () => SpotifyStore.isPlaying);

    return (
        <Flex className={cl("button-row")} style={{ gap: 4, alignSelf: "center", marginTop: 0, marginBottom: 0 }}>
            <ButtonWrapper onClick={handlePrevious} aria-label="Previous" title="Previous">
                <SkipPrev />
            </ButtonWrapper>

            <ButtonWrapper
                onClick={() => SpotifyStore.setPlaying(!isPlaying)}
                aria-label={isPlaying ? "Pause" : "Play"}
                title={isPlaying ? "Pause" : "Play"}
                className={classes(cl("button"), cl("play"))}
            >
                {isPlaying ? <PauseButton /> : <PlayButton />}
            </ButtonWrapper>

            <ButtonWrapper onClick={() => SpotifyStore.next()} aria-label="Next" title="Next">
                <SkipNext />
            </ButtonWrapper>
        </Flex>
    );
}
