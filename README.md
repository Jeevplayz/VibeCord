# VibeCord

A [Vencord](https://vencord.dev/) plugin that adds a full Spotify player to Discord — right above your account panel. Control playback, browse your playlists, search tracks, and follow along with synced lyrics, all without leaving Discord.

## Features

* **Now-playing player** above the account panel, with album art, track title/artist, play/pause/skip, volume, and a draggable seek bar
* **Spotify menu** (opened from the player's context menu) with:

  * Your playlists and Liked Songs, with search/filter
  * Track search across all of Spotify
  * Synced or plain lyrics that follow the current track
* **Autoplay fallback** — when your queue runs out and Spotify just stops, optionally kick off a random track from Liked Songs instead
* **Customizable look** — font, font size, album art size, accent color, and background color
* Click song/artist/album text to open it in Spotify
* Right-click song/artist/album text for a context menu with copy URL/URI

## Screenshots

| Mini player                                                                                                                                                                                                                     | Your Playlists                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Mini player above the account panel](https://cdn.discordapp.com/attachments/1015664266394734684/1550097588026343524/image.png?ex=6aad1860\&is=6aabc6e0\&hm=7f7433e3a4178297953454e4dda555908b67b7945f69961dd87fb7a89594db84&) | ![Playlists tab in the Spotify menu](https://cdn.discordapp.com/attachments/1015664266394734684/1550097588412350485/image.png?ex=6aad1860\&is=6aabc6e0\&hm=6e22e92dd728a1ea085bcefc5e95268e66f1e9aa72c0fb73b3a4ebffa229ac49&) |

| Search                                                                                                                                                                                                 | Lyrics                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Search tab](https://cdn.discordapp.com/attachments/1015664266394734684/1550098909542486037/image.png?ex=6aad199b\&is=6aabc81b\&hm=18dc56f20e820e54add44e88e9ffd5e6acfd1f03f3d33346baad5d50b8b15537&) | ![Synced lyrics tab](https://cdn.discordapp.com/attachments/1015664266394734684/1550097589502746624/image.png?ex=6aad1860\&is=6aabc6e0\&hm=ba2ff019e716b594047b4c47c51a061d4af427d4076c2dcd9639342b56b0&) |

## Requirements

* [Vencord](https://github.com/Vendicated/Vencord) installed
* A **Spotify Premium** account (Spotify playback control requires Premium)
* A free Spotify Developer app for your own Client ID

## Installation

1. Clone this repository into Vencord's user plugins folder:

   ```bash
   git clone https://github.com/Jeevplayz/VibeCord.git src/userplugins/VibeCord
   ```

   Place it inside your Vencord source tree at `src/userplugins/`.

2. Rebuild and inject Vencord:

   ```bash
   pnpm build
   pnpm inject
   ```

3. Restart Discord, or reload it with `Ctrl+R`.

4. Enable **VibeCord** in Vencord's plugin settings.

## Setup

VibeCord talks to Spotify directly using OAuth. You'll need your own free Spotify Developer app.

### 1. Create a Spotify Developer App

Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.

Click **Create app**.

Fill in any name and description you like.

### 2. Add the Redirect URI

Under **Redirect URIs**, add exactly:

```text
http://127.0.0.1:43821/callback
```

Save the app.

### 3. Copy Your Client ID

Copy the **Client ID** from your Spotify Developer app.

> VibeCord does not need your Spotify Client Secret.

### 4. Add the Client ID to VibeCord

In Discord:

1. Open **Vencord Settings**
2. Open **Plugins**
3. Open **VibeCord**
4. Paste your Client ID into **Spotify Developer Client ID**

### 5. Connect Spotify

Open the Spotify menu and click **Connect Spotify**, or use the connection option from VibeCord's plugin settings.

A browser window will open.

Log in to Spotify and approve the requested permissions.

After authorization, your browser will be redirected to:

```text
http://127.0.0.1:43821/callback
```

Copy the **full callback URL** from your browser's address bar and paste it back into VibeCord to complete the connection.

## Settings

| Setting                               | Description                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Spotify Developer Client ID**       | Your app's Client ID from the Spotify Developer Dashboard                                                    |
| **Open Spotify URIs instead of URLs** | Opens Spotify links in the Spotify desktop app instead of your browser                                       |
| **Restart track on previous**         | If playtime is greater than 3 seconds, pressing Previous restarts the current track instead of skipping back |
| **Show seek bar**                     | Displays a draggable progress bar instead of plain elapsed/total time                                        |
| **Autoplay fallback**                 | Plays a random Liked Song when the queue/context runs out and playback stops                                 |
| **Font**                              | Changes the player's font                                                                                    |
| **Font size**                         | Changes the player's text size                                                                               |
| **Album art size**                    | Changes the size of the album art thumbnail                                                                  |
| **Accent color**                      | Changes the color used for the seek bar fill                                                                 |
| **Background color**                  | Changes the player's background color                                                                        |

## Notes

### Spotify Algorithmic Playlists

Spotify's API blocks third-party apps created after November 2024 from reading certain algorithmic playlists, including:

* Daily Mix
* Discover Weekly
* Release Radar

This is a Spotify-side API restriction and is not a bug in VibeCord.

### Lyrics

Lyrics are fetched from [LRCLIB](https://lrclib.net/), a free community lyrics database.

Lyrics availability and synchronization depend on what is available through LRCLIB.

## Credits

* **Author:** JellyBean
* Built on [Vencord](https://vencord.dev/)
* Lyrics provided by [LRCLIB](https://lrclib.net/)

## License

GPL v3, in line with Vencord's own license.
