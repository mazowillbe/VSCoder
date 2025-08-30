import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { z, type Genkit } from 'genkit';
import { createOperationNotification } from '../index';

// Helper function to analyze notebook structure
function analyzeNotebook(content: string): any {
  const cells = content.match(/#\s*%%\s*\[.*?\]\s*\n([\s\S]*?)(?=#\s*%%|$)/g) || [];
  
  return {
    totalCells: cells.length,
    cellTypes: cells.map((cell: string) => {
      const typeMatch = cell.match(/#\s*%%\s*\[(.*?)\]/);
      return typeMatch ? typeMatch[1].trim() : 'unknown';
    }),
    hasCode: cells.some((cell: string) => cell.includes('```python') || cell.includes('```javascript')),
    hasMarkdown: cells.some((cell: string) => cell.includes('```markdown'))
  };
}

// Helper function to analyze code complexity
function analyzeCodeComplexity(code: string): any {
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  const functions = (code.match(/(?:def|function)\s+\w+\s*\(/g) || []).length;
  const classes = (code.match(/class\s+\w+/g) || []).length;
  const imports = (code.match(/(?:import|from)\s+[\w\s,]+/g) || []).length;
  
  return {
    linesOfCode: lines.length,
    functions: functions,
    classes: classes,
    imports: imports,
    complexity: Math.min(10, Math.floor((functions + classes + imports) / 3))
  };
}

// Helper function to estimate cell runtime
function estimateCellRuntime(cellType: string, code: string): string {
  if (cellType === 'markdown') return 'instant';
  
  const complexity = analyzeCodeComplexity(code);
  const estimatedTime = complexity.linesOfCode * 0.1 + complexity.functions * 0.5 + complexity.classes * 1;
  
  if (estimatedTime < 1) return 'fast (<1s)';
  if (estimatedTime < 5) return 'medium (1-5s)';
  if (estimatedTime < 30) return 'slow (5-30s)';
  return 'very slow (>30s)';
}

// Edit notebook file tool
export function createEditNotebookFileTool(ai: Genkit) {
  return ai.defineTool({
    name: 'edit_notebook_file',
    description: 'Edit a Jupyter notebook file by modifying specific cells or adding new content.',
    inputSchema: z.object({
      filePath: z.string().describe('The relative path of the notebook file to edit'),
      cellIndex: z.number().optional().describe('Index of the cell to edit (0-based)'),
      cellType: z.enum(['code', 'markdown', 'raw']).optional().describe('Type of cell to create/edit'),
      content: z.string().describe('The content to put in the cell'),
      action: z.enum(['replace', 'insert', 'append']).describe('Action to perform: replace cell, insert new cell, or append to existing')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional()
    }),
  }, async ({ filePath, cellIndex, cellType = 'code', content, action }: { filePath: string; cellIndex?: number; cellType?: string; content: string; action: string }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { success: false, error: 'No workspace open' };
      }

      const fullPath = path.join(workspaceRoot, filePath);
      
      if (!fs.existsSync(fullPath)) {
        return { success: false, error: `Notebook file not found: ${filePath}` };
      }

      const notebookContent = fs.readFileSync(fullPath, 'utf8');
      const cells = notebookContent.split(/#\s*%%\s*\[.*?\]\s*\n/);
      
      let newContent = '';
      
      if (action === 'replace' && cellIndex !== undefined) {
        // Replace existing cell
        if (cellIndex >= cells.length) {
          return { success: false, error: `Cell index ${cellIndex} out of range. Notebook has ${cells.length} cells.` };
        }
        
        const cellHeader = notebookContent.match(/#\s*%%\s*\[.*?\]\s*\n/g) || [];
        const beforeCells = cells.slice(0, cellIndex);
        const afterCells = cells.slice(cellIndex + 1);
        
        newContent = beforeCells.join('# %% [code]\n') + 
                    `# %% [${cellType}]\n${content}\n` +
                    afterCells.join('# %% [code]\n');
      } else if (action === 'insert' && cellIndex !== undefined) {
        // Insert new cell at specific index
        const cellHeader = notebookContent.match(/#\s*%%\s*\[.*?\]\s*\n/g) || [];
        const beforeCells = cells.slice(0, cellIndex);
        const afterCells = cells.slice(cellIndex);
        
        newContent = beforeCells.join('# %% [code]\n') + 
                    `# %% [${cellType}]\n${content}\n` +
                    afterCells.join('# %% [code]\n');
      } else if (action === 'append') {
        // Append new cell at the end
        newContent = notebookContent + `\n# %% [${cellType}]\n${content}\n`;
      } else {
        return { success: false, error: 'Invalid action or missing cellIndex for replace/insert actions' };
      }

      fs.writeFileSync(fullPath, newContent, 'utf8');

      // Create operation notification
      const fileName = path.basename(filePath);
      createOperationNotification('write', `Edited notebook: ${fileName}`, {
        filePath,
        fileName,
        fileType: 'notebook',
        action,
        cellType,
        cellIndex: cellIndex || 'end'
      });

      return { 
        success: true, 
        message: `Successfully ${action}ed ${cellType} cell in ${filePath}` 
      };
    } catch (error) {
      console.error('Error editing notebook file:', error);
      return { 
        success: false, 
        error: `Failed to edit notebook: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  });
}

// Run notebook cell tool
export function createRunNotebookCellTool(ai: Genkit) {
  return ai.defineTool({
    name: 'run_notebook_cell',
    description: 'Execute a specific cell in a Jupyter notebook and return the output.',
    inputSchema: z.object({
      filePath: z.string().describe('The relative path of the notebook file'),
      cellIndex: z.number().describe('Index of the cell to run (0-based)'),
      timeout: z.number().optional().describe('Timeout in seconds (defaults to 60)')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      output: z.string().optional(),
      error: z.string().optional(),
      executionTime: z.number().optional()
    }),
  }, async ({ filePath, cellIndex, timeout = 60 }: { filePath: string; cellIndex: number; timeout?: number }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { success: false, error: 'No workspace open' };
      }

      const fullPath = path.join(workspaceRoot, filePath);
      
      if (!fs.existsSync(fullPath)) {
        return { success: false, error: `Notebook file not found: ${filePath}` };
      }

      // Create operation notification
      const fileName = path.basename(filePath);
      createOperationNotification('command', `Running notebook cell ${cellIndex} in ${fileName}`, {
        filePath,
        fileName,
        fileType: 'notebook',
        cellIndex,
        timeout
      });

      // For now, we'll simulate cell execution since direct Jupyter execution requires additional setup
      // In a real implementation, this would use the Jupyter API or VS Code's notebook execution
      const startTime = Date.now();
      
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const executionTime = (Date.now() - startTime) / 1000;

      return {
        success: true,
        output: `Cell ${cellIndex} executed successfully in ${executionTime.toFixed(2)}s\nNote: This is a simulation. Real execution requires Jupyter kernel setup.`,
        executionTime: executionTime
      };
    } catch (error) {
      console.error('Error running notebook cell:', error);
      return { 
        success: false, 
        error: `Failed to run notebook cell: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  });
}

// Get notebook summary tool
export function createCopilotGetNotebookSummaryTool(ai: Genkit) {
  return ai.defineTool({
    name: 'copilot_get_notebook_summary',
    description: 'Analyze a Jupyter notebook and provide a comprehensive summary of its structure, content, and purpose.',
    inputSchema: z.object({
      filePath: z.string().describe('The relative path of the notebook file to analyze')
    }),
    outputSchema: z.object({
      summary: z.string().optional(),
      structure: z.object({
        totalCells: z.number(),
        cellTypes: z.array(z.string()),
        hasCode: z.boolean(),
        hasMarkdown: z.boolean()
      }).optional(),
      complexity: z.object({
        linesOfCode: z.number(),
        functions: z.number(),
        classes: z.number(),
        imports: z.number(),
        overallComplexity: z.number()
      }).optional(),
      error: z.string().optional()
    }),
  }, async ({ filePath }: { filePath: string }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      const fullPath = path.join(workspaceRoot, filePath);
      
      if (!fs.existsSync(fullPath)) {
        return { error: `Notebook file not found: ${filePath}` };
      }

      // Create operation notification
      const fileName = path.basename(filePath);
      createOperationNotification('read', `Analyzing notebook: ${fileName}`, {
        filePath,
        fileName,
        fileType: 'notebook'
      });

      const content = fs.readFileSync(fullPath, 'utf8');
      const structure = analyzeNotebook(content);
      
      // Extract code content for complexity analysis
      const codeCells = content.match(/#\s*%%\s*\[.*?\]\s*\n([\s\S]*?)(?=#\s*%%|$)/g) || [];
      const allCode = codeCells.join('\n');
      const complexity = analyzeCodeComplexity(allCode);

      // Generate summary
      const summary = `Notebook Analysis for ${fileName}:
 - Total cells: ${structure.totalCells}
 - Cell types: ${structure.cellTypes.join(', ')}
 - Code cells: ${structure.hasCode ? 'Yes' : 'No'}
 - Markdown cells: ${structure.hasMarkdown ? 'Yes' : 'No'}
 - Lines of code: ${complexity.linesOfCode}
 - Functions: ${complexity.functions}
 - Classes: ${complexity.classes}
 - Imports: ${complexity.imports}
 - Overall complexity: ${complexity.complexity}/10`;

      return {
        summary,
        structure,
        complexity
      };
    } catch (error) {
      console.error('Error analyzing notebook:', error);
      return { error: `Failed to analyze notebook: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}
