# GTA San Andreas Radio Playlist Generator

A static web app that generates authentic GTA San Andreas-style radio playlists as .m3u files.

## 🚀 Setup

### 1. Add Required Assets

Before deploying, add your image and font assets:

**Fonts** (`docs/assets/fonts/`):
- `Diploma-Regular.ttf` — Headings font
- `Bank-Gothic-Medium.ttf` — Body text font
- `Bank-Gothic-Light.otf` — Light weight (optional)

**Background Images** (`docs/assets/bgs/`):
- `los-santos.png`
- `vinewood.png`
- `san-fierro.png`
- `san-fierro-bridge.png`
- `las-venturas.png`
- `las-venturas-desert.png`

**Station Icons** (`docs/assets/icons/`):
- `bounce_fm.png`
- `csr_1039.png`
- `k_dst.png`
- `k_jah_west.png`
- `k_rose.png`
- `master_sounds_983.png`
- `playback_fm.png`
- `radio_los_santos.png`
- `radio_x.png`
- `sfur.png`

### 2. Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload the `docs` folder contents (with your assets)
3. Go to **Settings** → **Pages**
4. Set source to `main` branch and `/docs` folder
5. Access at `https://yourusername.github.io/your-repo-name`

### 3. Run Locally

Just open `docs/index.html` in any browser!

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

## 🎵 Playlist Logic

- **Jingle** (70% chance)
- **Bridge Announcement** (8% chance)
- **Song** (always, uses all station songs)
- **Extra segment** (DJ talk, caller, weather, story, or ad)

No content repeats within a playlist!

## 📄 License

For personal use only. GTA San Andreas © Rockstar Games.
