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

## Screenshots

| Mini player | Your Playlists |
|---|---|
| ![Mini player above the account panel]([assets/mini-player.png](https://cdn.discordapp.com/attachments/1015664266394734684/1550097588026343524/image.png?ex=6aad1860&is=6aabc6e0&hm=7f7433e3a4178297953454e4dda555908b67b7945f69961dd87fb7a89594db84&)) | ![Playlists tab in the Spotify menu]([assets/playlists-tab.png](https://cdn.discordapp.com/attachments/1015664266394734684/1550097588412350485/image.png?ex=6aad1860&is=6aabc6e0&hm=6e22e92dd728a1ea085bcefc5e95268e66f1e9aa72c0fb73b3a4ebffa229ac49&)) |

| Search | Lyrics |
|---|---|
| ![Search tab]([assets/search-tab.pn](https://cdn.discordapp.com/attachments/1015664266394734684/1550097588982906940/image.png?ex=6aad1860&is=6aabc6e0&hm=9b05204e6d6e92022f7c18d70bc200d447b11c0847a8e43d8c4514246594b4be&)g) | ![Synced lyrics tab]([assets/lyrics-tab.png](https://cdn.discordapp.com/attachments/1015664266394734684/1550097589502746624/image.png?ex=6aad1860&is=6aabc6e0&hm=ba2ff019e716b594047b4c47c51a061d4da14af427d4076c2dcd9639342b56b0&)) |

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
2. Rebuild & Inject Vencord:
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
