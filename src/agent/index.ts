import * as vscode from 'vscode';
import { genkit, z } from 'genkit/beta';
import { googleAI } from '@genkit-ai/googleai';
import * as fs from 'fs';
import * as path from 'path';

// Import refactored modules
import { CodeQualityManager } from './code-quality-manager';
import { CreateReadFileTool, createListDirTool, createReplaceStringInFileTool, createInsertEditIntoFileTool } from './tools/file-tools';
import { createGrepSearchTool, createSemanticSearchTool, createFileSearchTool } from './tools/search-tools';
import { createRunInTerminalTool, createGetTerminalOutputTool } from './tools/terminal-tools';
import { createEditNotebookFileTool, createRunNotebookCellTool, createCopilotGetNotebookSummaryTool } from './tools/notebook-tools';
import { createGetVscodeApiTool, createGetErrorsTool, createGetChangedFilesTool, createCreateNewWorkspaceTool, createGetProjectSetupInfoTool, createInstallExtensionTool, createCreateNewJupyterNotebookTool } from './tools/vscode-tools';
import { createFetchWebpageTool, createTestSearchTool, createUpdateUserPreferencesTool, createListCodeUsagesTool } from './tools/utility-tools';

import { loadDotprompt, getFileStructure, sleep, extractRetryDelay } from './utils/prompt-utils';

// Global variables for chat session management
let ai: any = null;
let currentChatSession: any = null;
let sessionId: string | null = null;
let currentApiKey: string | null = null;
let currentModel: string | null = null;


// Initialize Genkit with default configuration
function initializeGenkit(): void {
  try {
    console.log('Initializing Genkit with default configuration...');
    
    // Initialize with placeholder configuration
    // Real configuration will be set when API key is provided
    console.log('Genkit initialized with placeholder configuration');
    console.log('Summarizer AI initialized with placeholder configuration');
  } catch (error) {
    console.error('Failed to initialize Genkit:', error);
  }
}

// Create a new Genkit instance with the provided API key and model
function createGenkitInstance(apiKey: string, model: string): void {
  try {
    console.log('Creating Genkit instance with API key and model:', model);
    
    // Configure Google AI
    const googleAIKey = apiKey;
    
         // Create Genkit instance with GoogleAI plugin
     ai = genkit({
       plugins: [
         googleAI({
           apiKey: googleAIKey
         })
       ],
       model: googleAI.model("gemini-2.0-flash")
     });
    
    // Store current configuration
    currentApiKey = apiKey;
    currentModel = model;
    
    console.log('Genkit instance created, now registering tools...');
    
    // Register all tools on the new instance
    registerAllTools();
    
    console.log('All tools registered successfully on new Genkit instance');
  } catch (error) {
    console.error('Failed to create Genkit instance:', error);
    throw error;
  }
}

// Update Genkit instance with new API key or model
function updateGenkitInstance(apiKey: string, model: string): void {
  try {
    console.log('Updating Genkit instance with new API key');
    
    // Create new instance
    createGenkitInstance(apiKey, model);
    
    console.log('New Genkit instances created and tools registered');
  } catch (error) {
    console.error('Failed to update Genkit instance:', error);
    throw error;
  }
}

let toolRefs: any[] | null = null;
// Register all tools on the Genkit instance
function registerAllTools(): void {
  if (!ai) {
    console.error('AI instance not available for tool registration');
    return;
  }

  try {
    // Register all tools directly to toolRefs
    toolRefs = [
        CreateReadFileTool(ai),
        createListDirTool(ai),
        createReplaceStringInFileTool(ai),
        createInsertEditIntoFileTool(ai),
        createGrepSearchTool(ai),
        createSemanticSearchTool(ai),
        createFileSearchTool(ai),
        createRunInTerminalTool(ai),
        createGetTerminalOutputTool(ai),
        createEditNotebookFileTool(ai),
        createRunNotebookCellTool(ai),
        createCopilotGetNotebookSummaryTool(ai),
        createGetVscodeApiTool(ai),
        createGetErrorsTool(ai),
        createGetChangedFilesTool(ai),
        createCreateNewWorkspaceTool(ai),
        createGetProjectSetupInfoTool(ai),
        createInstallExtensionTool(ai),
        createCreateNewJupyterNotebookTool(ai),
        createFetchWebpageTool(ai),
        createTestSearchTool(ai),
        createUpdateUserPreferencesTool(ai),
        createListCodeUsagesTool(ai),
      ];

    console.log('All tools registered successfully on new Genkit instance');
  } catch (error) {
    console.error('Failed to register tools:', error);
    throw error;
  }
}

// Function to generate responses using the agent with the Dotprompt
export const generateResponse = async (userRequest: string, apiKey?: string, model?: string, chatHistory?: string) => {
  const maxRetries = 5;
  let attempt = 0;
  
  // Debug: Check if this is a fresh call or continuation
  console.log('=== generateResponse called ===');
  console.log('Current chat session exists:', !!currentChatSession);
  console.log('Current session ID:', sessionId);
  console.log('Current API key:', currentApiKey ? 'set' : 'not set');
  console.log('Current model:', currentModel || 'not set');
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      
      // Only update Genkit instance if we don't have one or if the API key has actually changed
      if (apiKey && (!ai || currentApiKey !== apiKey || currentModel !== model)) {
            console.log('API key or model changed, updating Genkit instance');
            console.log('Current API key:', currentApiKey ? 'set' : 'not set', 'New API key:', apiKey ? 'set' : 'not set');
            console.log('Current model:', currentModel || 'not set', 'New model:', model || 'not set');
            updateGenkitInstance(apiKey, model || 'gemini-1.5-flash');
        
        // Reset chat session since we have a new AI instance
        currentChatSession = null;
        sessionId = null;
      }
      
      // Load the prompt template and extract system prompt early
      const promptTemplate = loadDotprompt();
      console.log('Prompt template loaded, length:', promptTemplate.length);
      console.log('Prompt template preview (first 200 chars):', promptTemplate.substring(0, 200));
      
      // Extract system prompt - everything before {{role "user"}}
      // Look for content before {{role "user"}} or use the entire template if not found
      let systemPrompt: string;
      const userRoleMatch = promptTemplate.indexOf('{{role "user"}}');
      if (userRoleMatch > 0) {
        systemPrompt = promptTemplate.substring(0, userRoleMatch).trim();
      } else {
        // If no user role marker found, use the entire template
        systemPrompt = promptTemplate;
      }
      
      console.log('System prompt extracted, length:', systemPrompt.length);
      console.log('System prompt preview (first 200 chars):', systemPrompt.substring(0, 200));
      
      // Validate system prompt
      if (!systemPrompt || systemPrompt.trim().length === 0) {
        console.error('System prompt is empty or invalid');
        return {
          text: 'Error: Unable to load system prompt. Please check your prompt file and try again.',
          operationProgress: [],
          pendingActions: []
        };
      }
      
      // Ensure system prompt contains essential content
      if (!systemPrompt.includes('You are an expert AI programming assistant')) {
        console.warn('System prompt may be incomplete - missing key instructions');
      }
      
      if (!currentChatSession) {
        console.log('Creating new chat session... (API key:', currentApiKey ? 'set' : 'not set', ', model:', currentModel || 'default', ')');
        if (ai) {
          try {
                                      // Create a new chat session using the Genkit instance with proper configuration
             currentChatSession = ai.chat({
               system: systemPrompt,
               config: {
                 temperature: 0.1,
                 maxOutputTokens: 8000
               },
               tools: toolRefs ?? [], // ✅ pass the references, not definitions
               maxTurns: 17,
             });
            
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('Chat session created successfully with ID:', sessionId);
          } catch (chatError) {
            console.error('Failed to create chat session:', chatError);
            return {
              text: 'Error: Unable to create chat session. Please check your API key and try again.',
              operationProgress: [],
              pendingActions: []
            };
          }
        } else {
          console.error('AI instance not available for chat session');
          return {
            text: 'Error: AI instance not properly initialized. Please try again.',
            operationProgress: [],
            pendingActions: []
          };
        }
      } else {
        console.log('Reusing existing chat session (ID:', sessionId?.substring(0, 20) + '...', ')');
      }
    
      // Gather comprehensive project context
      let projectContext: any = {};
      let workspace_info: any = {};
      let tasks: any = {};
      let workspaceFolder: any = {};
      let editorContext: any = {};
      
      // For chat sessions, we don't need to process chat history manually
      // Genkit handles this automatically through the chat session
      
      try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot) {
          // Build project context
          const currentDir = process.cwd();
          const workspaceDir = path.basename(workspaceRoot);
          
          projectContext = {
            workspace: workspaceDir,
            currentDirectory: currentDir,
            workspaceRoot: workspaceRoot,
            openFiles: vscode.window.visibleTextEditors.map(editor => ({
              name: path.basename(editor.document.fileName),
              path: editor.document.fileName,
              language: editor.document.languageId
            })),
            fileStructure: await getFileStructure(workspaceRoot)
          };
          
          // Build workspace info
          workspace_info = {
            name: vscode.workspace.name || 'Unknown',
            folders: vscode.workspace.workspaceFolders?.map(folder => ({
              name: folder.name,
              path: folder.uri.fsPath
            })) || [],
            configuration: vscode.workspace.getConfiguration()
          };
          
          // Build tasks
          try {
            const availableTasks = await vscode.tasks.fetchTasks();
            tasks = {
              available: availableTasks.map(task => ({
                name: task.name,
                source: task.source,
                definition: task.definition
              }))
            };
          } catch (taskError) {
            tasks = { available: [], error: 'Unable to fetch tasks' };
          }
          
          // Build workspace folder
          workspaceFolder = {
            name: workspaceDir,
            path: workspaceRoot,
            uri: vscode.workspace.workspaceFolders![0].uri.toString()
          };
          
          // Build editor context
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor) {
            editorContext = {
              fileName: path.basename(activeEditor.document.fileName),
              filePath: activeEditor.document.fileName,
              language: activeEditor.document.languageId,
              cursorPosition: {
                line: activeEditor.selection.active.line,
                character: activeEditor.selection.active.character
              },
              selection: activeEditor.selection.isEmpty ? null : {
                start: {
                  line: activeEditor.selection.start.line,
                  character: activeEditor.selection.start.character
                },
                end: {
                  line: activeEditor.selection.end.line,
                  character: activeEditor.selection.end.character
                }
              }
            };
          }
        }
      } catch (contextError) {
        console.error('Error gathering context:', contextError);
        projectContext = { error: 'Unable to gather workspace information' };
      }
      
      // Build the complete prompt by replacing placeholders with actual context
      const completePrompt = promptTemplate
        .replace('{{userRequest}}', userRequest)
        .replace('{{projectContext}}', JSON.stringify(projectContext, null, 2))
        .replace('{{workspace_info}}', JSON.stringify(workspace_info, null, 2))
        .replace('{{tasks}}', JSON.stringify(tasks, null, 2))
        .replace('{{workspaceFolder}}', JSON.stringify(workspaceFolder, null, 2))
        .replace('{{editorContext}}', JSON.stringify(editorContext, null, 2));

      console.log('Sending message to AI...');
      console.log('User request:', userRequest);
      console.log('System prompt length:', systemPrompt.length);
      console.log('Complete prompt length:', completePrompt.length);
      
      // Validate user request
      if (!userRequest || userRequest.trim().length === 0) {
        console.error('User request is empty or invalid');
        return {
          text: 'Error: User request is empty or invalid. Please try again.',
          operationProgress: [],
          pendingActions: []
        };
      }
      
      try {
        const response = await currentChatSession.send(userRequest);
        
        console.log('AI response received successfully');
        console.log('Response object:', response);
        console.log('Response text length:', response.text?.length || 0);
        
        if (!response || !response.text) {
          console.error('AI response is empty or invalid');
          return {
            text: 'Error: AI response is empty or invalid. Please try again.',
            operationProgress: [],
            pendingActions: []
          };
        }
        
        // Parse the AI response to extract pendingActions if present
        let pendingActions = [];
        let parsedResponse = response.text;
        
        try {
          // Check if the response contains JSON structure
          if (response.text && response.text.includes('pendingActions')) {
            // Try to extract JSON from the response - handle both plain JSON and markdown-wrapped JSON
            let jsonMatch = response.text.match(/\{[\s\S]*\}/);
            
            // If no match found, try to extract from markdown code blocks
            if (!jsonMatch) {
              const codeBlockMatch = response.text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
              if (codeBlockMatch) {
                jsonMatch = [codeBlockMatch[1], codeBlockMatch[1]]; // Match format: [fullMatch, group1]
              }
            }
            
            if (jsonMatch) {
              const jsonString = jsonMatch[0] || jsonMatch[1];
              const parsed = JSON.parse(jsonString);
              if (parsed.pendingActions && Array.isArray(parsed.pendingActions)) {
                pendingActions = parsed.pendingActions;
                // Use the text field from the parsed response
                parsedResponse = parsed.text || response.text;
              }
            }
          }
        } catch (parseError) {
          console.log('Could not parse AI response for pendingActions:', parseError);
          // Continue with original response if parsing fails
        }
        
        // Return the response in the expected format
        return {
          text: parsedResponse || 'Sorry, I encountered an error processing your request.',
          operationProgress: [],
          pendingActions: pendingActions
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error generating response (attempt ${attempt}/${maxRetries}):`, error);
        console.error('Error details:', error);
        
        // Check if this is a rate limit error that we should retry
        if (errorMessage.includes('429 Too Many Requests') || 
            errorMessage.includes('rate-limits') || 
            errorMessage.includes('quota') ||
            errorMessage.includes('retryDelay')) {
          
          if (attempt < maxRetries) {
            const retryDelay = extractRetryDelay(errorMessage);
            const exponentialDelay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
            const maxDelay = 60000; // Cap at 1 minute
            const actualDelay = Math.min(exponentialDelay, maxDelay);
            
            console.log(`Rate limit hit, waiting ${actualDelay}ms before retry ${attempt + 1}/${maxRetries}...`);
            
            // Create operation notification for rate limit retry
            createOperationNotification('retry', `Rate Limit Retry`, {
              message: `Rate limit reached, waiting ${Math.round(actualDelay / 1000)}s before retry`,
              attempt: attempt,
              maxRetries: maxRetries,
              delay: actualDelay
            });
            console.log(`Rate limit reached, waiting ${Math.round(actualDelay / 1000)}s before retry`);
            
            await sleep(actualDelay);
            continue; // Retry the request
          } else {
            console.log('Max retries reached for rate limit error');
            return {
              text: 'I\'m experiencing high API usage at the moment. Please wait a moment and try again, or consider upgrading your API plan for higher rate limits.',
              operationProgress: [],
              pendingActions: []
            };
          }
        }
        
        // For non-rate-limit errors, don't retry
        if (attempt === 1) {
          return {
            text: `I encountered an error processing your request: ${errorMessage}`,
            operationProgress: [],
            pendingActions: []
          };
        }
        
        // This shouldn't happen, but just in case
        return {
          text: 'Sorry, I encountered an unexpected error after multiple attempts. Please try again.',
          operationProgress: [],
          pendingActions: []
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error in generateResponse loop (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        return {
          text: `I encountered an error processing your request after multiple attempts: ${errorMessage}`,
          operationProgress: [],
          pendingActions: []
        };
      }
      
      // Wait a bit before retrying
      await sleep(1000);
    }
  }
  
  // This shouldn't happen, but just in case
  return {
    text: 'Sorry, I encountered an error processing your request after multiple attempts.',
    operationProgress: [],
    pendingActions: []
  };
};

// Global operation notifier function
let operationNotifier: ((operation: any) => void) | null = null;

// Function to set the operation notifier
export function setOperationNotifier(notifier: (operation: any) => void): void {
  operationNotifier = notifier;
}

// Function to create operation notifications
export function createOperationNotification(type: string, message: string, details: any): void {
  if (operationNotifier) {
    operationNotifier({
      type,
      message,
      details,
      timestamp: Date.now()
    });
  }
}

// Initialize Genkit when this module is loaded
initializeGenkit();

// Start Enhanced Code Quality monitoring
const lspManager = CodeQualityManager.getInstance();
lspManager.startMonitoring();
