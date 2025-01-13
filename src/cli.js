import { DeveloperMusicCompanion } from './music-companion.js';

async function main() {
    try {
        // You can pass your Last.fm API key directly here for testing
        const API_KEY = process.env.LAST_FM_API_KEY;
        if (!API_KEY) {
            console.error('Please set LAST_FM_API_KEY environment variable');
            process.exit(1);
        }

        console.log('Starting Music Companion...');
        const musicCompanion = new DeveloperMusicCompanion(API_KEY);
        
        await musicCompanion.initialize();
        await musicCompanion.playMusic();

        // Handle keyboard controls
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', async (data) => {
            const key = data.toString();
            
            if (key === '\u0003') { // Ctrl+C
                console.log('\nStopping Music Companion...');
                await musicCompanion.cleanup();
                process.exit();
            } else if (key === 's') {
                console.log('\nSkipping track...');
                await musicCompanion.skipTrack();
            } else if (key === 'p') {
                if (musicCompanion.isPlaying()) {
                    console.log('\nPausing...');
                    await musicCompanion.pause();
                } else {
                    console.log('\nResuming...');
                    await musicCompanion.resume();
                }
            }
        });

        console.log('\nControls:');
        console.log('p - Play/Pause');
        console.log('s - Skip Track');
        console.log('Ctrl+C - Exit');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main().catch(console.error);