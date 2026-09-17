# VibeCord

A [Vencord](https://vencord.dev/) plugin that adds a full Spotify player to Discord — right above your account panel. Control playback, browse your playlists, search tracks, and follow along with synced lyrics, all without leaving Discord.

## Features

- **Now-playing player** above the account panel, with album art, track title/artist, play/pause/skip, volume, and a draggable seek bar
- **Spotify menu** (opened from the player's context menu) with:
  - Your playlists and Liked Songs, with search/filter
  - Track search across all of Spotify
  - Synced or plain lyrics that follow the current track
- **Autoplay fallback** — when your queue runs out and Spotify just stops, optionally kick off a random track from Liked Songs instead
- **Customizable look** — font, font size, album art size, accent color, and background color
- Click song/artist/album text to open it in Spotify, right-click for a context menu with copy URL/URI

## Requirements

- [Vencord](https://github.com/Vendicated/Vencord) installed
- A **Spotify Premium** account (the Spotify Web API requires Premium for playback control)
- A free Spotify Developer app (for your own Client ID — see setup below)

## Installation

1. Clone this repo (or download it) into Vencord's user plugins folder:
   ```
   git clone https://github.com/Jeevplayz/VibeCord.git src/userplugins/VibeCord
   ```
   (Place it inside your Vencord source tree at `src/userplugins/`.)
2. Rebuild Vencord & Inject:
   ```
   pnpm build
   pnpm inject
   ```
3. Restart Discord (or reload with Ctrl+R) and enable **VibeCord** in Vencord's plugin settings.

## Setup

VibeCord talks to Spotify directly using OAuth, so you'll need your own free Spotify Developer app:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app**.
3. Fill in any name/description you like.
4. Under **Redirect URIs**, add exactly:
   ```
   http://127.0.0.1:43821/callback
   ```
5. Save the app, then copy its **Client ID** (not the Client Secret — VibeCord doesn't need it).
6. In Discord, open VibeCord's plugin settings and paste the Client ID into **Spotify Developer Client ID**.
7. Click **Connect Spotify** in the Spotify menu (or from the plugin settings), approve access in your browser, then copy the full callback URL from your browser's address bar and paste it back in to complete the connection.

## Settings

| Setting | Description |
|---|---|
| Spotify Developer Client ID | Your app's Client ID from the Spotify Developer Dashboard |
| Open Spotify URIs instead of URLs | Opens links in the Spotify desktop app instead of your browser |
| Restart track on previous | If playtime > 3s, pressing Previous restarts the track instead of skipping back |
| Show seek bar | Draggable progress bar instead of plain elapsed/total text |
| Autoplay fallback | Plays a random Liked Song when the queue/context runs out and playback stops |
| Font / Font size | Styling for the player's text |
| Album art size | Size of the album art thumbnail |
| Accent color | Color used for the seek bar fill |
| Background color | Player background color |

## Notes

- Spotify's API blocks third-party apps created after November 2024 from reading algorithmic playlists (Daily Mix, Discover Weekly, Release Radar) — this is a Spotify-side restriction, not a bug in the plugin.
- Lyrics are fetched from [lrclib.net](https://lrclib.net), a free community lyrics database.

## Credits

- **Author:** JellyBean
- Built on [Vencord](https://vencord.dev/)
- Lyrics via [lrclib.net](https://lrclib.net)

## License

GPL v3, in line with Vencord's own license.
