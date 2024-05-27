import OpenAI from "openai";
import { Client } from "../client";

export class OpenAIWrapper extends Client {
  openai: OpenAI;

  constructor() {
    super("");
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getModels() {
    const response = await this.openai.models.list();
    return response.data;
  }
}
