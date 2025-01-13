import * as vscode from 'vscode';
import { DeveloperMusicCompanion } from './music-companion.js';

let musicCompanion;
let statusBarItem;

class MusicCompanionViewProvider {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this._view = undefined;
    }

    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'play':
                    vscode.commands.executeCommand('musicCompanion.playMusic');
                    break;
                case 'skip':
                    vscode.commands.executeCommand('musicCompanion.skipTrack');
                    break;
                case 'stop':
                    vscode.commands.executeCommand('musicCompanion.stopMusic');
                    break;
            }
        });
    }

    updateNowPlaying(trackInfo) {
        if (this._view) {
            this._view.webview.postMessage({ 
                type: 'updateTrack', 
                track: trackInfo 
            });
        }
    }

    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body {
                            padding: 15px;
                            font-family: var(--vscode-font-family);
                            color: var(--vscode-foreground);
                        }
                        .track-info {
                            margin-top: 15px;
                            padding: 10px;
                            border-radius: 4px;
                            background: var(--vscode-editor-background);
                        }
                        .controls {
                            display: flex;
                            gap: 10px;
                            margin-top: 15px;
                        }
                        button {
                            padding: 5px 10px;
                            background: var(--vscode-button-background);
                            color: var(--vscode-button-foreground);
                            border: none;
                            border-radius: 3px;
                            cursor: pointer;
                        }
                        button:hover {
                            background: var(--vscode-button-hoverBackground);
                        }
                        .mood {
                            margin-top: 15px;
                            font-size: 0.9em;
                            color: var(--vscode-descriptionForeground);
                        }
                    </style>
                </head>
                <body>
                    <h3>Music Companion</h3>
                    <div id="track-info" class="track-info">
                        Waiting for music...
                    </div>
                    <div class="controls">
                        <button onclick="play()">Play/Pause</button>
                        <button onclick="skip()">Skip</button>
                        <button onclick="stop()">Stop</button>
                    </div>
                    <div id="mood" class="mood"></div>
                    <script>
                        const vscode = acquireVsCodeApi();
                        
                        window.addEventListener('message', event => {
                            const message = event.data;
                            if (message.type === 'updateTrack') {
                                document.getElementById('track-info').innerHTML = 
                                    \`\${message.track.title}<br>by \${message.track.artist}\`;
                                if (message.track.mood) {
                                    document.getElementById('mood').textContent = 
                                        \`Current mood: \${message.track.mood}\`;
                                }
                            }
                        });

                        function play() {
                            vscode.postMessage({ command: 'play' });
                        }

                        function skip() {
                            vscode.postMessage({ command: 'skip' });
                        }

                        function stop() {
                            vscode.postMessage({ command: 'stop' });
                        }
                    </script>
                </body>
            </html>`;
    }
}

async function checkAndConfigureApiKey() {
    const config = vscode.workspace.getConfiguration('musicCompanion');
    let apiKey = config.get('lastfmApiKey');
    
    if (!apiKey) {
        const response = await vscode.window.showInformationMessage(
            'Welcome to Music Companion! To get started, you\'ll need a Last.fm API key.',
            'Get API Key',
            'I Have a Key',
            'Later'
        );

        if (response === 'Get API Key') {
            vscode.env.openExternal(vscode.Uri.parse('https://www.last.fm/api/account/create'));
            const configureNow = await vscode.window.showInformationMessage(
                'After getting your API key, come back and configure it in the settings.',
                'Configure Now'
            );
            if (configureNow === 'Configure Now') {
                return await promptForApiKey(config);
            }
        } else if (response === 'I Have a Key') {
            return await promptForApiKey(config);
        }
        return null;
    }
    return apiKey;
}

async function promptForApiKey(config) {
    const key = await vscode.window.showInputBox({
        prompt: 'Enter your Last.fm API Key',
        placeHolder: 'Your API Key here',
        ignoreFocusOut: true,
        validateInput: text => {
            return text && text.length > 20 ? null : 'Please enter a valid API key';
        }
    });

    if (key) {
        await config.update('lastfmApiKey', key, true);
        vscode.window.showInformationMessage('API key configured successfully! Starting music companion...');
        return key;
    }
    return null;
}

async function initializeMusicCompanion(apiKey, provider) {
    try {
        if (musicCompanion) {
            await musicCompanion.cleanup();
        }

        musicCompanion = new DeveloperMusicCompanion(apiKey);
        
        musicCompanion.on('trackChange', (trackInfo) => {
            provider.updateNowPlaying(trackInfo);
            if (statusBarItem) {
                statusBarItem.text = `$(music) ${trackInfo.title}`;
                statusBarItem.tooltip = `by ${trackInfo.artist}`;
            }
        });

        const config = vscode.workspace.getConfiguration('musicCompanion');
        if (config.get('autoStart')) {
            await musicCompanion.initialize();
            await musicCompanion.playMusic();
        }

        return true;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to initialize Music Companion: ${error.message}`);
        return false;
    }
}

export async function activate(context) {
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(music) Music Companion';
    statusBarItem.tooltip = 'Click to show music controls';
    statusBarItem.command = 'musicCompanion.showMusicControls';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register the view provider
    const provider = new MusicCompanionViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('music-companion-controls', provider)
    );

    // Check if this is the first activation
    const config = vscode.workspace.getConfiguration('musicCompanion');
    const isFirstRun = !config.get('lastfmApiKey');
    
    if (isFirstRun) {
        const apiKey = await checkAndConfigureApiKey();
        if (apiKey) {
            await initializeMusicCompanion(apiKey, provider);
        }
    } else {
        const apiKey = await checkAndConfigureApiKey();
        if (apiKey) {
            await initializeMusicCompanion(apiKey, provider);
        }
    }

    // Register commands
    let disposables = [
        vscode.commands.registerCommand('musicCompanion.showMusicControls', () => {
            vscode.commands.executeCommand('workbench.view.extension.music-companion');
        }),

        vscode.commands.registerCommand('musicCompanion.skipTrack', () => {
            if (musicCompanion) {
                musicCompanion.skipTrack();
            }
        }),

        vscode.commands.registerCommand('musicCompanion.playMusic', async () => {
            if (!musicCompanion) {
                const key = await checkAndConfigureApiKey();
                if (key) {
                    await initializeMusicCompanion(key, provider);
                }
                return;
            }

            if (!musicCompanion.isPlaying()) {
                await musicCompanion.playMusic();
            } else {
                musicCompanion.resume();
            }
        }),

        vscode.commands.registerCommand('musicCompanion.pauseMusic', () => {
            if (musicCompanion) {
                musicCompanion.pause();
            }
        }),

        vscode.commands.registerCommand('musicCompanion.stopMusic', async () => {
            if (musicCompanion) {
                await musicCompanion.cleanup();
                if (statusBarItem) {
                    statusBarItem.text = '$(music) Music Companion';
                    statusBarItem.tooltip = 'Click to show music controls';
                }
            }
        })
    ];

    context.subscriptions.push(...disposables);

    // Log extension activation
    console.log('Music Companion is now active!');
}

export function deactivate() {
    if (musicCompanion) {
        musicCompanion.cleanup();
    }
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}