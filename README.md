# GTA San Andreas Radio

A web app that lets you experience authentic GTA San Andreas radio stations. Stream directly online or generate playlists for offline use.

[Live App](https://shrihari1999.github.io/gta-sa-radio/)

## Features

- **Online Mode** - Stream radio directly in the browser with a built-in audio player
- **Offline Mode** - Generate .m3u playlists for use with local audio files
- **11 Radio Stations** - All music stations from GTA San Andreas
- **Authentic Experience** - Songs, DJ talk, callers, jingles, weather reports, and advertisements
- **Continuous Playback** - Auto-generates new playlists when the current one ends
- **PWA Support** - Install as an app on mobile or desktop

## Usage

### Online Mode (Default)

1. Open the website
2. Select a radio station
3. Tap **START LISTENING**
4. Enjoy the stream with the built-in player

The player shows the current track, progress bar, and upcoming queue. When the playlist ends, a new one is automatically generated.

### Offline Mode

1. Switch to **OFFLINE MODE**
2. Select a radio station
3. Set your base path (where your audio files are stored)
4. Tap **GENERATE PLAYLIST**
5. Tap **DOWNLOAD .M3U**
6. Place the file in your audio folder and open with any music player

## Audio File Structure (Offline Mode)

Organize your audio files like this:

```
Music/gta_sa_audio/
├── songs/
│   ├── Bounce FM/
│   │   ├── Dazz Band - Let it Whip (Intro 1, Outro 1).mp3
│   │   └── ...
│   ├── K-DST/
│   └── ...
├── segments/
│   ├── Bounce FM/
│   │   ├── Jingles/
│   │   ├── DJ Talk/
│   │   ├── Callers/
│   │   ├── Weather/
│   │   └── Bridge Announcements/
│   └── ...
└── advertisements/
    ├── Ammunation.ogg
    └── ...
```

## PWA Installation

### Android (Chrome)
1. Open the website in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen"

### iOS (Safari)
1. Open the website in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Desktop (Chrome/Edge)
1. Open the website
2. Click the install icon in the address bar

## Playlist Logic

Each playlist includes:
- **Jingles** (70% chance between songs)
- **Bridge Announcements** (8% chance)
- **Songs** (all station songs, randomized)
- **Segments** (DJ talk, callers, weather, stories)
- **Advertisements** (20% chance)

No content repeats within a single playlist.

## Credits

GTA San Andreas © Rockstar Games. For personal use only.
