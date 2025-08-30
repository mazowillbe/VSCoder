import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Global interface for AI issues
declare global {
  var aiIssues: Array<{
    filePath: string;
    errors: Array<{
      line: number;
      message: string;
      range: vscode.Range;
    }>;
    warnings: Array<{
      line: number;
      message: string;
      range: vscode.Range;
    }>;
  }>;
}

// Enhanced Code Quality Manager with ESLint, Prettier, TypeScript, etc.
export class CodeQualityManager {
  private static instance: CodeQualityManager;
  private diagnosticsCollection: vscode.DiagnosticCollection;
  private isMonitoring: boolean = false;
  private lastFileEdit: { [key: string]: number } = {};
  private projectTools: {
    eslint: boolean;
    prettier: boolean;
    typescript: boolean;
    stylelint: boolean;
    jest: boolean;
  } = {
    eslint: false,
    prettier: false,
    typescript: false,
    stylelint: false,
    jest: false
  };

  private constructor() {
    this.diagnosticsCollection = vscode.languages.createDiagnosticCollection('ai-assistant');
  }

  public static getInstance(): CodeQualityManager {
    if (!CodeQualityManager.instance) {
      CodeQualityManager.instance = new CodeQualityManager();
    }
    return CodeQualityManager.instance;
  }

  // Start monitoring diagnostics for automatic issue detection
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Detect project tools
    this.detectProjectTools();
    
    // Listen for diagnostic changes
    vscode.languages.onDidChangeDiagnostics((event) => {
      this.handleDiagnosticsChange(event);
    });

    // Listen for document changes to track file edits
    vscode.workspace.onDidChangeTextDocument((event) => {
      this.lastFileEdit[event.document.uri.fsPath] = Date.now();
    });

    console.log('Enhanced Code Quality monitoring started');
    console.log('Detected project tools:', this.projectTools);
  }

  // Detect which code quality tools are available in the project
  private async detectProjectTools(): Promise<void> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) return;

      // Check for package.json
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // Detect ESLint
        this.projectTools.eslint = !!(
          dependencies.eslint || 
          dependencies['@typescript-eslint/eslint-plugin'] ||
          fs.existsSync(path.join(workspaceRoot, '.eslintrc.js')) ||
          fs.existsSync(path.join(workspaceRoot, '.eslintrc.json')) ||
          fs.existsSync(path.join(workspaceRoot, '.eslintrc'))
        );

        // Detect Prettier
        this.projectTools.prettier = !!(
          dependencies.prettier ||
          fs.existsSync(path.join(workspaceRoot, '.prettierrc')) ||
          fs.existsSync(path.join(workspaceRoot, '.prettierrc.js')) ||
          fs.existsSync(path.join(workspaceRoot, '.prettierrc.json'))
        );

        // Detect TypeScript
        this.projectTools.typescript = !!(
          dependencies.typescript ||
          fs.existsSync(path.join(workspaceRoot, 'tsconfig.json')) ||
          fs.existsSync(path.join(workspaceRoot, 'tsconfig.js'))
        );

        // Detect Stylelint
        this.projectTools.stylelint = !!(
          dependencies.stylelint ||
          fs.existsSync(path.join(workspaceRoot, '.stylelintrc')) ||
          fs.existsSync(path.join(workspaceRoot, '.stylelintrc.js')) ||
          fs.existsSync(path.join(workspaceRoot, '.stylelintrc.json'))
        );

        // Detect Jest
        this.projectTools.jest = !!(
          dependencies.jest ||
          dependencies['@jest/globals'] ||
          fs.existsSync(path.join(workspaceRoot, 'jest.config.js')) ||
          fs.existsSync(path.join(workspaceRoot, 'jest.config.ts'))
        );
      }
    } catch (error) {
      console.error('Error detecting project tools:', error);
    }
  }

  // Handle diagnostic changes and notify AI about new issues
  private handleDiagnosticsChange(event: vscode.DiagnosticChangeEvent): void {
    for (const uri of event.uris) {
      const diagnostics = vscode.languages.getDiagnostics(uri);
      if (diagnostics.length > 0) {
        const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
        const warnings = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning);
        
        if (errors.length > 0 || warnings.length > 0) {
          this.notifyAIAboutIssues(uri.fsPath, errors, warnings);
        }
      }
    }
  }

  // Notify AI about issues for potential auto-fixing
  private async notifyAIAboutIssues(filePath: string, errors: vscode.Diagnostic[], warnings: vscode.Diagnostic[]): Promise<void> {
    // This will be used by the AI to automatically fix issues
    const issues = {
      filePath,
      errors: errors.map(e => ({
        line: e.range.start.line + 1,
        message: e.message,
        range: e.range
      })),
      warnings: warnings.map(w => ({
        line: w.range.start.line + 1,
        message: w.message,
        range: w.range
      }))
    };

    // Store issues for AI access
    this.storeIssuesForAI(issues);
  }

  // Store issues for AI to access
  private storeIssuesForAI(issues: any): void {
    // Store in a way that the AI can access
    if (!global.aiIssues) global.aiIssues = [];
    global.aiIssues.push(issues);
    
    // Keep only recent issues (last 10)
    if (global.aiIssues.length > 10) {
      global.aiIssues = global.aiIssues.slice(-10);
    }
  }

  // Get current issues for a file
  public getCurrentIssues(filePath: string): any[] {
    if (!global.aiIssues) return [];
    return global.aiIssues.filter(issue => issue.filePath === filePath);
  }

  // Get all current issues
  public getAllIssues(): any[] {
    return global.aiIssues || [];
  }

  // Clear issues for a file
  public clearIssues(filePath: string): void {
    if (global.aiIssues) {
      global.aiIssues = global.aiIssues.filter(issue => issue.filePath !== issue.filePath);
    }
  }

  // Get available project tools
  public getAvailableTools(): any {
    return this.projectTools;
  }

  // Run ESLint on a file
  public async runESLint(filePath: string): Promise<any> {
    if (!this.projectTools.eslint) {
      return { error: 'ESLint not available in this project' };
    }

    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      const fullPath = path.join(workspaceRoot, filePath);
      const relativePath = path.relative(workspaceRoot, fullPath);

      // Run ESLint via VS Code command
      const result = await vscode.commands.executeCommand(
        'eslint.executeAutofix',
        vscode.Uri.file(fullPath)
      );

      return { 
        message: `ESLint autofix applied to ${relativePath}`,
        result
      };
    } catch (error) {
      return { error: `ESLint failed: ${error}` };
    }
  }

  // Run Prettier on a file
  public async runPrettier(filePath: string): Promise<any> {
    if (!this.projectTools.prettier) {
      return { error: 'Prettier not available in this project' };
    }

    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      const fullPath = path.join(workspaceRoot, filePath);
      const relativePath = path.relative(workspaceRoot, fullPath);

      // Run Prettier via VS Code command
      const result = await vscode.commands.executeCommand(
        'prettier.formatDocument',
        vscode.Uri.file(fullPath)
      );

      return { 
        message: `Prettier formatting applied to ${relativePath}`,
        result
      };
    } catch (error) {
      return { error: `Prettier failed: ${error}` };
    }
  }

  // Run TypeScript compiler check
  public async runTypeScriptCheck(filePath: string): Promise<any> {
    if (!this.projectTools.typescript) {
      return { error: 'TypeScript not available in this project' };
    }

    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      const fullPath = path.join(workspaceRoot, filePath);
      const relativePath = path.relative(workspaceRoot, fullPath);

      // Get TypeScript diagnostics for the file
      const uri = vscode.Uri.file(fullPath);
      const diagnostics = vscode.languages.getDiagnostics(uri);
      const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
      const warnings = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning);

      return { 
        message: `TypeScript check completed for ${relativePath}`,
        errors: errors.length,
        warnings: warnings.length,
        diagnostics: diagnostics.length
      };
    } catch (error) {
      return { error: `TypeScript check failed: ${error}` };
    }
  }

  // Get code quality summary for a file
  public async getCodeQualitySummary(filePath: string): Promise<any> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      const fullPath = path.join(workspaceRoot, filePath);
      const uri = vscode.Uri.file(fullPath);
      const diagnostics = vscode.languages.getDiagnostics(uri);
      
      const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
      const warnings = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning);
      const info = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Information);
      const hints = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Hint);

      return {
        filePath,
        totalIssues: diagnostics.length,
        errors: errors.length,
        warnings: warnings.length,
        info: info.length,
        hints: hints.length,
        lastEdit: this.lastFileEdit[fullPath] || null,
        tools: this.projectTools
      };
    } catch (error) {
      return { error: `Failed to get code quality summary: ${error}` };
    }
  }
}
