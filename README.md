# GTA San Andreas Radio Playlist Generator

A static web app that generates authentic GTA San Andreas-style radio playlists as .m3u files.

## 📁 Audio File Structure

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

## 📱 Usage

1. Open the website
2. Select a background (optional)
3. Tap a station icon
4. Configure options (ads, weather, bridges)
5. Tap **GENERATE PLAYLIST**
6. Tap **DOWNLOAD .M3U**
7. Place the file in your audio folder
8. Open with any music player

## 🏠 PWA Installation

This app can be installed as a Progressive Web App (PWA) on supported devices:

### Android (Chrome)
1. Open the website in Chrome
2. Tap the menu (three dots) in the top right
3. Select "Add to Home screen"
4. Follow the prompts to install

### Desktop (Chrome/Edge)
1. Open the website
2. Click the install icon in the address bar or menu
3. Follow the prompts

Once installed, the app will work offline and can be launched from your home screen like a native app.

## 🎵 Playlist Logic

- **Jingle** (70% chance)
- **Bridge Announcement** (8% chance)
- **Song** (always, uses all station songs)
- **Extra segment** (DJ talk, caller, weather, story, or ad)

No content repeats within a playlist!

## 📄 License

For personal use only. GTA San Andreas © Rockstar Games.
