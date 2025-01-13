import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import EventEmitter from 'events';

const MOOD_TAGS = {
    HIGH: ['electronic', 'energetic', 'coding'],
    MEDIUM: ['ambient', 'focus', 'study'],
    MODERATE: ['classical', 'instrumental', 'calm'],
    LOW: ['lofi', 'chillout', 'relaxing']
};

class LastFmHandler {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.defaultTags = MOOD_TAGS.MEDIUM;
        this.cachedPlaylists = new Map();
    }

    async getMusicByMood(mood) {
        const tags = this.getMoodTags(mood);
        const number = Math.round(Math.random() * (2 - 0) + 0);
        try {
            console.log('Fetching tracks from Last.fm...');
            const response = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${tags[number]}&api_key=${this.apiKey}&format=json&limit=50`
            );
            const data = await response.json();
            
            if (data.error) {
                console.error('Last.fm API Error:', data.message);
                return this.getFallbackPlaylist();
            }

            if (!data || !data.tracks || !data.tracks.track) {
                console.error('Invalid API response structure:', data);
                return this.getFallbackPlaylist();
            }

            const tracks = data.tracks.track.filter(track => 
                track && 
                track.name && 
                track.artist && 
                track.artist.name
            );

            if (tracks.length === 0) {
                console.log('No valid tracks found in API response, using fallback playlist');
                return this.getFallbackPlaylist();
            }

            console.log(`Found ${tracks.length} valid tracks`);
            this.cachedPlaylists.set(tags, tracks);
            return tracks;
        } catch (error) {
            console.error('Error fetching music:', error);
            return this.getFallbackPlaylist();
        }
    }

    getFallbackPlaylist() {
        console.log('Using fallback playlist...');
        return [
            { name: "Lofi Hip Hop", artist: { name: "ChilledCow" } },
            { name: "Deep Focus", artist: { name: "Spotify" } },
            { name: "Coding Mode", artist: { name: "Code Radio" } },
            { name: "Programming Music", artist: { name: "Music for Programming" } },
            { name: "Study Beats", artist: { name: "Study Beat" } }
        ];
    }

    getMoodTags(productivityScore) {
        switch (true) {
            case productivityScore > 80: return MOOD_TAGS.HIGH;
            case productivityScore > 60: return MOOD_TAGS.MEDIUM;
            case productivityScore > 40: return MOOD_TAGS.MODERATE;
            default: return MOOD_TAGS.LOW;
        }
    }
}

class DeveloperProductivityTracker {
    constructor() {
        this.metrics = {
            linesOfCode: 0,
            commitFrequency: 0,
            keystrokes: 0,
            timeSpent: 0
        };
        this.lastUpdate = Date.now();
    }

    updateMetrics(metric, value) {
        this.metrics[metric] += value;
        this.lastUpdate = Date.now();
        return this.analyzeProductivity();
    }

    analyzeProductivity() {
        const productivityScore = 
            (this.metrics.linesOfCode * 0.3) +
            (this.metrics.commitFrequency * 0.3) +
            (this.metrics.keystrokes * 0.2) +
            (this.metrics.timeSpent * 0.2);
        
        return Math.min(100, productivityScore);
    }
}

class DeveloperMusicCompanion extends EventEmitter {
    constructor(apiKey) {
        super();
        if (!apiKey) {
            throw new Error('Last.fm API key is required');
        }
        this.apiKey = apiKey;
        this.productivityTracker = new DeveloperProductivityTracker();
        this.lastFmHandler = new LastFmHandler(apiKey);
        this.currentPlaylist = [];
        this.backupPlaylist = [];
        this.currentTrackIndex = 0;
        this._isPlaying = false;
        this.browser = null;
        this.page = null;
        this.currentTrack = null;
        this.lastScore = 50; // Starting with a neutral score
        this.lastMetricsUpdate = Date.now();
    }

    isPlaying() {
        return this._isPlaying;
    }

    async initialize() {
        try {
            console.log('Initializing browser...');
            this.browser = await puppeteer.launch({
                headless: false,
                executablePath: this.getChromePath(),
                args: ['--autoplay-policy=no-user-gesture-required']
            });

            this.page = await this.browser.newPage();
            console.log('Browser initialized successfully');

            console.log('Loading initial playlist...');
            const defaultTracks = await this.lastFmHandler.getMusicByMood(50);
            this.backupPlaylist = [...defaultTracks];
            this.currentPlaylist = [...defaultTracks];
            this.shufflePlaylist();
            
            return true;
        } catch (error) {
            console.error('Browser initialization error:', error);
            throw error;
        }
    }

    async pause() {
        if (this.page && this._isPlaying) {
            await this.page.evaluate(() => {
                const video = document.querySelector('video');
                if (video) video.pause();
            });
            this._isPlaying = false;
            this.emit('stateChange', { state: 'paused' });
        }
    }

    async resume() {
        if (this.page && !this._isPlaying) {
            await this.page.evaluate(() => {
                const video = document.querySelector('video');
                if (video) video.play();
            });
            this._isPlaying = true;
            this.emit('stateChange', { state: 'playing' });
        }
    }

    async playMusic() {
        if (!this.browser || !this.page) {
            await this.initialize();
        }

        if (this.currentPlaylist.length === 0) {
            this.currentPlaylist = [...this.backupPlaylist];
            this.shufflePlaylist();
            this.currentTrackIndex = 0;
        }

        if (this.currentTrackIndex >= this.currentPlaylist.length) {
            this.currentTrackIndex = 0;
            this.shufflePlaylist();
        }

        const currentTrack = this.currentPlaylist[this.currentTrackIndex];
        if (!currentTrack || !currentTrack.name || !currentTrack.artist || !currentTrack.artist.name) {
            console.error('Invalid track data, skipping...');
            this.currentTrackIndex++;
            return this.playMusic();
        }

        const searchQuery = `${currentTrack.name} ${currentTrack.artist.name}`;
        
        try {
            console.log(`\nSearching for: ${searchQuery}`);
            await this.page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`);
            
            // Wait for and click the first video result
            await this.page.waitForSelector('#video-title');
            await this.page.click('#video-title');

            // Set the video to play in the background
            await this.page.evaluate(() => {
                const video = document.querySelector('video');
                if (video) {
                    video.play();
                }
            });

            this._isPlaying = true;
            this.currentTrack = {
                title: currentTrack.name,
                artist: currentTrack.artist.name,
                mood: this.getCurrentMood()
            };

            this.emit('trackChange', this.currentTrack);

            // Set up the next track to play after this one ends
            const videoDuration = await this.page.evaluate(() => {
                const video = document.querySelector('video');
                return video ? video.duration : 240;
            });

            setTimeout(() => {
                if (this._isPlaying) {
                    this.currentTrackIndex++;
                    this.playMusic();
                }
            }, (videoDuration * 1000) || 4 * 60 * 1000);

        } catch (error) {
            console.error('Error playing track:', error);
            this.currentTrackIndex++;
            return this.playMusic();
        }
    }

    getCurrentMood() {
        const score = this.productivityTracker.analyzeProductivity();
        if (score > 80) return 'Energetic';
        if (score > 60) return 'Focus';
        if (score > 40) return 'Calm';
        return 'Relaxing';
    }

    async skipTrack() {
        console.log('Skipping to next track...');
        this.currentTrackIndex++;
        await this.playMusic();
    }

    async cleanup() {
        this._isPlaying = false;
        if (this.page) {
            await this.page.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
        this.page = null;
        this.browser = null;
        this.emit('stateChange', { state: 'stopped' });
    }

    getChromePath() {
        switch (process.platform) {
            case 'win32':
                return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
            case 'darwin':
                return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
            case 'linux':
                const linuxPaths = [
                    '/usr/bin/google-chrome',
                    '/usr/bin/google-chrome-stable',
                    '/usr/bin/chromium',
                    '/usr/bin/chromium-browser'
                ];
                for (const path of linuxPaths) {
                    if (fs.existsSync(path)) {
                        return path;
                    }
                }
                throw new Error('Chrome not found. Please install Chrome or provide the correct path.');
            default:
                throw new Error('Unsupported platform');
        }
    }

    shufflePlaylist() {
        for (let i = this.currentPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.currentPlaylist[i], this.currentPlaylist[j]] = 
            [this.currentPlaylist[j], this.currentPlaylist[i]];
        }
    }

    updateProductivity(metrics) {
        Object.entries(metrics).forEach(([metric, value]) => {
            const score = this.productivityTracker.updateMetrics(metric, value);
            this.lastMetricsUpdate = Date.now();
            if (Math.abs(this.lastScore - score) > 10) {
                this.updateMusic(score);
            }
            this.lastScore = score;
        });
    }

    async updateMusic(productivityScore) {
        const thirtyMinutes = 30 * 60 * 1000;
        const currentTime = Date.now();
        if (currentTime - this.lastMetricsUpdate < thirtyMinutes) {
            console.log('Metrics updated recently, not changing the music.');
            return;
        }

        console.log(`Current productivity score: ${productivityScore}`);
        const newTracks = await this.lastFmHandler.getMusicByMood(productivityScore);
        this.backupPlaylist = [...newTracks];
        this.currentPlaylist = [
            ...this.currentPlaylist.slice(this.currentTrackIndex),
            ...newTracks
        ];
        
        if (!this._isPlaying) {
            await this.playMusic();
        }
    }
}

export { DeveloperMusicCompanion };