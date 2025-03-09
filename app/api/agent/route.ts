import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import { NextRequest } from 'next/server';

interface Message {
  role: string;
  content: string;
}

class OllamaAdapter {
  private apiEndpoint: string;

  constructor() {
    const ollamaHost = process.env.OLLAMA_HOST || 'localhost';
    const ollamaPort = process.env.OLLAMA_PORT || '11434';
    this.apiEndpoint = `http://${ollamaHost}:${ollamaPort}/api/chat`;
    console.log('Initializing OllamaAdapter with endpoint:', this.apiEndpoint);
  }

  private async checkOllamaAvailability() {
    try {
      console.log("Checking Ollama availability at:", this.apiEndpoint);
      
      const testResponse = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama2-uncensored",
          messages: [{ role: "user", content: "test" }],
          stream: false
        })
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error("Ollama test failed with status:", testResponse.status, "Error:", errorText);
        throw new Error(`Ollama test failed: ${testResponse.status} - ${errorText}`);
      }

      const testResult = await testResponse.json();
      console.log("Test response:", testResult);
      
      if (!testResult.message) {
        console.error("Invalid response format:", testResult);
        throw new Error('Invalid response format from Ollama test');
      }

      console.log("Ollama server is available");
      return true;
    } catch (error) {
      console.error("Ollama availability check failed:", {
        error: error.message,
        stack: error.stack,
        endpoint: this.apiEndpoint
      });
      throw new Error(`Ollama server not accessible at ${this.apiEndpoint}. Error: ${error.message}`);
    }
  }

  async process(messages: Message[]) {
    console.log("Processing messages with Ollama:", {
      endpoint: this.apiEndpoint,
      messageCount: messages.length
    });

    try {
      // Check server availability
      await this.checkOllamaAvailability();

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama2-uncensored",
          messages: messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 1000
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ollama API error:", {
          status: response.status,
          error: errorText
        });
        throw new Error(`Ollama API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Received response from Ollama:", result);
      
      if (!result.message?.content) {
        console.error("Unexpected response format:", result);
        throw new Error("Invalid response format from Ollama");
      }

      return {
        role: "assistant",
        content: result.message.content
      };
    } catch (error) {
      console.error("Ollama processing error:", {
        message: error.message,
        stack: error.stack,
        endpoint: this.apiEndpoint
      });
      throw error;
    }
  }
}

const serviceAdapter = new OllamaAdapter();
const runtime = new CopilotRuntime({
  defaultSystemPrompt: `Tu es un assistant spécialisé dans la gestion de produits, nommé ProductManager.
  
  Tes capacités incluent :
  - La création et la modification de fiches produits
  - La recherche et l'analyse de produits
  - Les recommandations sur la gestion des stocks
  - L'analyse des tendances du marché
  - L'aide à la tarification
  
  Instructions spécifiques :
  1. Réponds toujours en français
  2. Sois précis et professionnel dans tes réponses
  3. Demande des clarifications si nécessaire
  4. Propose des suggestions pertinentes
  
  Format de réponse :
  - Utilise des listes à puces pour les énumérations
  - Structure tes réponses de manière claire
  - Mets en évidence les points importants`
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
    console.error('Agent error:', {
      message: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}; 