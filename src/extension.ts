import * as vscode from 'vscode';
import { generateResponse, setOperationNotifier } from './agent/index';
import { SettingsPanel } from './settingsPanel';
import { SettingsManager } from './settings';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  console.log('Gemini AI Assistant extension is now active!');

  // Check if API key is set in settings
  const settings = SettingsManager.getInstance().getSettings();
  if (!settings.apiKey) {
    vscode.window.showInformationMessage(
      'Please configure your Gemini API key in settings to use the Gemini AI Assistant.'
    );
  }

  // Register the command to open the chat
  let chatDisposable = vscode.commands.registerCommand('gemini-assistant.openChat', () => {
    ChatPanel.createOrShow(context.extensionPath);
  });

  // Register the command to open the settings
  let settingsDisposable = vscode.commands.registerCommand('gemini-assistant.openSettings', () => {
    SettingsPanel.createOrShow(context.extensionPath);
  });

  context.subscriptions.push(chatDisposable, settingsDisposable);
}

export function deactivate() {}

class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  public static readonly viewType = 'geminiChat';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];
  private _chatHistory: string = '';

  public static createOrShow(extensionPath: string) {
    // Try to position the panel to the right of the active editor
    const column = vscode.ViewColumn.Beside;

    // If we already have a panel, show it
    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      ChatPanel.viewType,
      'Gemini AI Chat',
      column,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(extensionPath, 'src', 'webview')),
          vscode.Uri.file(path.join(extensionPath, 'out', 'webview'))
        ],
        retainContextWhenHidden: true, // Keep the panel alive when hidden
        enableFindWidget: true
      }
    );

    // Configure the panel to behave more like a sidebar
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(extensionPath, 'src', 'webview')),
        vscode.Uri.file(path.join(extensionPath, 'out', 'webview'))
      ]
    };

    // Try to set the panel to a reasonable size for sidebar-like behavior
    // Note: VS Code doesn't provide direct control over panel sizing in this API version
    console.log('Created Gemini AI Chat panel in column:', column);

    ChatPanel.currentPanel = new ChatPanel(panel, extensionPath);
  }

  private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
    this._panel = panel;
    this._extensionPath = extensionPath;

    // Set up operation notifier to send notifications to webview
    setOperationNotifier((operation) => {
      // Add operation to chat history
      this._chatHistory += `[OPERATION] ${operation.message}\n`;
      
      this._panel.webview.postMessage({
        command: 'addOperationNotification',
        operation: operation
      });
    });

    // Set the webview's initial html content
    const htmlContent = this._getHtmlForWebview(this._panel.webview);
    console.log('Setting webview HTML content, length:', htmlContent.length);
    this._panel.webview.html = htmlContent;

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        console.log('Received message from webview:', message);
        switch (message.command) {
          case 'sendMessage':
            console.log('Processing sendMessage command with text:', message.text);
            await this._handleUserMessage(message.text);
            break;
          case 'openSettings':
            console.log('Opening settings...');
            vscode.commands.executeCommand('gemini-assistant.openSettings');
            break;
          case 'openExternal':
            console.log('Opening external URL:', message.url);
            if (message.url) {
              vscode.env.openExternal(vscode.Uri.parse(message.url));
            }
            break;
          default:
            console.log('Unknown command received:', message.command);
        }
      },
      null,
      this._disposables
    );
  }

  private async _handleUserMessage(text: string) {
    console.log('_handleUserMessage called with text:', text);
    try {
      // Add user message to chat
      this._panel.webview.postMessage({
        command: 'addMessage',
        type: 'user',
        text: text
      });

      // Show typing indicator
      this._panel.webview.postMessage({
        command: 'showTyping'
      });

      // Get API key from settings
      const settings = SettingsManager.getInstance().getSettings();
      const apiKey = settings.apiKey;
      const model = settings.model;

      if (!apiKey) {
        // Add error message about missing API key
        this._panel.webview.postMessage({
          command: 'addMessage',
          type: 'error',
          text: 'Please configure your Gemini API key in settings first. Use the settings button to configure.'
        });
        return;
      }

      // Add user message to chat history
      this._chatHistory += `[USER] ${text}\n`;
      
      // Process with AI agent
      const response = await generateResponse(text, apiKey, model, this._chatHistory);

      // Hide typing indicator
      this._panel.webview.postMessage({
        command: 'hideTyping'
      });

      // Add AI response to chat history
      this._chatHistory += `[ASSISTANT] ${response.text || 'Sorry, I encountered an error processing your request.'}\n`;
      
      // Add AI response to chat
      this._panel.webview.postMessage({
        command: 'addMessage',
        type: 'assistant',
        text: response.text || 'Sorry, I encountered an error processing your request.'
      });

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Hide typing indicator
      this._panel.webview.postMessage({
        command: 'hideTyping'
      });

      // Add error message
      this._panel.webview.postMessage({
        command: 'addMessage',
        type: 'error',
        text: 'Sorry, I encountered an error. Please check the console for details.'
      });
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Gemini AI Chat';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

    private _getHtmlForWebview(webview: vscode.Webview) {
    // Try multiple possible paths for the HTML file
    const possiblePaths = [
      path.join(this._extensionPath, 'src', 'webview', 'chat.html'),
      path.join(this._extensionPath, 'out', 'webview', 'chat.html'),
      path.join(__dirname, '..', 'src', 'webview', 'chat.html'),
      path.join(__dirname, '..', 'out', 'webview', 'chat.html')
    ];
    
    console.log('Extension path:', this._extensionPath);
    console.log('__dirname:', __dirname);
    
    // Try to read from each possible path
    for (const htmlPath of possiblePaths) {
      try {
        console.log('Attempting to load chat.html from:', htmlPath);
        if (require('fs').existsSync(htmlPath)) {
          const htmlContent = require('fs').readFileSync(htmlPath, 'utf8');
          console.log('Successfully loaded chat.html from:', htmlPath);
          console.log('Length:', htmlContent.length);
          console.log('First 200 characters:', htmlContent.substring(0, 200));
          
          // Log the path that was successfully loaded
          console.log('Successfully loaded HTML from path:', htmlPath);
          
          return htmlContent;
        }
      } catch (error) {
        console.log('Failed to load from:', htmlPath, error instanceof Error ? error.message : String(error));
      }
    }
    
    // If all paths fail, use fallback HTML
    console.log('All paths failed, using fallback HTML');
    return this._getFallbackHtml();
  }

  private _getFallbackHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini AI Chat</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            height: 100vh;
            overflow: hidden;
        }
        .chat-container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 16px;
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 16px;
            margin-bottom: 16px;
            background-color: var(--vscode-input-background);
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
        }
        .message.user {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: 20%;
        }
        .message.assistant {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
        }
        .message.error {
            background-color: var(--vscode-errorForeground);
            color: var(--vscode-errorBackground);
        }
        .input-container {
            display: flex;
            gap: 10px;
        }
        #messageInput {
            flex: 1;
            padding: 10px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }
        #sendButton {
            padding: 10px 20px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #sendButton:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .typing-indicator {
            display: none;
            font-style: italic;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <h1>Gemini AI Chat</h1>
        <div class="chat-messages" id="chatMessages">
            <div class="message assistant">
                Hello! I'm your Gemini AI coding assistant. How can I help you today?
            </div>
        </div>
        <div class="typing-indicator" id="typingIndicator">
            Gemini is thinking...
        </div>
        <div class="input-container">
            <input type="text" id="messageInput" placeholder="Type your message here..." />
            <button id="sendButton">Send</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const chatMessages = document.getElementById('chatMessages');
        const typingIndicator = document.getElementById('typingIndicator');

        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                vscode.postMessage({
                    command: 'sendMessage',
                    text: text
                });
                messageInput.value = '';
            }
        }

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'addMessage':
                    const messageDiv = document.createElement('div');
                    messageDiv.className = \`message \${message.type}\`;
                    messageDiv.textContent = message.text;
                    chatMessages.appendChild(messageDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    break;
                case 'showTyping':
                    typingIndicator.style.display = 'block';
                    break;
                case 'hideTyping':
                    typingIndicator.style.display = 'none';
                    break;
            }
        });

        // Focus on input when page loads
        messageInput.focus();
    </script>
</body>
</html>`;
  }

  public dispose() {
    ChatPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
