# Developer Music Companion

A VS Code extension that provides adaptive background music based on your coding activity. The music selection adapts to your productivity patterns to enhance your coding experience.

## Requirements

- VS Code 1.60.0 or higher
- Google Chrome or Chromium browser installed
- Last.fm API key (free)
- Internet connection

## Installation

1. Install the extension from the VS Code marketplace
2. You'll be prompted to configure your Last.fm API key on first use
   - If you don't have a key, the extension will guide you to create one
   - If you have a key, you can enter it directly

## Features

- Adaptive music playback based on coding metrics
- Keyboard shortcuts for easy control
- Integrates with Last.fm for music selection
- Automatically adjusts music based on your coding activity
- Shows current track in status bar and sidebar

## Getting Started

1. After installation, click "Get API Key" in the welcome message
2. Create a free Last.fm account and get your API key
3. Enter the API key when prompted
4. The extension will automatically start playing music

## Controls

Keyboard Shortcuts:
- Skip Track: `Ctrl+Alt+S` (Windows/Linux) or `Cmd+Alt+S` (Mac)
- Play/Pause: `Ctrl+Alt+P` (Windows/Linux) or `Cmd+Alt+P` (Mac)
- Stop: `Ctrl+Alt+X` (Windows/Linux) or `Cmd+Alt+X` (Mac)

You can also control playback from:
- The status bar icon
- The sidebar view
- The command palette

## Configuration

Settings available in VS Code:
- `musicCompanion.lastfmApiKey`: Your Last.fm API key
- `musicCompanion.autoStart`: Automatically start music when VS Code launches
- `musicCompanion.defaultMood`: Default mood for music selection

## Troubleshooting

1. If music doesn't play:
   - Check that Chrome/Chromium is installed
   - Verify your internet connection
   - Ensure your Last.fm API key is correct

2. If the extension doesn't activate:
   - Try reloading VS Code
   - Check the extension is enabled
   - Verify VS Code version is 1.60.0 or higher

## Privacy

- Your Last.fm API key is stored securely in VS Code settings
- No personal data is collected or transmitted
- Music playback occurs locally through your browser

## License

MIT License - see LICENSE file for details.

## Support

If you encounter any issues or have suggestions:
1. Check the troubleshooting guide
2. Visit our GitHub repository
3. Submit an issue on GitHub