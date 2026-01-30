// Track data
const tracks = [
    { id: 1, title: "Liput myyty ja salkoon", file: "01_Liput_myyty_ja_salkoon", display: "Liput myyty ja salkoon" },
    { id: 2, title: "Matti se osti nahkarotsin", file: "02_Matti_se_osti_nahkarotsin", display: "Matti se osti nahkarotsin" },
    { id: 3, title: "Mä tarvin kapellimestarin", file: "03_Ma_tarvin_kapellimestarin", display: "Mä tarvin kapellimestarin" },
    { id: 4, title: "Tuo amore, tua luce", file: "04_Tuo_amore_tua_luce", display: "Tuo amore, tua luce" },
    { id: 5, title: "Ei mainoksia", file: "05_Ei_mainoksia", display: "Ei mainoksia" },
    { id: 6, title: "Kolhoosin käytävillä", file: "06_Kolhoosin_kaytavilla", display: "Kolhoosin käytävillä" },
    { id: 7, title: "Välimatka", file: "07_Valimatka", display: "Välimatka" },
    { id: 8, title: "Kiidä, Eldorado!", file: "08_Kiida_Eldorado", display: "Kiidä, Eldorado!" },
    { id: 9, title: "Tervajuoksu", file: "09_Tervajuoksu", display: "Tervajuoksu" },
    { id: 10, title: "Narvan marssi", file: "10_Narvan_marssi", display: "Narvan marssi" }
];

// Preloaded images cache
const imageCache = new Map();

// DOM Elements
const audioPlayer = document.getElementById('audioPlayer');
const albumArt = document.getElementById('albumArt');
const backgroundBlur = document.getElementById('backgroundBlur');
const trackTitle = document.getElementById('trackTitle');
const trackNumber = document.getElementById('trackNumber');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const artworkContainer = document.getElementById('artworkContainer');
const swipeHint = document.getElementById('swipeHint');

// State
let currentTrackIndex = 0;
let isPlaying = false;
let pendingPlay = false;
let isDragging = false;
let startX = 0;
let currentX = 0;

// Preload all images on startup
function preloadImages() {
    tracks.forEach(track => {
        const img = new Image();
        img.src = `images/${track.file}.jpg`;
        imageCache.set(track.file, img);
    });
}

// Initialize
function init() {
    preloadImages();
    loadTrack(currentTrackIndex);
    setupEventListeners();
    setupMediaSession();
    checkUrlHash();
    
    setTimeout(() => {
        swipeHint.style.opacity = '0';
    }, 5000);
}

// Load track
function loadTrack(index) {
    const track = tracks[index];
    const audioPath = `audio/${track.file}.m4a`;
    const imagePath = `images/${track.file}.jpg`;
    
    // Use cached image
    const cachedImg = imageCache.get(track.file);
    if (cachedImg && cachedImg.complete) {
        albumArt.src = cachedImg.src;
    } else {
        albumArt.src = imagePath;
    }
    
    backgroundBlur.style.backgroundImage = `url(${imagePath})`;
    trackTitle.textContent = track.display;
    trackNumber.textContent = `${index + 1} / ${tracks.length}`;
    
    // Load audio
    audioPlayer.src = audioPath;
    
    // Update button states
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === tracks.length - 1;
    
    // Update URL hash
    window.location.hash = `track=${index + 1}`;
    
    // Update Media Session
    updateMediaSession(track);
    
    // Reset progress
    progressBar.style.width = '0%';
    currentTimeEl.textContent = '0:00';
}

// Play
function play() {
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isPlaying = true;
            pendingPlay = false;
            updatePlayButton();
        }).catch(err => {
            console.log('Play failed, will retry:', err);
            pendingPlay = true;
        });
    }
}

// Pause
function pause() {
    audioPlayer.pause();
    isPlaying = false;
    pendingPlay = false;
    updatePlayButton();
}

// Toggle Play/Pause
function togglePlay() {
    if (isPlaying) {
        pause();
    } else {
        play();
    }
}

function updatePlayButton() {
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
    
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
}

// Navigation
function prevTrack() {
    if (currentTrackIndex > 0) {
        const wasPlaying = isPlaying;
        audioPlayer.pause();
        currentTrackIndex--;
        loadTrack(currentTrackIndex);
        if (wasPlaying) {
            pendingPlay = true;
            play();
        }
    }
}

function nextTrack() {
    if (currentTrackIndex < tracks.length - 1) {
        const wasPlaying = isPlaying;
        audioPlayer.pause();
        currentTrackIndex++;
        loadTrack(currentTrackIndex);
        if (wasPlaying) {
            pendingPlay = true;
            play();
        }
    }
}

// Auto-advance when track ends
function autoNextTrack() {
    if (currentTrackIndex < tracks.length - 1) {
        currentTrackIndex++;
        loadTrack(currentTrackIndex);
        pendingPlay = true;
        play();
    } else {
        isPlaying = false;
        updatePlayButton();
    }
}

// Time formatting
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update progress
function updateProgress() {
    if (audioPlayer.duration) {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = `${progress}%`;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
}

// Seek
function seek(e) {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = percent * audioPlayer.duration;
}

// Swipe handling
function handleTouchStart(e) {
    isDragging = true;
    startX = e.touches[0].clientX;
    currentX = startX;
    albumArt.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    albumArt.style.transform = `translateX(${diff * 0.3}px) scale(0.95)`;
}

function handleTouchEnd() {
    if (!isDragging) return;
    isDragging = false;
    albumArt.classList.remove('dragging');
    albumArt.style.transform = '';
    
    const diff = currentX - startX;
    const threshold = 80;
    
    if (diff > threshold && currentTrackIndex > 0) {
        prevTrack();
    } else if (diff < -threshold && currentTrackIndex < tracks.length - 1) {
        nextTrack();
    }
}

// Media Session API
function setupMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', play);
        navigator.mediaSession.setActionHandler('pause', pause);
        navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
        navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            audioPlayer.currentTime = details.seekTime;
        });
    }
}

function updateMediaSession(track) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.display,
            artist: 'Matti Manninen',
            album: 'Manninen',
            artwork: [
                { src: `images/${track.file}.jpg`, sizes: '512x512', type: 'image/jpeg' }
            ]
        });
    }
}

// URL hash handling
function checkUrlHash() {
    const hash = window.location.hash;
    const match = hash.match(/track=(\d+)/);
    if (match) {
        const trackNum = parseInt(match[1]) - 1;
        if (trackNum >= 0 && trackNum < tracks.length) {
            currentTrackIndex = trackNum;
            loadTrack(currentTrackIndex);
        }
    }
}

// Event Listeners
function setupEventListeners() {
    // Retry play when audio is ready
    audioPlayer.addEventListener('canplay', () => {
        if (pendingPlay) {
            play();
        }
    });
    
    audioPlayer.addEventListener('timeupdate', updateProgress);
    
    audioPlayer.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audioPlayer.duration);
    });
    
    audioPlayer.addEventListener('ended', autoNextTrack);
    
    // Sync state with actual audio
    audioPlayer.addEventListener('playing', () => {
        isPlaying = true;
        pendingPlay = false;
        updatePlayButton();
    });
    
    audioPlayer.addEventListener('pause', () => {
        if (!pendingPlay) {
            isPlaying = false;
            updatePlayButton();
        }
    });
    
    // Controls
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    
    // Progress bar
    progressContainer.addEventListener('click', seek);
    
    // Touch/Swipe
    artworkContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    artworkContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
    artworkContainer.addEventListener('touchend', handleTouchEnd);
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowLeft':
                prevTrack();
                break;
            case 'ArrowRight':
                nextTrack();
                break;
        }
    });
    
    // Hash change
    window.addEventListener('hashchange', checkUrlHash);
}

// Start
init();
