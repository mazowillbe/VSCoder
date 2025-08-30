# Gemini AI Assistant - VS Code Extension

A VS Code extension that provides an AI-powered coding assistant using Google's Gemini AI through Genkit. This extension offers a chat interface similar to Copilot Chat with powerful workspace tools.

## Features

- 🤖 **AI Chat Interface**: Clean, modern chat UI integrated with VS Code's theme
- 🛠️ **Workspace Tools**: Read, create, and modify files with AI assistance
- 🔍 **Smart Search**: Search through your workspace files
- ⚡ **VS Code Integration**: Run VS Code commands and manage editors
- 🛡️ **Safety First**: All destructive operations require user confirmation

## Prerequisites

- VS Code 1.74.0 or higher
- Node.js 16.x or higher
- Google Gemini API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gemini-vscode-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your Gemini API key**
   
   You need to set the `GEMINI_API_KEY` environment variable. You can do this in several ways:
   
   **Option A: Environment variable**
   ```bash
   # Windows (PowerShell)
   $env:GEMINI_API_KEY="your-api-key-here"
   
   # Windows (Command Prompt)
   set GEMINI_API_KEY=your-api-key-here
   
   # macOS/Linux
   export GEMINI_API_KEY="your-api-key-here"
   ```
   
   **Option B: .env file (create in project root)**
   ```bash
   # Copy the example file
   cp env.example .env
   # Edit .env and add your actual API key
   ```
   
   **Option C: VS Code launch configuration (Recommended for development)**
   The project includes a `.vscode/launch.json` file. Simply edit it and replace `"your-gemini-api-key-here"` with your actual API key.

4. **Compile the extension**
   ```bash
   npm run compile
   ```

5. **Launch the extension**
   - Press `F5` in VS Code to launch a new Extension Development Host window
   - Or use the "Run Extension" launch configuration

## Usage

1. **Open the chat**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Type "Open Gemini Chat" and select the command
   - Or use the command palette: `gemini-assistant.openChat`

2. **Start chatting**
   - Type your questions or requests in the chat input
   - The AI will respond and can use various tools to help you

## Available Tools

The AI assistant has access to the following tools:

- **`readFile(path)`** - Read workspace file content
- **`listOpenFiles()`** - List currently open editors
- **`grepInWorkspace(pattern)`** - Search text in workspace files
- **`writeFile(path, content)`** - Write to files (with confirmation)
- **`createFile(path, content)`** - Create new files (with confirmation)
- **`runVSCodeCommand(commandId, args)`** - Run VS Code commands (with confirmation)
- **`webSearch(query)`** - Web search (placeholder implementation)

## Safety Features

- All file write operations require user confirmation
- File overwrites show warning dialogs
- VS Code command execution requires approval
- No automatic destructive operations

## Development

### Project Structure

```
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── agent.ts              # Genkit agent with tools (v1.14.1 API)
│   └── webview/
│       └── chat.html         # Chat UI webview
├── package.json              # Extension manifest and dependencies
├── tsconfig.json             # TypeScript configuration
├── .vscode/launch.json       # VS Code debug configuration
├── env.example               # Environment variables template
└── README.md                 # This file
```

### Genkit v1.14.1 API

This project uses the latest Genkit API which includes:
- `ai.defineTool()` for creating tools with input/output schemas
- `ai.generate()` for processing prompts with tools
- Built-in tool calling loop management
- Support for `maxTurns` to limit tool iterations
- Proper error handling and type safety

### Building

- **Development**: `npm run watch` (watches for changes)
- **Production**: `npm run compile`
- **Testing**: `npm test`

### Debugging

1. Set breakpoints in your TypeScript code
2. Press `F5` to launch the extension in debug mode
3. Use the Debug Console to inspect variables
4. Check the Extension Host output for logs

## Troubleshooting

### Common Issues

1. **"Cannot find module 'genkit'" error**
   - Ensure you've run `npm install`
   - This project uses Genkit v1.14.1 - make sure you have the correct version

2. **"GEMINI_API_KEY not set" warning**
   - Verify your environment variable is set correctly
   - Restart VS Code after setting the variable
   - For development, use the `.vscode/launch.json` configuration

3. **Extension not activating**
   - Check the VS Code Developer Tools console for errors
   - Verify the `activationEvents` in `package.json`

4. **Chat not responding**
   - Check the Extension Host output for API errors
   - Verify your Gemini API key is valid and has sufficient quota
   - Ensure you're using the correct Genkit API (v1.14.1)

5. **TypeScript compilation errors**
   - Run `npm run compile` to see detailed error messages
   - The project requires Node.js 16.x or higher
   - Make sure all dependencies are properly installed

### Getting Help

- Check the VS Code Developer Tools console for error messages
- Review the Extension Host output in the Output panel
- Ensure all dependencies are properly installed
- Verify your Gemini API key and quota

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Genkit](https://genkit.ai/) - AI development framework
- Powered by [Google Gemini](https://ai.google.dev/) - Advanced AI model
- Integrated with [VS Code](https://code.visualstudio.com/) - The best code editor
