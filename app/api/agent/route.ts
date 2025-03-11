import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  CopilotServiceAdapter,
  CopilotRuntimeChatCompletionRequest,
  CopilotRuntimeChatCompletionResponse
} from '@copilotkit/runtime';
import { NextRequest } from 'next/server';

class MistralAdapter implements CopilotServiceAdapter {
  private apiEndpoint: string;
  private apiKey: string;

  constructor() {
    this.apiEndpoint = 'https://api.mistral.ai/v1/chat/completions';
    this.apiKey = process.env.MISTRAL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('MISTRAL_API_KEY is not set in environment variables');
    }
  }

  async process(request: CopilotRuntimeChatCompletionRequest): Promise<CopilotRuntimeChatCompletionResponse> {
    try {
      const messages = (request.messages || []) as Array<{ role: string; content: string }>;
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "mistral-tiny",
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Mistral API Error: ${response.status} - ${error}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      return {
        data: response.body
      };
    } catch (error: unknown) {
      console.error("Mistral processing error:", {
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

const serviceAdapter = new MistralAdapter();
const runtime = new CopilotRuntime({
  actions: []
});

export const POST = async (req: NextRequest) => {
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: '/api/agent',
    });

    return await handleRequest(req);
  } catch (error) {
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Une erreur est survenue' }), 
      { status: 500 }
    );
  }
}; 