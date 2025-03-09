import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiAdapter {
  private model;

  constructor() {
    const googleai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
    this.model = googleai.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async process(messages: any[]) {
    try {
      const chat = this.model.startChat();
      
      // Process conversation history
      for (let i = 0; i < messages.length - 1; i++) {
        await chat.sendMessage(messages[i].content);
      }

      // Send the final message
      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = await result.response;
      
      return {
        role: "assistant",
        content: response.text(),
      };
    } catch (error) {
      console.error("Error in Gemini response:", error);
      throw error;
    }
  }
} 