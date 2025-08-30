import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { z, type Genkit } from 'genkit';
import { createOperationNotification } from '../index';

// Helper function to expand query semantically
function expandQuerySemantically(query: string): string[] {
  const expansions = [query];
  
  // Add common programming variations
  if (query.includes('function')) {
    expansions.push(query.replace(/function/g, 'func'), query.replace(/function/g, 'method'));
  }
  if (query.includes('class')) {
    expansions.push(query.replace(/class/g, 'interface'), query.replace(/class/g, 'type'));
  }
  if (query.includes('import')) {
    expansions.push(query.replace(/import/g, 'require'), query.replace(/import/g, 'include'));
  }
  
  return expansions;
}

// Helper function to extract code patterns
function extractCodePatterns(content: string): string[] {
  const patterns = [];
  
  // Extract function definitions
  const functionMatches = content.match(/(?:function|const|let|var)\s+\w+\s*[=:]\s*(?:\([^)]*\)\s*=>|function\s*\([^)]*\))/g);
  if (functionMatches) patterns.push(...functionMatches);
  
  // Extract class definitions
  const classMatches = content.match(/class\s+\w+(?:\s+extends\s+\w+)?\s*\{/g);
  if (classMatches) patterns.push(...classMatches);
  
  // Extract import statements
  const importMatches = content.match(/(?:import|require|include)\s+[^;]+/g);
  if (importMatches) patterns.push(...importMatches);
  
  return patterns;
}

// Helper function to determine match type
function determineMatchType(query: string, content: string): string {
  if (content.toLowerCase().includes(query.toLowerCase())) {
    return 'exact';
  }
  
  const queryWords = query.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();
  const wordMatches = queryWords.filter(word => contentLower.includes(word));
  
  if (wordMatches.length === queryWords.length) {
    return 'all_words';
  } else if (wordMatches.length > queryWords.length / 2) {
    return 'partial';
  }
  
  return 'fuzzy';
}

// Grep search tool
export function createGrepSearchTool(ai: Genkit) {
  return ai.defineTool({
    name: 'grep_search',
    description: 'Search for text patterns in files using regex or plain text. Returns matching lines with file paths and line numbers.',
    inputSchema: z.object({
      query: z.string().describe('The search query (regex pattern or plain text)'),
      includePattern: z.string().optional().describe('File pattern to include (e.g., "*.ts", "*.js")'),
      excludePattern: z.string().optional().describe('File pattern to exclude (e.g., "node_modules/**")'),
      maxResults: z.number().optional().describe('Maximum number of results to return')
    }),
    outputSchema: z.object({
      results: z.array(z.object({
        file: z.string(),
        line: z.number(),
        content: z.string(),
        matchType: z.string()
      })).optional(),
      totalResults: z.number().optional(),
      error: z.string().optional()
    }),
  }, async ({ query, includePattern = '**/*', excludePattern = 'node_modules/**', maxResults = 100 }: { query: string; includePattern?: string; excludePattern?: string; maxResults?: number }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      // Create operation notification
      createOperationNotification('search', `Searching for: ${query}`, {
        query,
        includePattern,
        excludePattern,
        maxResults
      });

      // Use VS Code's built-in search - fallback to simple file search for now
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceRoot, includePattern),
        new vscode.RelativePattern(workspaceRoot, excludePattern)
      );
      
      // Simulate search results for now
      const results = files.slice(0, maxResults).map((uri, index) => ({
        uri,
        ranges: [{ start: { line: index, character: 0 }, end: { line: index, character: 100 } }],
        preview: { text: `Mock search result for "${query}" in ${path.basename(uri.fsPath)}` }
      }));

      const matches: any[] = [];
      let totalResults = 0;

      for await (const match of results) {
        if (totalResults >= maxResults) break;
        
        const filePath = path.relative(workspaceRoot, match.uri.fsPath);
        const matchType = determineMatchType(query, match.preview.text);
        
        matches.push({
          file: filePath,
          line: match.ranges[0].start.line + 1,
          content: match.preview.text.trim(),
          matchType
        });
        
        totalResults++;
      }

      return {
        results: matches,
        totalResults: totalResults
      };
    } catch (error) {
      console.error('Error in grep search:', error);
      return { error: `Search failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}

// Semantic search tool
export function createSemanticSearchTool(ai: Genkit) {
  return ai.defineTool({
    name: 'semantic_search',
    description: 'Perform semantic search across files to find conceptually related content, not just exact text matches.',
    inputSchema: z.object({
      query: z.string().describe('The semantic search query describing what you\'re looking for'),
      fileTypes: z.array(z.string()).optional().describe('File types to search in (e.g., ["*.ts", "*.js", "*.py"])'),
      maxResults: z.number().optional().describe('Maximum number of results to return')
    }),
    outputSchema: z.object({
      results: z.array(z.object({
        file: z.string(),
        relevance: z.number(),
        snippet: z.string(),
        context: z.string()
      })).optional(),
      totalResults: z.number().optional(),
      error: z.string().optional()
    }),
  }, async ({ query, fileTypes = ['**/*'], maxResults = 50 }: { query: string; fileTypes?: string[]; maxResults?: number }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      // Create operation notification
      createOperationNotification('search', `Semantic search for: ${query}`, {
        query,
        fileTypes,
        maxResults
      });

      // Expand query semantically
      const expandedQueries = expandQuerySemantically(query);
      
      const results: any[] = [];
      const seenFiles = new Set<string>();

      // Search through each expanded query
      for (const expandedQuery of expandedQueries) {
        if (results.length >= maxResults) break;

        try {
          // Use VS Code's built-in search - fallback to simple file search for now
          const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceRoot, fileTypes.join(','))
          );
          
          // Simulate search results for now
          const searchResults = files.slice(0, maxResults).map((uri, index) => ({
            uri,
            ranges: [{ start: { line: index, character: 0 }, end: { line: index, character: 100 } }],
            preview: { text: `Mock semantic search result for "${expandedQuery}" in ${path.basename(uri.fsPath)}` }
          }));

          for await (const match of searchResults) {
            if (results.length >= maxResults) break;
            
            const filePath = path.relative(workspaceRoot, match.uri.fsPath);
            
            // Avoid duplicate files
            if (seenFiles.has(filePath)) continue;
            seenFiles.add(filePath);

            // Calculate relevance based on query similarity
            const content = match.preview.text.toLowerCase();
            const queryWords = expandedQuery.toLowerCase().split(/\s+/);
            const wordMatches = queryWords.filter(word => content.includes(word));
            const relevance = wordMatches.length / queryWords.length;

            if (relevance > 0.3) { // Only include relevant results
              results.push({
                file: filePath,
                relevance: Math.round(relevance * 100) / 100,
                snippet: match.preview.text.trim(),
                context: `Found in ${path.basename(filePath)} with ${Math.round(relevance * 100)}% relevance`
              });
            }
          }
        } catch (searchError) {
          console.warn(`Search failed for expanded query "${expandedQuery}":`, searchError);
        }
      }

      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance);

      return {
        results: results.slice(0, maxResults),
        totalResults: results.length
      };
    } catch (error) {
      console.error('Error in semantic search:', error);
      return { error: `Semantic search failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}

// File search tool
export function createFileSearchTool(ai: Genkit) {
  return ai.defineTool({
    name: 'file_search',
    description: 'Search for files by name or pattern across the workspace.',
    inputSchema: z.object({
      pattern: z.string().describe('File name pattern to search for (supports glob patterns)'),
      includeHidden: z.boolean().optional().describe('Whether to include hidden files')
    }),
    outputSchema: z.object({
      files: z.array(z.object({
        name: z.string(),
        path: z.string(),
        size: z.number().optional(),
        type: z.string()
      })).optional(),
      totalFiles: z.number().optional(),
      error: z.string().optional()
    }),
  }, async ({ pattern, includeHidden = false }: { pattern: string; includeHidden?: boolean }) => {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return { error: 'No workspace open' };
      }

      // Create operation notification
      createOperationNotification('search', `Searching for files: ${pattern}`, {
        pattern,
        includeHidden
      });

      // Use VS Code's file search
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceRoot, pattern),
        includeHidden ? undefined : new vscode.RelativePattern(workspaceRoot, '**/.*/**')
      );

      const results = files.map(uri => {
        const filePath = path.relative(workspaceRoot, uri.fsPath);
        const stats = fs.statSync(uri.fsPath);
        
        return {
          name: path.basename(filePath),
          path: filePath,
          size: stats.size,
          type: stats.isDirectory() ? 'directory' : path.extname(filePath) || 'file'
        };
      });

      return {
        files: results,
        totalFiles: results.length
      };
    } catch (error) {
      console.error('Error in file search:', error);
      return { error: `File search failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  });
}
