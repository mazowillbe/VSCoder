import * as vscode from 'vscode';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface GeminiSettings {
  apiKey: string;
  model: string;
  maxTurns: number;
  enableMCP: boolean;
  mcpServers: MCPServerConfig[];
}

export class SettingsManager {
  private static instance: SettingsManager;
  private readonly _onDidChangeSettings = new vscode.EventEmitter<void>();
  public readonly onDidChangeSettings = this._onDidChangeSettings.event;

  private constructor() {}

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  public getSettings(): GeminiSettings {
    const config = vscode.workspace.getConfiguration('geminiAssistant');
    return {
      apiKey: config.get('apiKey', ''),
      model: config.get('model', 'gemini-2.0-flash'),
      maxTurns: config.get('maxTurns', 5),
      enableMCP: config.get('enableMCP', false),
      mcpServers: config.get('mcpServers', [])
    };
  }

  public async updateApiKey(apiKey: string): Promise<void> {
    await vscode.workspace.getConfiguration('geminiAssistant').update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
    this._onDidChangeSettings.fire();
  }

  public async updateModel(model: string): Promise<void> {
    await vscode.workspace.getConfiguration('geminiAssistant').update('model', model, vscode.ConfigurationTarget.Global);
    this._onDidChangeSettings.fire();
  }

  public async updateMaxTurns(maxTurns: number): Promise<void> {
    await vscode.workspace.getConfiguration('geminiAssistant').update('maxTurns', maxTurns, vscode.ConfigurationTarget.Global);
    this._onDidChangeSettings.fire();
  }

  public async updateEnableMCP(enableMCP: boolean): Promise<void> {
    await vscode.workspace.getConfiguration('geminiAssistant').update('enableMCP', enableMCP, vscode.ConfigurationTarget.Global);
    this._onDidChangeSettings.fire();
  }

  public async addMCPServer(server: MCPServerConfig): Promise<void> {
    const settings = this.getSettings();
    const existingIndex = settings.mcpServers.findIndex(s => s.name === server.name);
    
    if (existingIndex >= 0) {
      settings.mcpServers[existingIndex] = server;
    } else {
      settings.mcpServers.push(server);
    }
    
    await vscode.workspace.getConfiguration('geminiAssistant').update('mcpServers', settings.mcpServers, vscode.ConfigurationTarget.Global);
    this._onDidChangeSettings.fire();
  }

  public async updateMCPServer(serverName: string, server: MCPServerConfig): Promise<void> {
    const settings = this.getSettings();
    const existingIndex = settings.mcpServers.findIndex(s => s.name === serverName);
    
    if (existingIndex >= 0) {
      settings.mcpServers[existingIndex] = server;
      await vscode.workspace.getConfiguration('geminiAssistant').update('mcpServers', settings.mcpServers, vscode.ConfigurationTarget.Global);
      this._onDidChangeSettings.fire();
    }
  }

  public async removeMCPServer(serverName: string): Promise<void> {
    const settings = this.getSettings();
    const filteredServers = settings.mcpServers.filter(s => s.name !== serverName);
    
    await vscode.workspace.getConfiguration('geminiAssistant').update('mcpServers', filteredServers, vscode.ConfigurationTarget.Global);
    this._onDidChangeSettings.fire();
  }

  public async saveAllSettings(settings: GeminiSettings): Promise<void> {
    const config = vscode.workspace.getConfiguration('geminiAssistant');
    
    // Save all settings at once
    await config.update('apiKey', settings.apiKey, vscode.ConfigurationTarget.Global);
    await config.update('model', settings.model, vscode.ConfigurationTarget.Global);
    await config.update('maxTurns', settings.maxTurns, vscode.ConfigurationTarget.Global);
    await config.update('enableMCP', settings.enableMCP, vscode.ConfigurationTarget.Global);
    await config.update('mcpServers', settings.mcpServers, vscode.ConfigurationTarget.Global);
    
    this._onDidChangeSettings.fire();
  }
}
