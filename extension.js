const vscode = require('vscode');
const { DeveloperMusicCompanion } = require('./src/index.js');

let musicCompanion;

function activate(context) {
    // Initialize the music companion
    musicCompanion = initializeMusicCompanion();

    // Register commands
    let disposables = [
        vscode.commands.registerCommand('musiccompanion.skip', () => {
            musicCompanion.skipTrack();
        }),
        vscode.commands.registerCommand('musiccompanion.play', () => {
            musicCompanion.playMusic();
        }),
        vscode.commands.registerCommand('musiccompanion.stop', async () => {
            await musicCompanion.cleanup();
        })
    ];

    context.subscriptions.push(...disposables);
}

function deactivate() {
    if (musicCompanion) {
        musicCompanion.cleanup();
    }
}

module.exports = {
    activate,
    deactivate
};