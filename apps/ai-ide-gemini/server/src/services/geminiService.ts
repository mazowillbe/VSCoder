import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
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
      systemInstruction: `You are an AI coding assistant integrated into an IDE. You help developers with:
- Understanding and explaining code
- Writing and refactoring code
- Debugging and problem-solving
- Answering technical questions
- Providing best practices and suggestions

Be concise, helpful, and accurate. Format code using markdown code blocks.`,
    });
  }

  async chat(message: string): Promise<string> {
    try {
      const chat = this.model.startChat({
        history: this.chatHistory.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.parts }],
        })),
      });

      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.text();

      this.chatHistory.push({ role: 'user', parts: message });
      this.chatHistory.push({ role: 'model', parts: text });

      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(-20);
      }

      return text;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to process chat message');
    }
  }

  clearHistory(): void {
    this.chatHistory = [];
  }

  getHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }
}
