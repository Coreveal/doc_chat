import {
  GenerateContentRequest,
  GenerativeModel,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from "@google-cloud/vertexai";

import { Client } from "../client";
import { PineconeClient, SecretsManager } from "clients";

export class Vertex extends Client {
  model: string;
  generativeModel: GenerativeModel;

  constructor(model: string = "gemini-1.5-flash-preview-0514") {
    super("");

    const project = "due-diligence-project";
    const location = "us-central1";
    this.model = model;

    const vertexAI = new VertexAI({ project, location });

    this.generativeModel = vertexAI.getGenerativeModel({
      model: this.model,
      // The following parameters are optional
      // They can also be passed to individual content generation requests
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      generationConfig: { maxOutputTokens: 8192, temperature: 1, topP: 0.95 },
    });
  }

  init = async () => {
    try {
      const secretsManagerClient = new SecretsManager();
      await secretsManagerClient.configureGoogleCredentials();
      return;
    } catch (error: any) {
      throw new Error(`[Vertex]::[init]::${error.message}`);
    }
  };

  getAnswerFromDocuments = async (
    question: string,
    email: string,
    documents: string[],
  ) => {
    try {
      const pinecone = new PineconeClient(
        process.env.PINECONE_INDEX_NAME!,
        email,
      );
      const { prompt, context } = await pinecone.getAllDocumentsPrompt({
        query: question,
        documents,
      });

      console.log("Obtaining final response....");

      const request = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, ...context],
          },
        ],
      };

      const result = await this.generativeModel.generateContent(request);

      const tokens = await this.getTokens(request);

      if (tokens > 900000) {
        throw new Error("Please limit number of documents to 10 or less");
      }

      return ((result.response.candidates || [])[0].content?.parts || [])[0]
        .text;
    } catch (error: any) {
      console.error(error);
      throw new Error(`[Vertex]::[getAnswerFromDocuments]::${error.message}`);
    }
  };

  async getTokens(request: GenerateContentRequest) {
    const tokens = await this.generativeModel.countTokens(request);
    return tokens.totalTokens;
  }
}
