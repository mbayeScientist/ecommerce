import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';

import { NextRequest } from 'next/server';
import { GeminiAdapter } from '@/lib/gemini-adapter';

const runtime = new CopilotRuntime();
const adapter = new GeminiAdapter();

export async function POST(req: NextRequest) {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: adapter,
    endpoint: '/api/copilotkit',
  });

  return handleRequest(req);
} 