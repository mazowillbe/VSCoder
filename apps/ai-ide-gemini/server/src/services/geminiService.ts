import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { ToolCall, ToolResult } from '../types/index.js';

interface ChatMessage {
  role: 'user' | 'model';
  parts: string | Array<{ text?: string; toolUse?: Record<string, unknown>; toolResult?: Record<string, unknown> }>;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any;
  private chatHistory: ChatMessage[] = [];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: `You are an AI coding assistant integrated into an IDE with WebContainer support. You help developers with:
- Understanding and explaining code
- Writing and refactoring code
- Debugging and problem-solving
- Answering technical questions
- Providing best practices and suggestions
- Reading and writing files in the WebContainer sandbox
- Executing terminal commands to test code
- Exploring the project structure

Be concise, helpful, and accurate. Format code using markdown code blocks.`,
    });
  }

  async chat(
    message: string,
    webcontainerContext?: {
      openFiles?: string[];
      recentTerminalOutput?: string;
      currentPath?: string;
    }
  ): Promise<{ text: string; toolCalls: ToolCall[] }> {
    try {
      let contextMessage = '';
      if (webcontainerContext) {
        contextMessage = `\n\n[WebContainer Context]:`;
        if (webcontainerContext.openFiles && webcontainerContext.openFiles.length > 0) {
          contextMessage += `\nOpen files: ${webcontainerContext.openFiles.join(', ')}`;
        }
        if (webcontainerContext.currentPath) {
          contextMessage += `\nCurrent path: ${webcontainerContext.currentPath}`;
        }
        if (webcontainerContext.recentTerminalOutput) {
          contextMessage += `\nRecent terminal output:\n${webcontainerContext.recentTerminalOutput}`;
        }
      }

      const fullMessage = message + contextMessage;

      const chat = this.model.startChat({
        history: this.chatHistory.map(msg => this.convertMessageToContent(msg)),
      });

      const result = await chat.sendMessage(fullMessage);
      const response = result.response;

      // Extract tool calls and text from response
      const toolCalls = this.extractToolCalls(response);
      const text = response.text();

      this.chatHistory.push({ role: 'user', parts: fullMessage });
      this.chatHistory.push({ role: 'model', parts: text });

      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(-20);
      }

      return { text, toolCalls };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to process chat message');
    }
  }

  private convertMessageToContent(msg: ChatMessage): Content {
    return {
      role: msg.role,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parts: typeof msg.parts === 'string' ? [{ text: msg.parts }] : msg.parts as any,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractToolCalls(response: any): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    // Extract tool use blocks from response
    if (response.functionCalls && Array.isArray(response.functionCalls)) {
      response.functionCalls.forEach((call: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        toolCalls.push({
          id: call.name + '_' + Math.random().toString(36).substring(2, 15),
          name: call.name,
          args: call.args || {},
        });
      });
    }

    return toolCalls;
  }

  async processToolResult(toolResult: ToolResult): Promise<void> {
    // Store tool results in chat history for context
    if (this.chatHistory.length > 0) {
      const lastMessage = this.chatHistory[this.chatHistory.length - 1];
      if (lastMessage.role === 'model') {
        // Add tool result message
        this.chatHistory.push({
          role: 'user',
          parts: `[Tool Result: ${toolResult.name}]\n${toolResult.result}`,
        });
      }
    }
  }

  clearHistory(): void {
    this.chatHistory = [];
  }

  getHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }
}
