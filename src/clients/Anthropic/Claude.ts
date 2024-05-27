import Anthropic from "@anthropic-ai/sdk";

import { Client } from "../client";

export class Claude extends Client {
  anthropic: Anthropic;
  model: string;

  constructor(model: string, apiKey: string = process.env.ANTHROPIC_API_KEY!) {
    super("");
    this.anthropic = new Anthropic({ apiKey });
    this.model = model;
  }

  async getAnswer(prompt: string) {
    try {
      const res = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: "user", content: "Hello, world" }],
        temperature: 0,
        system: prompt,
      });

      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
