# Developer Music Companion VS Code Extension

A VS Code extension that provides adaptive background music based on your coding activity. The music selection adapts to your productivity patterns to enhance your coding experience.

## Features

- Adaptive music playback based on coding metrics
- Keyboard shortcuts for easy control
- Integrates with Last.fm for music selection
- Automatically adjusts music based on your coding activity

## Installation

1. Install the extension from the VS Code marketplace
2. Configure your Last.fm API key in Settings
3. Restart VS Code

## Keyboard Shortcuts

- Skip Track: `Ctrl+Alt+S` (Windows/Linux) or `Cmd+Alt+S` (Mac)
- Play/Pause: `Ctrl+Alt+P` (Windows/Linux) or `Cmd+Alt+P` (Mac)
- Stop: `Ctrl+Alt+X` (Windows/Linux) or `Cmd+Alt+X` (Mac)

## Commands

All commands are available in the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- `Music Companion: Skip Track`
- `Music Companion: Play Music`
- `Music Companion: Stop Music`

## Requirements

- VS Code 1.60.0 or higher
- Internet connection for Last.fm API access
- Chrome or Chromium browser installed


Based on your README.md file and the available information, I can help you publish your Developer Music Companion extension to the Visual Studio Marketplace. Here's a step-by-step guide: [1]

First, install the vsce (Visual Studio Code Extensions) packaging tool:

npm install -g vsce

Copy

Insert at cursor
bash
Make sure your extension's package.json has all the required fields:

{
    "name": "developer-music-companion",
    "displayName": "Developer Music Companion",
    "description": "Adaptive background music based on your coding activity",
    "version": "1.0.0",
    "publisher": "your-publisher-name",
    "engines": {
        "vscode": "^1.60.0"
    },
    "categories": ["Other"],
    "repository": {
        "type": "git",
        "url": "YOUR_REPOSITORY_URL"
    }
}

Copy

Insert at cursor
json
Create a publisher account on the Visual Studio Marketplace if you haven't already. You'll need to sign in with either a Microsoft or Azure DevOps account.

Once you've created your publisher account, you'll receive a Personal Access Token (PAT). Create one with the "Marketplace Publishing" scope.

Login to vsce with your publisher account:

vsce login <publisher-name>

Copy

Insert at cursor
bash
Package your extension:

vsce package

Copy

Insert at cursor
bash
This will create a .vsix file.

Publish your extension:

vsce publish

Copy

Insert at cursor
bash
Additional tips:

Make sure you have a good README.md file (which you already have)

Include a license file if you haven't already

Add some screenshots or GIFs demonstrating your extension

Consider adding an icon for your extension

Test your extension thoroughly before publishing

After publishing, your extension should be available in the VS Code marketplace within a few minutes. Users will be able to find it by searching for "Developer Music Companion" in the VS Code extensions tab.

Remember to increment your version number in package.json when you publish updates to your extension.