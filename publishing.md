# Publishing the Developer Music Companion Extension

To publish your VS Code extension to the marketplace, follow these steps:

1. Install vsce (Visual Studio Code Extensions) if you haven't already:
```bash
npm install -g @vscode/vsce
```

2. Log in to the marketplace:
```bash
vsce login vitalismutwiri
```

3. Package your extension:
```bash
vsce package
```
This will create a .vsix file (e.g., dev-music-companion-1.0.0.vsix)

4. Publish your extension:
```bash
vsce publish
```

## Pre-publishing Checklist
Your extension appears ready for publishing with:
- ✅ Proper package.json configuration
- ✅ Clear README.md with features and usage instructions
- ✅ Version number set (1.0.0)
- ✅ Display name and description set
- ✅ Required VS Code engine version specified
- ✅ All dependencies listed

## Next Steps
1. Make sure you have a Personal Access Token (PAT) from Azure DevOps with proper marketplace publishing permissions
2. Use the token when logging in with vsce
3. After publishing, your extension will be available at: https://marketplace.visualstudio.com/publishers/vitalismutwiri

## Important Files for Publishing
- package.json: Contains extension metadata
- README.md: User documentation
- extension.js: Main extension code