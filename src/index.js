import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import puppeteer from 'puppeteer-core';
import fs from 'fs';

// Get the current file's directory and construct the path to .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

// Load the .env file from the correct path
dotenv.config({ path: envPath });

// Add debug logging to verify the API key
console.log('Looking for .env file at:', envPath);
console.log('API Key found:', process.env.LAST_FM_API_KEY ? 'Yes' : 'No');

// Verify API key is loaded
const API_KEY = process.env.LAST_FM_API_KEY;
if (!API_KEY) {
    console.error('Error: LAST_FM_API_KEY not found in .env file');
    console.error('Please make sure:');
    console.error('1. The .env file exists at:', envPath);
    console.error('2. The file contains: LAST_FM_API_KEY=your_api_key_here');
    console.error('3. There are no spaces around the = sign');
    process.exit(1);
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

class LastFmHandler {
  constructor(apiKey) {
      this.apiKey = apiKey;
      this.defaultTags = 'coding,programming,focus';
      this.cachedPlaylists = new Map();
  }

  async getMusicByMood(mood) {
      const tags = this.getMoodTags(mood);
      
      if (this.cachedPlaylists.has(tags)) {
          return this.cachedPlaylists.get(tags);
      }

      try {
          console.log('Fetching tracks from Last.fm...');
          const response = await fetch(
              `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${tags}&api_key=${this.apiKey}&format=json&limit=50`
          );
          const data = await response.json();
          
          // Debug: Log the API response
          console.log('API Response:', JSON.stringify(data, null, 2));

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
      if (productivityScore > 80) return 'electronic,energetic,coding';
      if (productivityScore > 60) return 'ambient,focus,study';
      if (productivityScore > 40) return 'classical,instrumental,calm';
      return 'lofi,chillout,relaxing';
  }
}

class DeveloperMusicCompanion {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Last.fm API key is required');
        }
        this.productivityTracker = new DeveloperProductivityTracker();
        this.lastFmHandler = new LastFmHandler(apiKey);
        this.currentPlaylist = [];
        this.backupPlaylist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.browser = null;
        this.page = null;
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
            
            console.log('Starting music playback...');
            await this.playMusic();
        } catch (error) {
            console.error('Browser initialization error:', error);
            throw error;
        }
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

    async updateProductivity(metrics) {
        let score = 0;
        Object.entries(metrics).forEach(([metric, value]) => {
            score = this.productivityTracker.updateMetrics(metric, value);
        });

        if (Math.abs(this.lastScore - score) > 10) {
            await this.updateMusic(score);
        }
        this.lastScore = score;
    }

    async updateMusic(productivityScore) {
        console.log(`Current productivity score: ${productivityScore}`);
        const newTracks = await this.lastFmHandler.getMusicByMood(productivityScore);
        this.backupPlaylist = [...newTracks];
        this.currentPlaylist = [
            ...this.currentPlaylist.slice(this.currentTrackIndex),
            ...newTracks
        ];
        
        if (!this.isPlaying) {
            await this.playMusic();
        }
    }

    async playMusic() {
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

            // Wait for video player to load
            await this.page.waitForSelector('.html5-video-player');
            
            // Wait for and click the play button if video doesn't autoplay
            try {
                await this.page.waitForSelector('.ytp-play-button', { timeout: 2000 });
                const playButton = await this.page.$('.ytp-play-button');
                if (playButton) {
                    await playButton.click();
                }
            } catch (e) {
                console.log('Video likely autoplayed, continuing...');
            }

            console.log(`Now playing: ${currentTrack.name} by ${currentTrack.artist.name}`);
            console.log('Next up:');
            
            for (let i = 1; i <= 3; i++) {
                const nextIndex = (this.currentTrackIndex + i) % this.currentPlaylist.length;
                const track = this.currentPlaylist[nextIndex];
                if (track && track.name && track.artist) {
                    console.log(`${i}. ${track.name} by ${track.artist.name}`);
                }
            }

            this.isPlaying = true;
            this.currentTrackIndex++;

            // Get video duration and set timeout accordingly
            const videoDuration = await this.page.evaluate(() => {
                const video = document.querySelector('video');
                return video ? video.duration : 240; // Default to 4 minutes if duration cannot be determined
            });

            setTimeout(() => {
                this.playMusic();
            }, (videoDuration * 1000) || 4 * 60 * 1000); // Use actual duration or fallback to 4 minutes
        } catch (error) {
            console.error('Error playing track:', error);
            this.skipTrack();
        }
    }

    async skipTrack() {
        console.log('Skipping to next track...');
        // Try to stop the current video if it's playing
        try {
            await this.page.evaluate(() => {
                const video = document.querySelector('video');
                if (video) {
                    video.pause();
                }
            });
        } catch (e) {
            console.log('Could not pause current video, continuing to next track...');
        }
        await this.playMusic();
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

async function initializeMusicCompanion() {
    try {
        console.log('Starting Music Companion...');
        const musicCompanion = new DeveloperMusicCompanion(API_KEY);
        await musicCompanion.initialize();
        return musicCompanion;
    } catch (error) {
        console.error('Failed to initialize Music Companion:', error);
        throw error;
    }
}

async function testLastFmApi() {
  console.log('Testing Last.fm API...');
  const apiKey = process.env.LAST_FM_API_KEY;
  
  try {
      const response = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=rock&api_key=${apiKey}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data.error) {
          console.error('API Error:', data.message);
          return false;
      }
      
      console.log('API Test Response:', JSON.stringify(data, null, 2));
      return true;
  } catch (error) {
      console.error('API Test Error:', error);
      return false;
  }
}


async function main() {
    try {
      console.log('Testing Last.fm API connection...');
      const apiTestResult = await testLastFmApi();
      
      if (!apiTestResult) {
          console.error('Last.fm API test failed. Please check your API key.');
          process.exit(1);
      }

      console.log('API test successful, initializing music companion...');
      const musicCompanion = await initializeMusicCompanion();
   
        
        const metrics = {
            linesOfCode: 50,
            commitFrequency: 2,
            keystrokes: 500,
            timeSpent: 30
        };

        await musicCompanion.updateProductivity(metrics);

        process.on('SIGINT', async () => {
            console.log('\nCleaning up...');
            await musicCompanion.cleanup();
            process.exit();
        });

        setInterval(async () => {
            const newMetrics = {
                linesOfCode: Math.floor(Math.random() * 100),
                commitFrequency: Math.floor(Math.random() * 5),
                keystrokes: Math.floor(Math.random() * 1000),
                timeSpent: 5
            };
            await musicCompanion.updateProductivity(newMetrics);
        }, 5 * 60 * 1000);

        // Handle keyboard shortcuts through VS Code extension
        process.stdin.on('data', (data) => {
            const command = data.toString().trim().toLowerCase();
            switch (command) {
                case 'skip':
                    musicCompanion.skipTrack();
                    break;
                case 'play':
                    musicCompanion.playMusic();
                    break;
                case 'stop':
                    musicCompanion.cleanup();
                    break;
            }
        });

        console.log('\nMusic Companion is running! Type "skip" and press Enter to skip tracks.');
        console.log('Press Ctrl+C to exit.');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main().catch(console.error);
