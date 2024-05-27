import { OpenAIWrapper } from "./OpenAIWrapper";

export class Chat extends OpenAIWrapper {
  model: string;

  constructor(model: string) {
    super();
    this.model = model;
  }

  async getChatCompletion(prompt: string, jsonReturnType = true) {
    let completionObject: any = {
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      seed: 12,
      temperature: 0,
    };

    if (jsonReturnType) {
      completionObject.response_format = { type: "json_object" };
    }

    const completion =
      await this.openai.chat.completions.create(completionObject);

    return completion;
  }
}
