import { Request, Response } from 'express';
import { z } from 'zod';
import { GeminiService } from '../services/llm/gemini.service';

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message query cannot be empty'),
});

export class ChatController {
  static async streamChat(req: Request, res: Response): Promise<void> {
    const vendorId = req.vendorId!;
    const { message } = req.body;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (type: 'status' | 'chunk' | 'error' | 'done', payload: any) => {
      res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
    };

    try {
      await GeminiService.streamAnalyticsChat(message, vendorId, {
        onStatus: (statusMessage) => {
          sendEvent('status', { message: statusMessage });
        },
        onChunk: (chunkText) => {
          sendEvent('chunk', { text: chunkText });
        },
        onError: (err) => {
          console.error('Chat stream error:', err);
          sendEvent('error', { error: err.message || 'Stream processing failed' });
          sendEvent('done', {});
          res.end();
        },
      });

      sendEvent('done', {});
      res.end();
    } catch (error: any) {
      console.error('Fatal chat controller error:', error);
      sendEvent('error', { error: error.message || 'Internal server error' });
      sendEvent('done', {});
      res.end();
    }
  }
}
