
import * as vscode from 'vscode';
import { SettingsManager, MCPServerConfig, GeminiSettings } from './settings';
import * as path from 'path';

export class SettingsPanel {
  public static currentPanel: SettingsPanel | undefined;
  public static readonly viewType = 'geminiSettings';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private readonly _settingsManager: SettingsManager;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionPath: string) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (SettingsPanel.currentPanel) {
      SettingsPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      SettingsPanel.viewType,
      'Gemini AI Settings',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(extensionPath, 'src', 'webview'))
        ]
      }
    );

    SettingsPanel.currentPanel = new SettingsPanel(panel, extensionPath);
  }

  private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
    this._panel = panel;
    this._extensionPath = extensionPath;
    this._settingsManager = SettingsManager.getInstance();

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'updateApiKey':
            await this._handleUpdateApiKey(message.apiKey);
            break;
          case 'updateModel':
            await this._handleUpdateModel(message.model);
            break;
          case 'updateMaxTurns':
            await this._handleUpdateMaxTurns(message.maxTurns);
            break;
          case 'updateEnableMCP':
            await this._handleUpdateEnableMCP(message.enableMCP);
            break;
          case 'addMCPServer':
            await this._handleAddMCPServer(message.server);
            break;
          case 'updateMCPServer':
            await this._handleUpdateMCPServer(message.serverName, message.server);
            break;
          case 'removeMCPServer':
            await this._handleRemoveMCPServer(message.serverName);
            break;
          case 'getSettings':
            this._sendSettings();
            break;
          case 'saveAllSettings':
            await this._handleSaveAllSettings(message.settings);
            break;
          case 'testConnection':
            await this._handleTestConnection();
            break;
        }
      },
      null,
      this._disposables
    );

    // Listen for settings changes
    this._settingsManager.onDidChangeSettings(() => {
      this._sendSettings();
    });
  }

  private async _handleUpdateApiKey(apiKey: string): Promise<void> {
    try {
      await this._settingsManager.updateApiKey(apiKey);
      
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'success',
        text: 'API key updated successfully!'
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'error',
        text: `Failed to update API key: ${error}`
      });
    }
  }

  private async _handleUpdateModel(model: string): Promise<void> {
    try {
      await this._settingsManager.updateModel(model);
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'success',
        text: 'Model updated successfully!'
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'error',
        text: `Failed to update model: ${error}`
      });
    }
  }

  private async _handleUpdateMaxTurns(maxTurns: number): Promise<void> {
    try {
      await this._settingsManager.updateMaxTurns(maxTurns);
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'success',
        text: 'Max turns updated successfully!'
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'error',
        text: `Failed to update max turns: ${error}`
      });
    }
  }

  private async _handleUpdateEnableMCP(enableMCP: boolean): Promise<void> {
    try {
      await this._settingsManager.updateEnableMCP(enableMCP);
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'success',
        text: `MCP ${enableMCP ? 'enabled' : 'disabled'} successfully!`
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'error',
        text: `Failed to update MCP setting: ${error}`
      });
    }
  }

  private async _handleAddMCPServer(server: MCPServerConfig): Promise<void> {
    try {
      await this._settingsManager.addMCPServer(server);
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'success',
        text: 'MCP server added successfully!'
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'error',
        text: `Failed to add MCP server: ${error}`
      });
    }
  }

  private async _handleUpdateMCPServer(serverName: string, server: MCPServerConfig): Promise<void> {
    try {
      await this._settingsManager.updateMCPServer(serverName, server);
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'success',
        text: 'MCP server updated successfully!'
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'error',
        text: `Failed to update MCP server: ${error}`
      });
    }
  }

  private async _handleRemoveMCPServer(serverName: string): Promise<void> {
    try {
      await this._settingsManager.removeMCPServer(serverName);
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'success',
        text: 'MCP server removed successfully!'
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'error',
        text: `Failed to remove MCP server: ${error}`
      });
    }
  }

  private async _handleSaveAllSettings(settings?: GeminiSettings): Promise<void> {
    try {
      // Use provided settings or get from settings manager
      const settingsToSave = settings || this._settingsManager.getSettings();
      
      // Save all settings to VS Code configuration
      await this._settingsManager.saveAllSettings(settingsToSave);
      
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'success',
        text: 'All settings saved successfully!'
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'error',
        text: `Failed to save settings: ${error}`
      });
    }
  }

  private async _handleTestConnection(): Promise<void> {
    try {
      // Get current API key and model settings
      const settings = this._settingsManager.getSettings();
      
      if (!settings.apiKey) {
        this._panel.webview.postMessage({
          command: 'showMessage',
          type: 'error',
          text: 'Please enter your API key first'
        });
        return;
      }

      // Test the connection by trying to make a simple API call
      const testResult = await this._testGeminiConnection(settings.apiKey, settings.model);
      
      if (testResult.success) {
        this._panel.webview.postMessage({
          command: 'showMessage',
          type: 'success',
          text: `Connection successful! Model: ${settings.model}`
        });
      } else {
        this._panel.webview.postMessage({
          command: 'showMessage',
          type: 'error',
          text: `Connection failed: ${testResult.error}`
        });
      }
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'showMessage',
        type: 'error',
        text: `Connection test failed: ${error}`
      });
    }
  }

  private async _testGeminiConnection(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Import and test the agent
      const { generateResponse } = await import('./agent');
      
      // Try to generate a simple response with the API key
      const response = await generateResponse('Hello, this is a connection test.', apiKey, model, '');
      
      // Handle both string and object responses
      const responseText = typeof response === 'string' ? response : response.text;
      
      if (responseText && !responseText.includes('error') && !responseText.includes('Error')) {
        return { success: true };
      } else {
        return { success: false, error: 'Response contained error message' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private _sendSettings(): void {
    const settings = this._settingsManager.getSettings();
    this._panel.webview.postMessage({
      command: 'updateSettings',
      settings: settings
    });
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = 'Gemini AI Settings';
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const htmlPath = vscode.Uri.file(path.join(this._extensionPath, 'src', 'webview', 'settings.html'));
    
    // Read the HTML file
    try {
      const htmlContent = require('fs').readFileSync(htmlPath.fsPath, 'utf8');
      return htmlContent;
    } catch (error) {
      // Fallback HTML if file reading fails
      return this._getFallbackHtml();
    }
  }

  private _getFallbackHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gemini AI Settings</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .settings-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .setting-group {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            background-color: var(--vscode-input-background);
        }
        .setting-group h3 {
            margin-top: 0;
            color: var(--vscode-editor-foreground);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        input, select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 14px;
        }
        input:focus, select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        button {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .message {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            display: none;
        }
        .message.success {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
        }
        .message.error {
            background-color: var(--vscode-errorForeground);
            color: var(--vscode-errorBackground);
        }
        .mcp-server {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: var(--vscode-editor-background);
        }
        .mcp-server-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .mcp-server-name {
            font-weight: 500;
            font-size: 16px;
        }
        .mcp-server-actions {
            display: flex;
            gap: 8px;
        }
        .btn-danger {
            background-color: var(--vscode-errorForeground);
        }
        .btn-danger:hover {
            background-color: var(--vscode-errorBackground);
        }
    </style>
</head>
<body>
    <div class="settings-container">
        <h1>🤖 Gemini AI Assistant Settings</h1>
        
        <div class="message" id="message"></div>
        
        <div class="setting-group">
            <h3>API Configuration</h3>
            <div class="form-group">
                <label for="apiKey">Google Gemini API Key</label>
                <input type="password" id="apiKey" placeholder="Enter your Gemini API key">
                <small>Your API key is stored securely in VS Code settings</small>
            </div>
        </div>
        
        <div class="setting-group">
            <h3>Model Configuration</h3>
            <div class="form-group">
                <label for="model">AI Model</label>
                <select id="model">
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</option>
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Experimental</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro Latest</option>
                </select>
            </div>
            <div class="form-group">
                <label for="maxTurns">Maximum Tool Call Turns</label>
                <input type="number" id="maxTurns" min="1" max="20" value="5">
                <small>Maximum number of tool calling iterations allowed (1-20)</small>
            </div>
        </div>
        
        <div class="setting-group">
            <h3>MCP (Model Context Protocol) Configuration</h3>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="enableMCP"> Enable MCP Support
                </label>
                <small>Enable integration with MCP servers for additional capabilities</small>
            </div>
            
            <div id="mcpServers" style="display: none;">
                <h4>MCP Servers</h4>
                <div id="mcpServersList"></div>
                
                <button id="addMCPServer">Add MCP Server</button>
            </div>
        </div>
        
        <div class="setting-group">
            <button id="saveSettings">Save All Settings</button>
            <button id="testConnection">Test Connection</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentSettings = {};
        
        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            // Request current settings
            vscode.postMessage({ command: 'getSettings' });
            
            // Set up event listeners
            setupEventListeners();
        });
        
        function setupEventListeners() {
            // API Key input - just store the value, don't save immediately
            document.getElementById('apiKey').addEventListener('input', function() {
                currentSettings.apiKey = this.value;
            });
            
            // Model selection - just store the value, don't save immediately
            document.getElementById('model').addEventListener('change', function() {
                currentSettings.model = this.value;
            });
            
            // Max turns - just store the value, don't save immediately
            document.getElementById('maxTurns').addEventListener('change', function() {
                currentSettings.maxTurns = parseInt(this.value);
            });
            
            // Enable MCP - just store the value, don't save immediately
            document.getElementById('enableMCP').addEventListener('change', function() {
                currentSettings.enableMCP = this.checked;
                toggleMCPServers(this.checked);
            });
            
            // Save settings button - save all collected changes
            document.getElementById('saveSettings').addEventListener('click', function() {
                // Collect current form values
                currentSettings.apiKey = document.getElementById('apiKey').value;
                currentSettings.model = document.getElementById('model').value;
                currentSettings.maxTurns = parseInt(document.getElementById('maxTurns').value);
                currentSettings.enableMCP = document.getElementById('enableMCP').checked;
                
                vscode.postMessage({ 
                    command: 'saveAllSettings',
                    settings: currentSettings
                });
            });
            
            // Test connection button
            document.getElementById('testConnection').addEventListener('click', function() {
                vscode.postMessage({ command: 'testConnection' });
            });
        }
        
        function toggleMCPServers(show) {
            const mcpServers = document.getElementById('mcpServers');
            mcpServers.style.display = show ? 'block' : 'none';
        }
        
        function showMessage(text, type) {
            const messageEl = document.getElementById('message');
            messageEl.textContent = text;
            messageEl.className = \`message \${type}\`;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }
        

        
        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateSettings':
                    currentSettings = message.settings;
                    updateUI(message.settings);
                    break;
                case 'showMessage':
                    showMessage(message.text, message.type);
                    break;
            }
        });
        
        function updateUI(settings) {
            // Update form fields with current settings
            document.getElementById('apiKey').value = settings.apiKey || '';
            document.getElementById('model').value = settings.model || 'gemini-2.0-flash';
            document.getElementById('maxTurns').value = settings.maxTurns || 5;
            document.getElementById('enableMCP').checked = settings.enableMCP || false;
            
            toggleMCPServers(settings.enableMCP);
            updateMCPServersList(settings.mcpServers || []);
        }
        
        function updateMCPServersList(servers) {
            const container = document.getElementById('mcpServersList');
            container.innerHTML = '';
            
            servers.forEach(server => {
                const serverEl = createMCPServerElement(server);
                container.appendChild(serverEl);
            });
        }
        
        function createMCPServerElement(server) {
            const div = document.createElement('div');
            div.className = 'mcp-server';
            div.innerHTML = \`
                <div class="mcp-server-header">
                    <div class="mcp-server-name">\${server.name}</div>
                    <div class="mcp-server-actions">
                        <button onclick="editMCPServer('\${server.name}')">Edit</button>
                        <button class="btn-danger" onclick="removeMCPServer('\${server.name}')">Remove</button>
                    </div>
                </div>
                <div><strong>Command:</strong> \${server.command}</div>
                <div><strong>Arguments:</strong> \${server.args.join(' ')}</div>
            \`;
            return div;
        }
        
        function editMCPServer(serverName) {
            // Implementation for editing MCP server
            showMessage('Edit MCP server: ' + serverName, 'success');
        }
        
        function removeMCPServer(serverName) {
            if (confirm('Are you sure you want to remove this MCP server?')) {
                vscode.postMessage({
                    command: 'removeMCPServer',
                    serverName: serverName
                });
            }
        }
    </script>
</body>
</html>`;
  }

  public dispose() {
    SettingsPanel.currentPanel = undefined;

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