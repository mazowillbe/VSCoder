import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { z, type Genkit } from 'genkit';

// Import the createOperationNotification function
import { createOperationNotification } from '../index';

// File reading tool
export function CreateReadFileTool(ai: Genkit) {
    return ai.defineTool({
  name: 'read_file',
  description: 'Read the contents of a file. You must specify the line range you\'re interested in, and if the file is larger, you will be given an outline of the rest of the file.',
  inputSchema: z.object({
    filePath: z.string().optional().describe('The relative path of the file to read from the workspace root (e.g., "src/extension.ts", "README.md", etc.)'),
    file_path: z.string().optional().describe('Alternative parameter name for filePath'),
    startLineNumberBaseZero: z.number().optional().describe('The line number to start reading from, 0-based'),
    start_line_number_base_zero: z.number().optional().describe('Alternative parameter name for startLineNumberBaseZero'),
    endLineNumberBaseZero: z.number().optional().describe('The inclusive line number to end reading at, 0-based'),
    end_line_number_base_zero: z.number().optional().describe('Alternative parameter name for endLineNumberBaseZero')
  }),
  outputSchema: z.object({
    content: z.string().optional(),
    startLine: z.number().optional(),
    endLine: z.number().optional(),
    totalLines: z.number().optional(),
    outline: z.string().optional(),
    error: z.string().optional()
  }),
    },
  async (args) => {
    // Handle both camelCase and snake_case parameter names for flexibility
    const filePath = args.filePath || args.file_path;
    const startLineNumberBaseZero = args.startLineNumberBaseZero || args.start_line_number_base_zero || 0;
    const endLineNumberBaseZero = args.endLineNumberBaseZero || args.end_line_number_base_zero || 100;
    
    if (!filePath) {
      return { error: 'File path is required (filePath or file_path)' };
    }
    
    try {
      // Get the workspace root directory
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }
      
      // Validate file path
      if (!filePath || filePath.trim() === '') {
        return { error: 'File path cannot be empty' };
      }
      
      // Resolve the file path relative to workspace root
      const fullPath = path.join(workspaceRoot, filePath);
      console.log('Reading file:', filePath, 'resolved to:', fullPath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return { error: `File not found: ${filePath}` };
      }
      
      // Check if it's actually a file
      const stats = fs.statSync(fullPath);
      if (!stats.isFile()) {
        return { error: `${filePath} is not a file` };
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const startLine = Math.max(0, startLineNumberBaseZero);
      const endLine = Math.min(lines.length - 1, endLineNumberBaseZero);
      
      const selectedLines = lines.slice(startLine, endLine + 1);
      const outline = lines.length > endLine + 1 ? 
        `... and ${lines.length - endLine - 1} more lines` : '';
      
      // Create operation notification for file read
      const fileName = path.basename(filePath);
      const fileType = path.extname(filePath).substring(1) || 'file';
      createOperationNotification('read', `Read ${fileName} L${startLine + 1}-${endLine + 1}`, {
        filePath,
        fileName,
        fileType,
        linesRead: { start: startLine + 1, end: endLine + 1, total: lines.length }
      });
       
      return { 
        content: selectedLines.join('\n'),
        startLine,
        endLine,
        totalLines: lines.length,
        outline
      };
    } catch (error) {
      console.error('Error reading file:', error);
      return { error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}` };
    }
  })
}

// Directory listing tool
export function createListDirTool(ai: Genkit) {
  return ai.defineTool({
    name: 'list_dir',
    description: 'List the contents of a directory. Result will have the name of the child. If the name ends in /, it\'s a folder, otherwise a file',
    inputSchema: z.object({
      dirPath: z.string().describe('The absolute path to the directory to list')
    }),
    outputSchema: z.object({
      entries: z.array(z.object({
        name: z.string(),
        path: z.string(),
        isDirectory: z.boolean(),
        size: z.number().optional()
      })).optional(),
      error: z.string().optional()
    }),
  }, async ({ dirPath }: { dirPath: string }) => {
    try {
      if (!fs.existsSync(dirPath)) {
        return { error: `Directory not found: ${dirPath}` };
      }

      const stats = fs.statSync(dirPath);
      if (!stats.isDirectory()) {
        return { error: `${dirPath} is not a directory` };
      }

      const entries = fs.readdirSync(dirPath);
      const result = [];

      for (const entry of entries) {
        try {
          const fullPath = path.join(dirPath, entry);
          const entryStats = fs.statSync(fullPath);
          
          result.push({
            name: entry,
            path: fullPath,
            isDirectory: entryStats.isDirectory(),
            size: entryStats.isFile() ? entryStats.size : undefined
          });
        } catch (entryError) {
          // Skip entries that can't be read
          continue;
        }
      }

      // Create operation notification
      createOperationNotification('read', `Listed directory: ${dirPath}`, {
        filePath: dirPath,
        entryCount: result.length
      });

      return { entries: result };
    } catch (error) {
      console.error('Error listing directory:', error);
      return { error: `Failed to list directory: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}

// String replacement tool
export function createReplaceStringInFileTool(ai: Genkit) {
  return ai.defineTool({
    name: 'replace_string_in_file',
    description: 'Replace a specific string in a file with new content. This is the preferred method for editing files.',
    inputSchema: z.object({
      filePath: z.string().describe('The relative path of the file to edit from the workspace root'),
      oldString: z.string().describe('The exact string to replace (must be unique within the file)'),
      newString: z.string().describe('The new string to replace the old string with')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional()
    }),
  }, async ({ filePath, oldString, newString }: { filePath: string; oldString: string; newString: string }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { success: false, error: 'No workspace open' };
      }

      const fullPath = path.join(workspaceRoot, filePath);
      
      if (!fs.existsSync(fullPath)) {
        return { success: false, error: `File not found: ${filePath}` };
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      
      if (!content.includes(oldString)) {
        return { success: false, error: `String not found in file: ${oldString}` };
      }

      const newContent = content.replace(oldString, newString);
      fs.writeFileSync(fullPath, newContent, 'utf8');

      // Create detailed file edit notification
      const fileName = path.basename(filePath);
      const fileType = path.extname(filePath).substring(1) || 'file';
      
      // Calculate lines added/removed
      const oldLines = oldString.split('\n').length;
      const newLines = newString.split('\n').length;
      const linesAdded = Math.max(0, newLines - oldLines);
      const linesRemoved = Math.max(0, oldLines - newLines);
      
      createOperationNotification('write', `Edited ${fileName}`, {
        filePath,
        fileName,
        fileType,
        linesAdded,
        linesRemoved,
        content: `Replaced: "${oldString.substring(0, 100)}${oldString.length > 100 ? '...' : ''}"\nWith: "${newString.substring(0, 100)}${newString.length > 100 ? '...' : ''}"`,
        type: 'write',
        operationId: `edit_${Date.now()}_${fileName}`
      });

      return { 
        success: true, 
        message: `Successfully updated ${filePath}` 
      };
    } catch (error) {
      console.error('Error replacing string in file:', error);
      return { 
        success: false, 
        error: `Failed to replace string: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  });
}

// Insert edit tool
export function createInsertEditIntoFileTool(ai: Genkit) {
  return ai.defineTool({
    name: 'insert_edit_into_file',
    description: 'Insert new content into a file at a specific location. Use this only if replace_string_in_file fails.',
    inputSchema: z.object({
      filePath: z.string().describe('The relative path of the file to edit from the workspace root'),
      content: z.string().describe('The content to insert'),
      position: z.enum(['start', 'end', 'before', 'after', 'replace']).describe('Where to insert the content (use "replace" to replace entire file content)'),
      targetString: z.string().optional().describe('The string to insert before/after (required if position is before/after)')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional()
    }),
  }, async ({ filePath, content, position, targetString }: { filePath: string; content: string; position: string; targetString?: string }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { success: false, error: 'No workspace open' };
      }

      const fullPath = path.join(workspaceRoot, filePath);
      
      if (!fs.existsSync(fullPath)) {
        return { success: false, error: `File not found: ${filePath}` };
      }

      const fileContent = fs.readFileSync(fullPath, 'utf8');
      let newContent = '';

      switch (position) {
        case 'start':
          newContent = content + '\n' + fileContent;
          break;
        case 'end':
          newContent = fileContent + '\n' + content;
          break;
        case 'replace':
          newContent = content;
          break;
        case 'before':
          if (!targetString) {
            return { success: false, error: 'targetString is required for "before" position' };
          }
          if (!fileContent.includes(targetString)) {
            return { success: false, error: `Target string not found: ${targetString}` };
          }
          newContent = fileContent.replace(targetString, content + '\n' + targetString);
          break;
        case 'after':
          if (!targetString) {
            return { success: false, error: 'targetString is required for "after" position' };
          }
          if (!fileContent.includes(targetString)) {
            return { success: false, error: `Target string not found: ${targetString}` };
          }
          newContent = fileContent.replace(targetString, targetString + '\n' + content);
          break;
        default:
          return { success: false, error: `Invalid position: ${position}` };
      }

      fs.writeFileSync(fullPath, newContent, 'utf8');

      // Create operation notification
      const fileName = path.basename(filePath);
      const fileType = path.extname(filePath).substring(1) || 'file';
      
      createOperationNotification('write', `Inserted content into ${fileName}`, {
        filePath,
        fileName,
        fileType,
        position,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      });

      return { 
        success: true, 
        message: `Successfully inserted content into ${filePath}` 
      };
    } catch (error) {
      console.error('Error inserting content into file:', error);
      return { 
        success: false, 
        error: `Failed to insert content: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  });
}
