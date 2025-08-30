import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { z, type Genkit } from 'genkit';
import { createOperationNotification } from '../index';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper function to ensure terminal command output matches schema
function ensureTerminalOutputSchema(result: any) {
  return {
    success: Boolean(result.success),
    output: result.output || '',
    error: result.error || '',
    exitCode: typeof result.exitCode === 'number' ? result.exitCode : -1,
    stderr: result.stderr || ''
  };
}

// Run terminal command tool
export function createRunInTerminalTool(ai: Genkit) {
  return ai.defineTool({
    name: 'run_in_terminal',
    description: 'Execute a command in the terminal and return the output. Use this for running build commands, package managers, or any shell commands.',
    inputSchema: z.object({
      command: z.string().describe('The command to execute in the terminal'),
      cwd: z.string().optional().describe('Working directory for the command (defaults to workspace root)'),
      timeout: z.number().optional().describe('Timeout in milliseconds (defaults to 30000)')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      output: z.string(),
      error: z.string(),
      exitCode: z.number(),
      stderr: z.string()
    }),
  }, async ({ command, cwd, timeout = 30000 }: { command: string; cwd?: string; timeout?: number }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return ensureTerminalOutputSchema({
          success: false,
          error: 'No workspace open',
          exitCode: -1
        });
      }

      const workingDir = cwd || workspaceRoot;
      
      // Create operation notification
      createOperationNotification('command', `Executing: ${command}`, {
        filePath: workingDir,
        command: command,
        workingDirectory: workingDir
      });

      console.log(`🔄 Executing tool: run_in_terminal with args:`, { command, cwd: workingDir, timeout });

      try {
        // Use child_process.exec for better output capture
        const { stdout, stderr } = await execAsync(command, {
          cwd: workingDir,
          timeout: timeout,
          maxBuffer: 1024 * 1024 // 1MB buffer
        });

        const result = {
          success: true,
          output: stdout || '',
          error: '',
          exitCode: 0,
          stderr: stderr || ''
        };

        console.log(`✅ Tool run_in_terminal succeeded:`, result);
        return ensureTerminalOutputSchema(result);

      } catch (execError: any) {
        // Handle exec errors (like command not found, timeouts, etc.)
        let exitCode = -1;
        
        if (execError.code) {
          // Convert string error codes to numbers
          switch (execError.code) {
            case 'ENOENT':
              exitCode = 127; // Command not found
              break;
            case 'EACCES':
              exitCode = 126; // Permission denied
              break;
            case 'ETIMEDOUT':
              exitCode = 124; // Timeout
              break;
            default:
              exitCode = typeof execError.code === 'number' ? execError.code : parseInt(execError.code) || -1;
          }
        }

        const result = {
          success: false,
          output: '',
          error: `Command failed: ${execError.message}`,
          exitCode: exitCode,
          stderr: execError.stderr || execError.message || ''
        };

        console.log(`❌ Tool run_in_terminal failed:`, result);
        return ensureTerminalOutputSchema(result);
      }

    } catch (error) {
      console.error(`💥 Tool run_in_terminal crashed:`, error);
      
      const result = {
        success: false,
        output: '',
        error: `Failed to run command: ${error instanceof Error ? error.message : String(error)}`,
        exitCode: -1,
        stderr: ''
      };

      return ensureTerminalOutputSchema(result);
    }
  });
}

// Get terminal output tool
export function createGetTerminalOutputTool(ai: Genkit) {
  return ai.defineTool({
    name: 'get_terminal_output',
    description: 'Get the current output from the active terminal.',
    inputSchema: z.object({
      terminalId: z.string().optional().describe('ID of the specific terminal to get output from')
    }),
    outputSchema: z.object({
      output: z.string().optional(),
      terminalName: z.string().optional(),
      error: z.string().optional()
    }),
  }, async ({ terminalId }: { terminalId?: string }) => {
    try {
      // Create operation notification
      createOperationNotification('read', 'Getting terminal output', {
        terminalId: terminalId || 'active'
      });

      // Get active terminal
      const terminal = vscode.window.activeTerminal;
      if (!terminal) {
        return { error: 'No active terminal found' };
      }

      // For now, we can't directly read terminal output due to VS Code API limitations
      // This would require a more complex implementation with terminal data listeners
      return {
        output: `Terminal output for ${terminal.name} (ID: ${terminal.processId})`,
        terminalName: terminal.name,
        error: 'Direct terminal output reading not available in current VS Code API version'
      };
    } catch (error) {
      console.error('Error getting terminal output:', error);
      return { error: `Failed to get terminal output: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}
