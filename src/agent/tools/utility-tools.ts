import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { z, type Genkit } from 'genkit';
import { createOperationNotification } from '../index';


// JSON value schema for safe tool IO
const JSONValue: z.ZodType<unknown> = z.lazy(() =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(JSONValue),
      z.record(JSONValue)
    ])
  );
  

// Fetch webpage tool
export function createFetchWebpageTool(ai: Genkit) {
  return ai.defineTool({
    name: 'fetch_webpage',
    description: 'Fetch content from a webpage URL.',
    inputSchema: z.object({
      url: z.string().describe('The URL to fetch content from'),
      timeout: z.number().optional().describe('Timeout in milliseconds (defaults to 10000)')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      content: z.string().optional(),
      statusCode: z.number().optional(),
      headers: z.any().optional(),
      error: z.string().optional()
    }),
  }, async ({ url, timeout = 10000 }: { url: string; timeout?: number }) => {
    try {
      // Create operation notification
      createOperationNotification('read', `Fetching webpage: ${url}`, {
        url,
        timeout
      });

      // For now, we'll simulate web fetching since direct HTTP requests require additional setup
      // In a real implementation, this would use node-fetch or similar HTTP client
      const mockResponse = {
        success: true,
        content: `Mock content from ${url}\n\nThis is a simulation. Real web fetching requires HTTP client setup.`,
        statusCode: 200,
        headers: {
          'content-type': 'text/html',
          'content-length': '1000'
        }
      };

      return mockResponse;
    } catch (error) {
      console.error('Error fetching webpage:', error);
      return { 
        success: false, 
        error: `Failed to fetch webpage: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  });
}

// Test search tool
export function createTestSearchTool(ai: Genkit) {
  return ai.defineTool({
    name: 'test_search',
    description: 'Test the search functionality with a simple query.',
    inputSchema: z.object({
      query: z.string().describe('The test search query'),
      searchType: z.enum(['grep', 'semantic', 'file']).optional().describe('Type of search to test')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      results: z.array(z.any()).optional(),
      message: z.string().optional(),
      error: z.string().optional()
    }),
  }, async ({ query, searchType = 'grep' }: { query: string; searchType?: string }) => {
    try {
      // Create operation notification
      createOperationNotification('search', `Testing ${searchType} search: ${query}`, {
        query,
        searchType
      });

      // This is a test tool that simulates search results
      const mockResults = [
        {
          file: 'test-file.txt',
          line: 1,
          content: `Test content containing: ${query}`,
          matchType: 'exact'
        },
        {
          file: 'another-file.js',
          line: 15,
          content: `Another match for: ${query}`,
          matchType: 'partial'
        }
      ];

      return {
        success: true,
        results: mockResults,
        message: `Test ${searchType} search completed successfully with query: "${query}"`
      };
    } catch (error) {
      console.error('Error in test search:', error);
      return { 
        success: false, 
        error: `Test search failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  });
}

// Update user preferences tool

  export function createUpdateUserPreferencesTool(ai: Genkit) {
    return ai.defineTool(
      {
        name: 'update_user_preferences',
        description: 'Update user preferences and settings for the AI assistant.',
        inputSchema: z.object({
          preference: z.string().min(1).describe('The preference key to update'),
          value: z.string().describe('The new value for the preference (JSON-serializable)'),
          category: z.enum(['ai', 'ui', 'tools']).optional().describe('Preference category')
        }),
        outputSchema: z.object({
          success: z.boolean(),
          message: z.string().optional(),
          error: z.string().optional()
        })
      },
      async (args: { preference: string; value: string; category?: 'ai'|'ui'|'tools' }) => {
        const { preference, value, category = 'ai' } = args;
        try {
          createOperationNotification('write', `Updating user preference: ${preference}`, {
            preference,
            value,
            category
          });
  
          // Persist using VS Code configuration (Global by default)
          // Change 'yourExtensionId' to your real configuration section.
          const section = `yourExtensionId.${category}.${preference}`;
          await vscode.workspace
            .getConfiguration()
            .update(section, value as any, vscode.ConfigurationTarget.Global);
  
          return {
            success: true,
            message: `Updated ${section} = ${JSON.stringify(value)}`
          };
        } catch (error) {
          console.error('Error updating user preferences:', error);
          return {
            success: false,
            error: `Failed to update preferences: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
    );
  }
// List code usages tool
export function createListCodeUsagesTool(ai: Genkit) {
  return ai.defineTool({
    name: 'list_code_usages',
    description: 'Find all usages of a specific code element (function, class, variable) across the workspace.',
    inputSchema: z.object({
      symbol: z.string().describe('The symbol to search for (function name, class name, variable, etc.)'),
      fileTypes: z.array(z.string()).optional().describe('File types to search in (e.g., ["*.ts", "*.js"])'),
      maxResults: z.number().optional().describe('Maximum number of results to return')
    }),
    outputSchema: z.object({
      usages: z.array(z.object({
        file: z.string(),
        line: z.number(),
        context: z.string(),
        type: z.string()
      })).optional(),
      totalUsages: z.number().optional(),
      error: z.string().optional()
    }),
  }, async ({ symbol, fileTypes = ['**/*'], maxResults = 100 }: { symbol: string; fileTypes?: string[]; maxResults?: number }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      // Create operation notification
      createOperationNotification('search', `Finding usages of: ${symbol}`, {
        symbol,
        fileTypes,
        maxResults
      });

      // Use VS Code's symbol search - fallback to simple file search for now
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceRoot, fileTypes.join(','))
      );
      
      // Simulate search results for now
      const results = files.slice(0, maxResults).map((uri, index) => ({
        uri,
        ranges: [{ start: { line: index, character: 0 }, end: { line: index, character: 100 } }],
        preview: { text: `Mock symbol search result for "${symbol}" in ${path.basename(uri.fsPath)}` }
      }));

      const usages: any[] = [];
      let totalUsages = 0;

      for await (const match of results) {
        if (totalUsages >= maxResults) break;
        
        const filePath = path.relative(workspaceRoot, match.uri.fsPath);
        const context = match.preview.text.trim();
        
        // Determine usage type based on context
        let type = 'usage';
        if (context.includes('function') || context.includes('def')) type = 'definition';
        else if (context.includes('import') || context.includes('require')) type = 'import';
        else if (context.includes('class') || context.includes('extends')) type = 'class';
        
        usages.push({
          file: filePath,
          line: match.ranges[0].start.line + 1,
          context: context,
          type: type
        });
        
        totalUsages++;
      }

      return {
        usages: usages,
        totalUsages: totalUsages
      };
    } catch (error) {
      console.error('Error finding code usages:', error);
      return { error: `Failed to find code usages: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}
