import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import { NextRequest } from 'next/server';

// Verify API key is present
if (!process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY) {
  throw new Error('NEXT_PUBLIC_GOOGLE_AI_API_KEY is not set in environment variables');
}

process.env.GOOGLE_AI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

const serviceAdapter = new GoogleGenerativeAIAdapter({
  model: "gemini-1.5-flash"
});

const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: '/api/chat',
    });

    return handleRequest(req);
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}; 