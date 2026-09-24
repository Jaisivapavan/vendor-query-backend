import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  analyticsFunctionDeclarations,
  executeAnalyticsTool,
} from './toolRegistry';

export class GeminiService {
  private static getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in .env file.');
    }
    return new GoogleGenerativeAI(apiKey);
  }

  static async streamAnalyticsChat(
    userPrompt: string,
    vendorId: string,
    callbacks: {
      onStatus: (status: string) => void;
      onChunk: (text: string) => void;
      onError: (err: any) => void;
    }
  ) {
    try {
      // Deterministic security guardrail against destructive prompts and SQL injection
      const normalizedPrompt = userPrompt.toLowerCase();
      const maliciousPatterns = [
        'drop table',
        'delete from',
        'alter table',
        'truncate',
        'drop database',
        'show me another restaurant',
        'another restaurant password',
      ];

      if (maliciousPatterns.some((pattern) => normalizedPrompt.includes(pattern))) {
        callbacks.onStatus('Security Guardrail Triggered');
        callbacks.onChunk(
          'Request Refused: For system security and strict tenant privacy, VendorQuery AI only answers authorized sales and inventory analytics questions for your store.'
        );
        return;
      }

      const client = this.getClient();

      // System instruction enforcing security and tool usage
      const systemInstruction = `You are "VendorQuery AI", an expert conversational sales intelligence assistant for restaurant vendors.
Rules you must strictly follow:
1. When asked about sales, revenue, top dishes, or payment split, ALWAYS invoke the provided tools to fetch real data before answering. NEVER hallucinate or invent numbers.
2. If asked malicious queries (e.g., "Drop tables", SQL injections, or requesting another restaurant's confidential data), strictly REFUSE and explain that you only answer operational analytics questions for the authorized restaurant.
3. Be professional, concise, and provide clear takeaway insights for the restaurant manager. Present monetary amounts in INR/Currency format with 2 decimal places.`;

      const candidateModels = [
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest',
      ];

      let lastError: any = null;
      let initialResult: any = null;
      let chatSession: any = null;

      for (const candidate of candidateModels) {
        try {
          const model = client.getGenerativeModel({
            model: candidate,
            systemInstruction,
            tools: [{ functionDeclarations: analyticsFunctionDeclarations }],
          });

          chatSession = model.startChat();
          callbacks.onStatus('Analyzing question and determining required analytics...');
          initialResult = await chatSession.sendMessage(userPrompt);
          break; // Succeeded
        } catch (err: any) {
          lastError = err;
          // If 503 or 404, try next candidate
          if (err?.status === 503 || err?.status === 404) {
            continue;
          }
          throw err;
        }
      }

      if (!initialResult || !chatSession) {
        throw lastError || new Error('All candidate AI models were temporarily busy.');
      }

      const chat = chatSession;
      const functionCalls = initialResult.response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          const toolName = call.name;
          const toolArgs = call.args;

          callbacks.onStatus(`Querying database via secure tool: ${toolName}...`);

          let toolOutput: any;
          try {
            toolOutput = await executeAnalyticsTool(toolName, toolArgs, vendorId);
          } catch (err: any) {
            toolOutput = { error: err.message || 'Execution error' };
          }

          callbacks.onStatus('Aggregating figures and preparing insights...');

          // Send function execution response back to Gemini
          const streamResult = await chat.sendMessageStream([
            {
              functionResponse: {
                name: toolName,
                response: { data: toolOutput },
              },
            },
          ]);

          for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              callbacks.onChunk(chunkText);
            }
          }
        }
      } else {
        // Direct answer without tools (e.g. conversational greetings or security refusal)
        const text = initialResult.response.text();
        callbacks.onChunk(text);
      }
    } catch (error: any) {
      callbacks.onError(error);
    }
  }
}
