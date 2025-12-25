// GTA San Andreas Radio Playlist Generator

let stationsData = [];
let adsData = [];
let generatedPlaylist = [];
let currentStation = null;

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
    'sfur': 'sfurwebpg'
};

// DOM Elements
const stationGrid = document.getElementById('station-grid');
const selectedStationDiv = document.getElementById('selected-station');
const selectedNameSpan = document.getElementById('selected-name');
const basePathInput = document.getElementById('base-path');
const includeAdsCheckbox = document.getElementById('include-ads');
const includeWeatherCheckbox = document.getElementById('include-weather');
const includeBridgesCheckbox = document.getElementById('include-bridges');
const generateBtn = document.getElementById('generate-btn');
const previewSection = document.getElementById('preview');
const previewStats = document.getElementById('preview-stats');
const previewList = document.getElementById('preview-list');
const downloadBtn = document.getElementById('download-btn');
const bgOptions = document.querySelectorAll('.bg-option');

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
        setupBackgroundSelector();
        
    } catch (error) {
        console.error('Failed to load data:', error);
        alert('Failed to load radio data. Please ensure data.json and ads.json are present.');
    }
}

function populateStationGrid() {
    // Filter out talk radio (WCTR)
    const musicStations = stationsData.filter(s => s.key !== 'wctr');
    
    stationGrid.innerHTML = '';
    
    musicStations.forEach(station => {
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

function setupBackgroundSelector() {
    bgOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Update active state
            bgOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            
            // Change background
            const bgName = option.dataset.bg;
            document.body.style.setProperty('--bg-image', `url('assets/bgs/${bgName}.png')`);
            document.body.style.cssText = ``;
            
            // Update the ::before pseudo-element via a style injection
            updateBackground(bgName);
        });
    });
}

function updateBackground(bgName) {
    // Remove existing dynamic style if present
    let styleEl = document.getElementById('dynamic-bg');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-bg';
        document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
        body::before {
            background-image: url('assets/bgs/${bgName}.png') !important;
        }
    `;
}

function setupEventListeners() {
    // Station selection via grid
    stationGrid.addEventListener('click', (e) => {
        const stationIcon = e.target.closest('.station-icon');
        if (!stationIcon) return;
        
        // Update selection UI
        document.querySelectorAll('.station-icon').forEach(s => s.classList.remove('selected'));
        stationIcon.classList.add('selected');
        
        // Set current station
        const stationKey = stationIcon.dataset.station;
        currentStation = stationsData.find(s => s.key === stationKey);
        
        // Update selected display
        selectedNameSpan.textContent = currentStation.name;
        selectedStationDiv.classList.remove('hidden');
        
        // Enable generate button
        generateBtn.disabled = false;
        
        // Hide preview if showing
        previewSection.classList.add('hidden');
    });
    
    generateBtn.addEventListener('click', generatePlaylist);
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
    const filename = `${ad.name}.ogg`;
    return `advertisements/${filename}`;
}

// Generate playlist - uses all available songs
function generatePlaylist() {
    if (!currentStation) return;
    
    generateBtn.classList.add('loading');
    
    setTimeout(() => {
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
                    path: buildSegmentPath(jingle, currentStation)
                });
                stats.jingles++;
            }
            
            // 2. Bridge announcement (rare, ~8% chance)
            if (includeBridges && bridges.length > 0 && Math.random() < 0.08) {
                const bridge = randomPick(bridges);
                generatedPlaylist.push({
                    type: 'segment',
                    name: `[Bridge] ${bridge.name}`,
                    path: buildSegmentPath(bridge, currentStation)
                });
                stats.segments++;
            }
            
            // 3. Song (mandatory)
            const song = randomPick(songs);
            const introNum = song.intro_count > 0 ? Math.floor(Math.random() * song.intro_count) + 1 : 0;
            const outroNum = song.outro_count > 0 ? Math.floor(Math.random() * song.outro_count) + 1 : 0;
            
            generatedPlaylist.push({
                type: 'song',
                name: `${song.artists.join(', ')} - ${song.name}`,
                path: buildSongPath(song, currentStation, introNum, outroNum)
            });
            stats.songs++;
            
            // 4. One extra segment after song
            const segmentTypes = [];
            if (djTalk.length > 0) segmentTypes.push('dj_talk');
            if (callers.length > 0) segmentTypes.push('caller');
            if (story.length > 0) segmentTypes.push('story');
            if (includeWeather && weather.length > 0) segmentTypes.push('weather');
            if (includeAds && ads.length > 0) segmentTypes.push('ad');
            
            if (segmentTypes.length > 0) {
                let chosenType;
                if (includeAds && ads.length > 0 && Math.random() < 0.2) {
                    chosenType = 'ad';
                } else {
                    const nonAdTypes = segmentTypes.filter(t => t !== 'ad');
                    if (nonAdTypes.length > 0) {
                        chosenType = randomChoice(nonAdTypes);
                    } else if (segmentTypes.includes('ad')) {
                        chosenType = 'ad';
                    }
                }
                
                if (chosenType) {
                    let segment;
                    switch (chosenType) {
                        case 'ad':
                            segment = randomPick(ads);
                            if (segment) {
                                generatedPlaylist.push({
                                    type: 'ad',
                                    name: segment.name,
                                    path: buildAdPath(segment)
                                });
                                stats.ads++;
                            }
                            break;
                        case 'dj_talk':
                            segment = randomPick(djTalk);
                            if (segment) {
                                generatedPlaylist.push({
                                    type: 'segment',
                                    name: `[DJ] ${segment.name}`,
                                    path: buildSegmentPath(segment, currentStation)
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
                                    path: buildSegmentPath(segment, currentStation)
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
                                    path: buildSegmentPath(segment, currentStation)
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
                                    path: buildSegmentPath(segment, currentStation)
                                });
                                stats.segments++;
                            }
                            break;
                    }
                }
            }
        }
        
        updatePreview(stats);
        generateBtn.classList.remove('loading');
    }, 100);
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
