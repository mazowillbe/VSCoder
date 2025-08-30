import * as fs from 'fs';
import * as path from 'path';

// Function to load the Dotprompt content
export function loadDotprompt(): string {
  try {
    // Try multiple possible paths for the prompt file
    let promptPath: string;
    
    // First try: relative to current working directory (for development)
    promptPath = path.join(process.cwd(), 'prompts', 'vscode-assistant.prompt');
    if (fs.existsSync(promptPath)) {
      const promptContent = fs.readFileSync(promptPath, 'utf8');
      return promptContent;
    }
    
    // Second try: relative to __dirname (for compiled version)
    promptPath = path.join(__dirname, '..', '..', 'prompts', 'vscode-assistant.prompt');
    if (fs.existsSync(promptPath)) {
      const promptContent = fs.readFileSync(promptPath, 'utf8');
      return promptContent;
    }
    
    // Third try: relative to __dirname going up more levels
    promptPath = path.join(__dirname, '..', '..', '..', 'prompts', 'vscode-assistant.prompt');
    if (fs.existsSync(promptPath)) {
      const promptContent = fs.readFileSync(promptPath, 'utf8');
      return promptContent;
    }
    
    // If none of the paths work, throw an error
    throw new Error(`Prompt file not found. Tried paths: ${[
      path.join(process.cwd(), 'prompts', 'vscode-assistant.prompt'),
      path.join(__dirname, '..', '..', 'prompts', 'vscode-assistant.prompt'),
      path.join(__dirname, '..', '..', '..', 'prompts', 'vscode-assistant.prompt')
    ].join(', ')}`);
    
  } catch (error) {
    console.error('Error loading Dotprompt:', error);
    // Return a fallback prompt
    return `You are an expert AI programming assistant. Help the user with their request: {{userRequest}}`;
  }
}

// Function to structure chat history as JSON
export async function structureChatHistoryAsJson(chatHistory: string): Promise<any> {
  try {
    const lines = chatHistory.split('\n');
    const messages = lines.filter(line => line.trim().length > 0);
    
    return {
      messageCount: messages.length,
      recentMessages: messages.slice(-10), // Last 10 messages
      summary: `Chat contains ${messages.length} messages with recent activity`
    };
  } catch (error) {
    return {
      messageCount: 0,
      recentMessages: [],
      summary: 'Unable to parse chat history'
    };
  }
}

// Function to get file structure for project context
export async function getFileStructure(workspaceRoot: string): Promise<any> {
  try {
    const entries = fs.readdirSync(workspaceRoot);
    const files = entries.filter(entry => {
      try {
        return fs.statSync(path.join(workspaceRoot, entry)).isFile();
      } catch {
        return false;
      }
    });
    const folders = entries.filter(entry => {
      try {
        return fs.statSync(path.join(workspaceRoot, entry)).isDirectory();
      } catch {
        return false;
      }
    });
    
    return {
      files: files.slice(0, 20).map(file => ({
        name: file,
        path: path.join(workspaceRoot, file)
      })),
      folders: folders.slice(0, 20).map(folder => ({
        name: folder,
        path: path.join(workspaceRoot, folder)
      })),
      totalFiles: files.length,
      totalFolders: folders.length
    };
  } catch (error) {
    return { error: 'Unable to read directory structure' };
  }
}

// Professional chat summarization function
export async function summarizeChatHistory(chatHistory: string, apiKey: string): Promise<string> {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`Summarizing chat history (attempt ${attempt}/${maxRetries})...`);
      
      const summarizationPrompt = `You are an expert AI programming assistant specializing in conversation summarization. Your task is to create a concise, professional summary of a programming conversation that preserves all critical technical details, decisions, and context needed for the conversation to continue seamlessly.

**CRITICAL REQUIREMENTS:**
1. **Preserve Technical Context**: Keep all file paths, code snippets, error messages, and technical decisions
2. **Maintain User Intent**: Preserve the user's goals, preferences, and any specific requirements
3. **Keep Tool Usage**: Maintain information about which tools were used and their results
4. **Preserve File Changes**: Keep track of what files were created, modified, or deleted
5. **Maintain Project Context**: Preserve workspace information, project structure, and current state
6. **Be Concise**: Reduce length by 60-70% while keeping 100% of technical relevance

**FORMAT:**
- Use clear, professional language
- Structure as bullet points for easy reading
- Group related information logically
- Highlight any pending actions or unresolved issues

**INPUT CHAT HISTORY:**
${chatHistory}

**OUTPUT:**
Provide a concise summary that preserves all technical details and context.`;

      // For now, implement a simple summarization approach
      // In a real implementation, this would call an AI service
      const lines = chatHistory.split('\n');
      const recentMessages = lines.slice(-20); // Keep last 20 lines as fallback
      
      return `[Summary: ${lines.length} messages processed]\n${recentMessages.join('\n')}`;
      
    } catch (error) {
      console.error(`Summarization attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('Non-rate-limit error during summarization, using fallback');
        // Return fallback summary that preserves the most recent messages
        const lines = chatHistory.split('\n');
        const recentMessages = lines.slice(-20); // Keep last 20 lines as fallback
        return `[Summary failed - keeping recent context]\n${recentMessages.join('\n')}`;
      }
      
      // This shouldn't happen, but just in case
      const lines = chatHistory.split('\n');
      const recentMessages = lines.slice(-20);
      return `[Summary failed after multiple attempts - keeping recent context]\n${recentMessages.join('\n')}`;
    }
  }
  
  // This shouldn't happen, but just in case
  const lines = chatHistory.split('\n');
  const recentMessages = lines.slice(-20);
  return `[Summary failed after multiple attempts - keeping recent context]\n${recentMessages.join('\n')}`;
}

// Helper function to sleep for a given number of milliseconds
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to extract retry delay from error message
export function extractRetryDelay(errorMessage: string): number {
  try {
    const retryMatch = errorMessage.match(/retryDelay":"(\d+)s"/);
    if (retryMatch) {
      return parseInt(retryMatch[1]) * 1000; // Convert seconds to milliseconds
    }
    
    // Check for rate limit patterns and provide reasonable defaults
    if (errorMessage.includes('429 Too Many Requests') || errorMessage.includes('rate-limits')) {
      return 10000; // 10 seconds default for rate limits
    }
    
    return 5000; // 5 seconds default for other errors
  } catch {
    return 5000; // Fallback to 5 seconds
  }
}
