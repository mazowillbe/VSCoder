import { Router } from 'express';
import { GeminiService } from '../services/geminiService.js';
import { AgentService } from '../services/agentService.js';
import { ChatRequest, ChatResponse } from '../types/index.js';

export const chatRouter = Router();
let geminiService: GeminiService | null = null;
let agentService: AgentService | null = null;

function getGeminiService(): GeminiService {
  if (!geminiService) {
    geminiService = new GeminiService();
  }
  return geminiService;
}

function getAgentService(): AgentService {
  if (!agentService) {
    agentService = new AgentService();
  }
  return agentService;
}

chatRouter.post('/', async (req, res, next) => {
  try {
    const { message, webcontainerContext } = req.body as ChatRequest;
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    
    const gemini = getGeminiService();
    const agent = getAgentService();

    // Clear agent logs for this request
    agent.clearLogs();

    // Get response from Gemini with tool awareness
    const { text: reply, toolCalls } = await gemini.chat(message, webcontainerContext);

    // Process tool calls
    for (const toolCall of toolCalls) {
      const result = await agent.executeTool(toolCall);
      await gemini.processToolResult(result);
    }

    const response: ChatResponse = {
      reply,
      operationLogs: agent.getOperationLogs(),
      toolCalls,
      filesModified: agent.getFilesWritten(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

chatRouter.delete('/history', async (_req, res, next) => {
  try {
    getGeminiService().clearHistory();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
