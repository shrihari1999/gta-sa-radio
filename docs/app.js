// GTA San Andreas Radio Playlist Generator

let stationsData = [];
let adsData = [];
let generatedPlaylist = [];
let currentStation = null;
let currentMode = 'online'; // 'offline' or 'online'
let audioPlayer = null;
let currentTrackIndex = 0;
let isPlaying = false;
let preloadAudio = null; // For preloading next track
let preloadedIndex = -1; // Index of preloaded track

// File path mappings
const SEGMENT_FOLDERS = {
    station_jingle: 'Jingles',
    caller: 'Callers',
    weather: 'Weather',
    bridge_announcement: 'Bridge Announcements',
    dj_talk: 'DJ Talk',
    story: 'Story'
};

// Station icon mappings (station key to icon filename)
const STATION_ICONS = {
    'bounce_fm': 'bounce_fm.webp',
    'csr_1039': 'csr_1039.webp',
    'k_dst': 'k_dst.webp',
    'k_jah_west': 'k_jah_west.webp',
    'k_rose': 'k_rose.webp',
    'master_sounds_983': 'master_sounds_983.webp',
    'playback_fm': 'playback_fm.webp',
    'radio_los_santos': 'radio_los_santos.webp',
    'radio_x': 'radio_x.webp',
    'sfur': 'sfur.webp'
};

// DOM Elements
const stationGrid = document.getElementById('station-grid');
const basePathInput = document.getElementById('base-path');
const basePathCard = document.getElementById('base-path-card');
const footer = document.getElementById('footer');
const includeAdsCheckbox = document.getElementById('include-ads');
const includeWeatherCheckbox = document.getElementById('include-weather');
const includeBridgesCheckbox = document.getElementById('include-bridges');
const generateBtn = document.getElementById('generate-btn');
const previewSection = document.getElementById('preview');
const previewStats = document.getElementById('preview-stats');
const previewList = document.getElementById('preview-list');
const downloadBtn = document.getElementById('download-btn');
const modeButtons = document.querySelectorAll('.mode-btn');
const audioPlayerDiv = document.getElementById('audio-player');
const audioElement = document.getElementById('audio-element');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const seekSlider = document.getElementById('seek-slider');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const trackName = document.getElementById('track-name');
const trackArtist = document.getElementById('track-artist');
const queueList = document.getElementById('queue-list');
const queueCount = document.getElementById('queue-count');

// Initialize
async function init() {
    try {
        const [stationsRes, adsRes] = await Promise.all([
            fetch('data.json'),
            fetch('ads.json')
        ]);

        stationsData = await stationsRes.json();
        adsData = await adsRes.json();

        populateStationGrid();
        setupEventListeners();
        setupModeToggle();
        setupAudioPlayer();

        // Ensure correct initial state based on default mode
        if (currentMode === 'offline') {
            basePathCard.classList.remove('hidden');
            footer.classList.remove('hidden');
            audioPlayerDiv.classList.add('hidden');
            previewSection.classList.add('hidden');
            generateBtn.textContent = 'GENERATE PLAYLIST';
        } else {
            basePathCard.classList.add('hidden');
            footer.classList.add('hidden');
            audioPlayerDiv.classList.add('hidden');
            previewSection.classList.add('hidden');
            generateBtn.textContent = 'START LISTENING';
        }

    } catch (error) {
        console.error('Failed to load data:', error);
        alert('Failed to load radio data. Please ensure data.json and ads.json are present.');
    }
}

function populateStationGrid() {
    stationGrid.innerHTML = '';

    stationsData.forEach(station => {
        const iconFile = STATION_ICONS[station.key] || `${station.key}.webp`;
        
        const div = document.createElement('div');
        div.className = 'station-icon';
        div.dataset.station = station.key;
        div.title = station.name;
        
        const img = document.createElement('img');
        img.src = `assets/icons/${iconFile}`;
        img.alt = station.name;
        img.onerror = () => {
            // Fallback if icon doesn't exist - show station initials
            div.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.7rem;font-weight:bold;color:rgb(183, 210, 243);">${station.name.substring(0, 3).toUpperCase()}</div>`;
        };
        
        div.appendChild(img);
        stationGrid.appendChild(div);
    });
}

function setupModeToggle() {
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Set mode
            currentMode = btn.dataset.mode;

            // Stop any playing audio first
            stopAudio();

            // Clear the playlist when switching modes
            generatedPlaylist = [];

            // Toggle UI visibility
            if (currentMode === 'offline') {
                basePathCard.classList.remove('hidden');
                footer.classList.remove('hidden');
                audioPlayerDiv.classList.add('hidden');
                previewSection.classList.add('hidden');
                generateBtn.classList.remove('hidden');
                generateBtn.textContent = 'GENERATE PLAYLIST';
            } else {
                basePathCard.classList.add('hidden');
                footer.classList.add('hidden');
                previewSection.classList.add('hidden');
                audioPlayerDiv.classList.add('hidden');
                generateBtn.classList.remove('hidden');
                generateBtn.textContent = 'START LISTENING';
            }
        });
    });
}

function setupAudioPlayer() {
    // Play/Pause
    playPauseBtn.addEventListener('click', togglePlayPause);

    // Previous/Next
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);

    // Seek
    seekSlider.addEventListener('input', (e) => {
        if (audioElement.duration) {
            const time = (e.target.value / 100) * audioElement.duration;
            audioElement.currentTime = time;
        }
    });

    // Audio events
    audioElement.addEventListener('loadedmetadata', () => {
        timeTotal.textContent = formatTime(audioElement.duration);
        seekSlider.max = 100;
    });

    audioElement.addEventListener('timeupdate', () => {
        if (audioElement.duration) {
            const progress = (audioElement.currentTime / audioElement.duration) * 100;
            seekSlider.value = progress;
            timeCurrent.textContent = formatTime(audioElement.currentTime);
        }
    });

    audioElement.addEventListener('ended', () => {
        playNext();
    });

    audioElement.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        // Try next track on error
        playNext();
    });

    // Update play/pause button when audio state changes
    audioElement.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseButton();
    });

    audioElement.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseButton();
    });
}

function setupEventListeners() {
    // Station selection via grid
    stationGrid.addEventListener('click', (e) => {
        const stationIcon = e.target.closest('.station-icon');
        if (!stationIcon) return;

        // Stop any playing audio first
        stopAudio();

        // Update selection UI
        document.querySelectorAll('.station-icon').forEach(s => s.classList.remove('selected'));
        stationIcon.classList.add('selected');

        // Set current station
        const stationKey = stationIcon.dataset.station;
        currentStation = stationsData.find(s => s.key === stationKey);

        // Enable and show generate button
        generateBtn.disabled = false;
        generateBtn.classList.remove('hidden');

        // Hide preview and player if showing
        previewSection.classList.add('hidden');
        audioPlayerDiv.classList.add('hidden');

        // Clear the playlist
        generatedPlaylist = [];
    });

    generateBtn.addEventListener('click', () => {
        if (currentMode === 'offline') {
            generatePlaylist();
        } else {
            generateAndPlay();
        }
    });
    downloadBtn.addEventListener('click', downloadM3U);
}

// Helper functions
function randomPick(arr) {
    if (!arr || arr.length === 0) return null;
    const index = Math.floor(Math.random() * arr.length);
    return arr.splice(index, 1)[0];
}

function randomChoice(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function buildSongPath(song, station, introNum, outroNum) {
    const artistStr = song.artists.join(', ');
    let filename;
    if (introNum === 0 && outroNum === 0) {
        filename = `${artistStr} - ${song.name}.mp3`;
    } else {
        filename = `${artistStr} - ${song.name} (Intro ${introNum}, Outro ${outroNum}).mp3`;
    }
    return `songs/${station.name}/${filename}`;
}

function buildSegmentPath(segment, station) {
    const folderName = SEGMENT_FOLDERS[segment.type] || segment.type;
    const filename = `${segment.name}.ogg`;
    return `segments/${station.name}/${folderName}/${filename}`;
}

function buildAdPath(ad) {
    const filename = `${ad.name}.mp3`;
    return `advertisements/${filename}`;
}

// Build API URL for online mode
function buildApiUrl(item, station) {
    const baseUrl = 'https://gtatunes.net/api';

    if (item.type === 'song') {
        // Extract song info from the item
        const songName = item.song ? item.song.name : item.name.split(' - ')[1];
        const intro = item.introNum || 0;
        const outro = item.outroNum || 0;

        let url = `${baseUrl}/stations/sa/${station.key}/play?song=${encodeURIComponent(songName)}`;
        if (intro > 0) url += `&intro=${intro}`;
        if (outro > 0) url += `&outro=${outro}`;
        return url;
    } else if (item.type === 'ad') {
        return `${baseUrl}/segments/sa/play?advert=${encodeURIComponent(item.name)}`;
    } else if (item.type === 'jingle') {
        return `${baseUrl}/segments/sa/${station.key}/play?station_jingle=${encodeURIComponent(item.name)}`;
    } else if (item.type === 'segment') {
        // Determine segment type from name or segment object
        const segmentType = item.segmentType || 'dj_talk';
        const segmentName = item.name.replace(/^\[(.*?)\]\s*/, ''); // Remove prefix like [DJ], [Weather]
        return `${baseUrl}/segments/sa/${station.key}/play?${segmentType}=${encodeURIComponent(segmentName)}`;
    }

    return null;
}

// Generate playlist - uses all available songs (or talk segments for WCTR)
function generatePlaylist() {
    if (!currentStation) return;

    generateBtn.classList.add('loading');

    setTimeout(() => {
        // Check if this is WCTR (talk radio)
        if (currentStation.key === 'wctr') {
            generateWCTRPlaylistOffline();
        } else {
            generateMusicPlaylistOffline();
        }

        generateBtn.classList.remove('loading');
    }, 100);
}

// Generate offline playlist for WCTR (talk radio)
function generateWCTRPlaylistOffline() {
    const includeAds = includeAdsCheckbox.checked;

    // WCTR stores talk shows as "songs" in the data structure
    // Order them: all Episode 1s (shuffled), then Episode 2s, etc.
    // News is separated and plays after every 2 shows
    const { shows: talkShows, news: newsSegments } = orderWCTREpisodes(currentStation.songs);

    const jingles = [...(currentStation.segments.station_jingle || [])];
    const ads = adsData.map(a => ({...a}));

    generatedPlaylist = [];
    const stats = { songs: 0, jingles: 0, ads: 0, segments: 0 };
    let showsSinceNews = 0;
    let newsIndex = 0;

    for (let i = 0; i < talkShows.length; i++) {
        // Jingle (70% chance)
        if (jingles.length > 0 && Math.random() < 0.7) {
            const jingle = randomPick(jingles);
            generatedPlaylist.push({
                type: 'jingle',
                name: jingle.name,
                path: buildSegmentPath(jingle, currentStation),
                segment: jingle
            });
            stats.jingles++;
        }

        // Talk show episode
        const show = talkShows[i];
        generatedPlaylist.push({
            type: 'song',
            name: `${show.artists.join(', ')} - ${show.name}`,
            path: buildSongPath(show, currentStation, 0, 0),
            song: show,
            introNum: 0,
            outroNum: 0
        });
        stats.songs++;
        showsSinceNews++;

        // Insert news after every 2 shows
        if (showsSinceNews >= 2 && newsIndex < newsSegments.length) {
            const newsItem = newsSegments[newsIndex];
            generatedPlaylist.push({
                type: 'song',
                name: `${newsItem.artists.join(', ')} - ${newsItem.name}`,
                path: buildSongPath(newsItem, currentStation, 0, 0),
                song: newsItem,
                introNum: 0,
                outroNum: 0
            });
            stats.songs++;
            newsIndex++;
            showsSinceNews = 0;
        }

        // Advertisement (50% chance for talk radio)
        if (includeAds && ads.length > 0 && Math.random() < 0.5) {
            const ad = randomPick(ads);
            if (ad) {
                generatedPlaylist.push({
                    type: 'ad',
                    name: ad.name,
                    path: buildAdPath(ad),
                    ad: ad
                });
                stats.ads++;
            }
        }
    }

    // Add any remaining news segments at the end
    while (newsIndex < newsSegments.length) {
        const newsItem = newsSegments[newsIndex];
        generatedPlaylist.push({
            type: 'song',
            name: `${newsItem.artists.join(', ')} - ${newsItem.name}`,
            path: buildSongPath(newsItem, currentStation, 0, 0),
            song: newsItem,
            introNum: 0,
            outroNum: 0
        });
        stats.songs++;
        newsIndex++;
    }

    updatePreview(stats);
}

// Generate offline playlist for music stations
function generateMusicPlaylistOffline() {
    const includeAds = includeAdsCheckbox.checked;
    const includeWeather = includeWeatherCheckbox.checked;
    const includeBridges = includeBridgesCheckbox.checked;

    // Use ALL songs from the station
    const songs = currentStation.songs.map(s => ({...s}));
    const iterations = songs.length; // Play all songs

    const jingles = [...(currentStation.segments.station_jingle || [])];
    const bridges = [...(currentStation.segments.bridge_announcement || [])];
    const callers = [...(currentStation.segments.caller || [])];
    const weather = [...(currentStation.segments.weather || [])];
    const djTalk = [...(currentStation.segments.dj_talk || [])];
    const story = [...(currentStation.segments.story || [])];
    const ads = adsData.map(a => ({...a}));

    generatedPlaylist = [];
    const stats = { songs: 0, jingles: 0, ads: 0, segments: 0 };

    for (let i = 0; i < iterations && songs.length > 0; i++) {
        // 1. Jingle (optional, ~70% chance)
        if (jingles.length > 0 && Math.random() < 0.7) {
            const jingle = randomPick(jingles);
            generatedPlaylist.push({
                type: 'jingle',
                name: jingle.name,
                path: buildSegmentPath(jingle, currentStation),
                segment: jingle
            });
            stats.jingles++;
        }

        // 2. One segment before song: Bridge OR Weather OR DJ talk OR Caller OR Story
        const preSongTypes = [];
        if (includeBridges && bridges.length > 0) preSongTypes.push('bridge');
        if (includeWeather && weather.length > 0) preSongTypes.push('weather');
        if (djTalk.length > 0) preSongTypes.push('dj_talk');
        if (callers.length > 0) preSongTypes.push('caller');
        if (story.length > 0) preSongTypes.push('story');

        if (preSongTypes.length > 0) {
            const chosenType = randomChoice(preSongTypes);
            let segment;

            switch (chosenType) {
                case 'bridge':
                    segment = randomPick(bridges);
                    if (segment) {
                        generatedPlaylist.push({
                            type: 'segment',
                            name: `[Bridge] ${segment.name}`,
                            path: buildSegmentPath(segment, currentStation),
                            segment: segment,
                            segmentType: 'bridge_announcement'
                        });
                        stats.segments++;
                    }
                    break;
                case 'weather':
                    segment = randomPick(weather);
                    if (segment) {
                        generatedPlaylist.push({
                            type: 'segment',
                            name: `[Weather] ${segment.name}`,
                            path: buildSegmentPath(segment, currentStation),
                            segment: segment,
                            segmentType: 'weather'
                        });
                        stats.segments++;
                    }
                    break;
                case 'dj_talk':
                    segment = randomPick(djTalk);
                    if (segment) {
                        generatedPlaylist.push({
                            type: 'segment',
                            name: `[DJ] ${segment.name}`,
                            path: buildSegmentPath(segment, currentStation),
                            segment: segment,
                            segmentType: 'dj_talk'
                        });
                        stats.segments++;
                    }
                    break;
                case 'caller':
                    segment = randomPick(callers);
                    if (segment) {
                        generatedPlaylist.push({
                            type: 'segment',
                            name: `[Caller] ${segment.name}`,
                            path: buildSegmentPath(segment, currentStation),
                            segment: segment,
                            segmentType: 'caller'
                        });
                        stats.segments++;
                    }
                    break;
                case 'story':
                    segment = randomPick(story);
                    if (segment) {
                        generatedPlaylist.push({
                            type: 'segment',
                            name: `[Story] ${segment.name}`,
                            path: buildSegmentPath(segment, currentStation),
                            segment: segment,
                            segmentType: 'story'
                        });
                        stats.segments++;
                    }
                    break;
            }
        }

        // 3. Song (mandatory)
        const song = randomPick(songs);
        // Random intro/outro including 0 (no intro/outro)
        const introNum = song.intro_count > 0 ? Math.floor(Math.random() * (song.intro_count + 1)) : 0;
        const outroNum = song.outro_count > 0 ? Math.floor(Math.random() * (song.outro_count + 1)) : 0;

        generatedPlaylist.push({
            type: 'song',
            name: `${song.artists.join(', ')} - ${song.name}`,
            path: buildSongPath(song, currentStation, introNum, outroNum),
            song: song,
            introNum: introNum,
            outroNum: outroNum
        });
        stats.songs++;

        // 4. Ad segment after song (35% chance)
        if (includeAds && ads.length > 0 && Math.random() < 0.35) {
            const ad = randomPick(ads);
            if (ad) {
                generatedPlaylist.push({
                    type: 'ad',
                    name: ad.name,
                    path: buildAdPath(ad),
                    ad: ad
                });
                stats.ads++;
            }
        }
    }

    updatePreview(stats);
}

// Generate and play for online mode
function generateAndPlay() {
    if (!currentStation) return;

    generateBtn.classList.add('loading');

    setTimeout(() => {
        // Check if this is WCTR (talk radio)
        if (currentStation.key === 'wctr') {
            generateWCTRPlaylist();
        } else {
            generateMusicPlaylist();
        }

        // Start playback
        currentTrackIndex = 0;
        audioPlayerDiv.classList.remove('hidden');
        updateQueue();
        playTrack(0);

        generateBtn.classList.remove('loading');
        generateBtn.classList.add('hidden'); // Hide button after starting playback
        audioPlayerDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Generate playlist for WCTR (talk radio)
function generateWCTRPlaylist() {
    const includeAds = includeAdsCheckbox.checked;

    // WCTR stores talk shows as "songs" in the data structure
    // Order them: all Episode 1s (shuffled), then Episode 2s, etc.
    // News is separated and plays after every 2 shows
    const { shows: talkShows, news: newsSegments } = orderWCTREpisodes(currentStation.songs);

    const jingles = [...(currentStation.segments.station_jingle || [])];
    const ads = adsData.map(a => ({...a}));

    generatedPlaylist = [];
    let showsSinceNews = 0;
    let newsIndex = 0;

    for (let i = 0; i < talkShows.length; i++) {
        // Jingle (70% chance)
        if (jingles.length > 0 && Math.random() < 0.7) {
            const jingle = randomPick(jingles);
            generatedPlaylist.push({
                type: 'jingle',
                name: jingle.name,
                segment: jingle
            });
        }

        // Talk show episode
        const show = talkShows[i];
        generatedPlaylist.push({
            type: 'song', // Keep as 'song' type for API URL building
            name: `${show.artists.join(', ')} - ${show.name}`,
            song: show,
            introNum: 0,
            outroNum: 0
        });
        showsSinceNews++;

        // Insert news after every 2 shows
        if (showsSinceNews >= 2 && newsIndex < newsSegments.length) {
            const newsItem = newsSegments[newsIndex];
            generatedPlaylist.push({
                type: 'song',
                name: `${newsItem.artists.join(', ')} - ${newsItem.name}`,
                song: newsItem,
                introNum: 0,
                outroNum: 0
            });
            newsIndex++;
            showsSinceNews = 0;
        }

        // Advertisement (50% chance for talk radio)
        if (includeAds && ads.length > 0 && Math.random() < 0.5) {
            const ad = randomPick(ads);
            if (ad) {
                generatedPlaylist.push({
                    type: 'ad',
                    name: ad.name,
                    ad: ad
                });
            }
        }
    }

    // Add any remaining news segments at the end
    while (newsIndex < newsSegments.length) {
        const newsItem = newsSegments[newsIndex];
        generatedPlaylist.push({
            type: 'song',
            name: `${newsItem.artists.join(', ')} - ${newsItem.name}`,
            song: newsItem,
            introNum: 0,
            outroNum: 0
        });
        newsIndex++;
    }
}

// Order WCTR episodes: Episode 1 of all shows (shuffled), then Episode 2, etc.
// Returns { shows: [...], news: [...] } where news is ordered separately
function orderWCTREpisodes(songs) {
    // Separate news from other shows
    const newsSongs = songs.filter(song => song.name.startsWith('News - '));
    const otherSongs = songs.filter(song => !song.name.startsWith('News - '));

    // Order non-news shows by episode number
    const orderedShows = orderByEpisode(otherSongs);

    // Order news separately by episode number
    const orderedNews = orderByEpisode(newsSongs);

    return { shows: orderedShows, news: orderedNews };
}

// Helper function to order songs by episode number
function orderByEpisode(songs) {
    // Group by episode number
    const episodeGroups = {};

    songs.forEach(song => {
        // Extract episode number from name (e.g., "Episode #1", "Episode #02", "Teaser #1")
        const match = song.name.match(/#(\d+)/);
        const episodeNum = match ? parseInt(match[1]) : 0;

        if (!episodeGroups[episodeNum]) {
            episodeGroups[episodeNum] = [];
        }
        episodeGroups[episodeNum].push({...song});
    });

    // Sort episode numbers and shuffle within each group
    const sortedEpisodeNums = Object.keys(episodeGroups).map(Number).sort((a, b) => a - b);
    const orderedShows = [];

    sortedEpisodeNums.forEach(episodeNum => {
        // Shuffle shows within this episode number
        const shuffled = episodeGroups[episodeNum].sort(() => Math.random() - 0.5);
        orderedShows.push(...shuffled);
    });

    return orderedShows;
}

// Generate playlist for music stations
function generateMusicPlaylist() {
    const includeAds = includeAdsCheckbox.checked;
    const includeWeather = includeWeatherCheckbox.checked;
    const includeBridges = includeBridgesCheckbox.checked;

    // Use ALL songs from the station
    const songs = currentStation.songs.map(s => ({...s}));
    const iterations = songs.length;

    const jingles = [...(currentStation.segments.station_jingle || [])];
    const bridges = [...(currentStation.segments.bridge_announcement || [])];
    const callers = [...(currentStation.segments.caller || [])];
    const weather = [...(currentStation.segments.weather || [])];
    const djTalk = [...(currentStation.segments.dj_talk || [])];
    const story = [...(currentStation.segments.story || [])];
    const ads = adsData.map(a => ({...a}));

    generatedPlaylist = [];

    for (let i = 0; i < iterations && songs.length > 0; i++) {
        // 1. Jingle (optional, ~70% chance)
        if (jingles.length > 0 && Math.random() < 0.7) {
            const jingle = randomPick(jingles);
            generatedPlaylist.push({
                type: 'jingle',
                name: jingle.name,
                segment: jingle
            });
        }

        // 2. One segment before song: Bridge OR Weather OR DJ talk OR Caller OR Story
        const preSongTypes = [];
        if (includeBridges && bridges.length > 0) preSongTypes.push('bridge');
        if (includeWeather && weather.length > 0) preSongTypes.push('weather');
        if (djTalk.length > 0) preSongTypes.push('dj_talk');
        if (callers.length > 0) preSongTypes.push('caller');
        if (story.length > 0) preSongTypes.push('story');

        if (preSongTypes.length > 0) {
            const chosenType = randomChoice(preSongTypes);
            let segment;

            switch (chosenType) {
                case 'bridge':
                    segment = randomPick(bridges);
                    if (segment) {
                        generatedPlaylist.push({
                            type: 'segment',
                            name: `[Bridge] ${segment.name}`,
                            segment: segment,
                            segmentType: 'bridge_announcement'
                        });
                    }
                    break;
                case 'weather':
                    segment = randomPick(weather);
                    if (segment) {
                        generatedPlaylist.push({
                            type: 'segment',
                            name: `[Weather] ${segment.name}`,
                            segment: segment,
                            segmentType: 'weather'
                        });
                    }
                    break;
                case 'dj_talk':
                    segment = randomPick(djTalk);
                    if (segment) {
                        generatedPlaylist.push({
                            type: 'segment',
                            name: `[DJ] ${segment.name}`,
                            segment: segment,
                            segmentType: 'dj_talk'
                        });
                    }
                    break;
                case 'caller':
                    segment = randomPick(callers);
                    if (segment) {
                        generatedPlaylist.push({
                            type: 'segment',
                            name: `[Caller] ${segment.name}`,
                            segment: segment,
                            segmentType: 'caller'
                        });
                    }
                    break;
                case 'story':
                    segment = randomPick(story);
                    if (segment) {
                        generatedPlaylist.push({
                            type: 'segment',
                            name: `[Story] ${segment.name}`,
                            segment: segment,
                            segmentType: 'story'
                        });
                    }
                    break;
            }
        }

        // 3. Song (mandatory)
        const song = randomPick(songs);
        // Random intro/outro including 0 (no intro/outro)
        const introNum = song.intro_count > 0 ? Math.floor(Math.random() * (song.intro_count + 1)) : 0;
        const outroNum = song.outro_count > 0 ? Math.floor(Math.random() * (song.outro_count + 1)) : 0;

        generatedPlaylist.push({
            type: 'song',
            name: `${song.artists.join(', ')} - ${song.name}`,
            song: song,
            introNum: introNum,
            outroNum: outroNum
        });

        // 4. Ad segment after song (35% chance)
        if (includeAds && ads.length > 0 && Math.random() < 0.35) {
            const ad = randomPick(ads);
            if (ad) {
                generatedPlaylist.push({
                    type: 'ad',
                    name: ad.name,
                    ad: ad
                });
            }
        }
    }
}

function updatePreview(stats) {
    previewStats.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${stats.songs}</div>
            <div class="stat-label">Songs</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.jingles}</div>
            <div class="stat-label">Jingles</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.ads}</div>
            <div class="stat-label">Ads</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.segments}</div>
            <div class="stat-label">Segments</div>
        </div>
    `;
    
    previewList.innerHTML = generatedPlaylist.map((item, index) => `
        <div class="preview-item ${item.type}">
            <span class="type-badge">${index + 1}</span>
            <span>${item.name}</span>
        </div>
    `).join('');
    
    previewSection.classList.remove('hidden');
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function downloadM3U() {
    if (generatedPlaylist.length === 0) return;
    
    const basePath = basePathInput.value.trim();
    
    let content = '#EXTM3U\n';
    content += `#PLAYLIST:${currentStation.name}\n\n`;
    
    generatedPlaylist.forEach(item => {
        let path = item.path;
        if (basePath) {
            const cleanBase = basePath.endsWith('/') ? basePath : basePath + '/';
            path = cleanBase + path;
        }
        content += `#EXTINF:-1,${item.name}\n`;
        content += `${path}\n`;
    });
    
    const blob = new Blob([content], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentStation.name.replace(/\s+/g, '_')}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

// Audio Player Functions
function playTrack(index) {
    if (index < 0 || index >= generatedPlaylist.length) return;

    currentTrackIndex = index;
    const track = generatedPlaylist[index];

    // Build API URL
    const url = buildApiUrl(track, currentStation);
    if (!url) {
        console.error('Could not build URL for track:', track);
        playNext();
        return;
    }

    // Update UI
    updateNowPlaying(track);
    updateQueue();

    // Check if this track was preloaded
    if (preloadAudio && preloadedIndex === index) {
        // Use preloaded audio
        audioElement.src = preloadAudio.src;
        audioElement.load();
        audioElement.play().catch(err => {
            console.error('Playback error:', err);
            playNext();
        });
    } else {
        // Load and play audio normally
        audioElement.src = url;
        audioElement.load();
        audioElement.play().catch(err => {
            console.error('Playback error:', err);
            playNext();
        });
    }

    // Preload next track
    preloadNextTrack();
}

// Preload the next track for seamless playback
function preloadNextTrack() {
    const nextIndex = currentTrackIndex + 1;

    // Don't preload if we're at the end (new playlist will be generated)
    if (nextIndex >= generatedPlaylist.length) {
        preloadAudio = null;
        preloadedIndex = -1;
        return;
    }

    const nextTrack = generatedPlaylist[nextIndex];
    const nextUrl = buildApiUrl(nextTrack, currentStation);

    if (!nextUrl) {
        preloadAudio = null;
        preloadedIndex = -1;
        return;
    }

    // Create or reuse preload audio element
    if (!preloadAudio) {
        preloadAudio = new Audio();
        preloadAudio.preload = 'auto';
    }

    preloadAudio.src = nextUrl;
    preloadAudio.load();
    preloadedIndex = nextIndex;
}

function togglePlayPause() {
    if (!audioElement.src) return;

    if (isPlaying) {
        audioElement.pause();
    } else {
        audioElement.play().catch(err => {
            console.error('Play error:', err);
        });
    }
}

function playNext() {
    if (currentTrackIndex < generatedPlaylist.length - 1) {
        playTrack(currentTrackIndex + 1);
    } else {
        // Generate new playlist when current one ends (only in online mode)
        if (currentMode === 'online') {
            generateAndPlay();
        } else {
            // In offline mode, loop back to start
            playTrack(0);
        }
    }
}

function playPrevious() {
    if (currentTrackIndex > 0) {
        playTrack(currentTrackIndex - 1);
    } else {
        // Go to last track
        playTrack(generatedPlaylist.length - 1);
    }
}

function stopAudio() {
    try {
        if (audioElement && audioElement.src) {
            audioElement.pause();
            audioElement.currentTime = 0;
            audioElement.src = '';
            audioElement.load();
        }

        // Clean up preload audio
        if (preloadAudio) {
            preloadAudio.src = '';
            preloadAudio = null;
            preloadedIndex = -1;
        }

        isPlaying = false;
        currentTrackIndex = 0;

        // Reset UI
        if (playIcon && pauseIcon && playPauseBtn) {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            playPauseBtn.title = 'Play';
        }

        // Reset time displays
        if (timeCurrent) timeCurrent.textContent = '0:00';
        if (timeTotal) timeTotal.textContent = '0:00';
        if (seekSlider) seekSlider.value = 0;

        // Reset track info
        if (trackName) trackName.textContent = '-';
        if (trackArtist) trackArtist.textContent = '-';
    } catch (error) {
        console.error('Error stopping audio:', error);
    }
}

function updatePlayPauseButton() {
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        playPauseBtn.title = 'Pause';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        playPauseBtn.title = 'Play';
    }
}

function updateNowPlaying(track) {
    if (track.type === 'song') {
        const parts = track.name.split(' - ');
        trackArtist.textContent = parts[0] || 'Unknown Artist';
        trackName.textContent = parts[1] || track.name;
    } else if (track.type === 'ad') {
        trackArtist.textContent = 'Advertisement';
        trackName.textContent = track.name;
    } else if (track.type === 'jingle') {
        trackArtist.textContent = currentStation.name;
        trackName.textContent = track.name;
    } else if (track.type === 'segment') {
        // Remove [Type] prefix from segment names
        const nameWithoutPrefix = track.name.replace(/^\[.*?\]\s*/, '');
        trackArtist.textContent = currentStation.name;
        trackName.textContent = nameWithoutPrefix;
    } else {
        trackArtist.textContent = currentStation.name;
        trackName.textContent = track.name;
    }
}

function updateQueue() {
    queueCount.textContent = `${generatedPlaylist.length} tracks`;

    // Show next 10 tracks
    const upNext = generatedPlaylist.slice(currentTrackIndex + 1, currentTrackIndex + 11);

    if (upNext.length === 0) {
        queueList.innerHTML = '<div class="queue-item empty">No more tracks</div>';
        return;
    }

    queueList.innerHTML = upNext.map((track, idx) => {
        const actualIndex = currentTrackIndex + 1 + idx;
        let displayName = track.name;

        if (track.type === 'song') {
            displayName = `[Song] ${track.name}`;
        } else if (track.type === 'jingle') {
            displayName = `[Jingle] ${track.name}`;
        } else if (track.type === 'ad') {
            displayName = `[Ad] ${track.name}`;
        }
        // For segments, the name already includes the type prefix like [DJ], [Caller], etc.

        return `
            <div class="queue-item ${track.type}" onclick="playTrack(${actualIndex})">
                <span class="queue-index">${actualIndex + 1}</span>
                <span class="queue-name">${displayName}</span>
            </div>
        `;
    }).join('');
}

// Start
init();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Handle PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Optionally, show your own install button
});
