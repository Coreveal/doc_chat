import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  RetrieveAndGenerateCommandInput,
  RetrieveCommand,
  RetrieveCommandInput,
} from "@aws-sdk/client-bedrock-agent-runtime";

import { Client } from "../client";
//import { documentCategorization } from "../../services/agents/definitions/prompts";

export class Bedrock extends Client {
  bedrock: BedrockAgentRuntimeClient;

  constructor() {
    super("");
    this.bedrock = new BedrockAgentRuntimeClient({
      apiVersion: "2023-09-30",
    });
  }

  async chat(query: string) {
    try {
      const knowledgeBaseID = process.env.KNOWLEDGE_BASE_ID;
      const region = process.env.AWS_REGION;
      const modelArn = process.env.ModelARN;

      const client = new BedrockAgentRuntimeClient({
        region,
      });

      const inputQuery: RetrieveAndGenerateCommandInput = {
        input: {
          // RetrieveAndGenerateInput
          text: query, // required
        },
        retrieveAndGenerateConfiguration: {
          type: "KNOWLEDGE_BASE",
          knowledgeBaseConfiguration: {
            // KnowledgeBaseRetrieveAndGenerateConfiguration
            knowledgeBaseId: knowledgeBaseID, // required
            modelArn: modelArn,
          },
        },
      };

      const command = new RetrieveAndGenerateCommand(inputQuery);
      const response = await client.send(command);

      return response;
    } catch (err) {
      console.error(err);
    }
  }

  async retrieve(query: string, email: string) {
    try {
      const knowledgeBaseID = process.env.KNOWLEDGE_BASE_ID;
      const region = process.env.AWS_REGION;
      const modelArn = process.env.ModelARN;

      const client = new BedrockAgentRuntimeClient({
        region,
      });

      const inputQuery: RetrieveCommandInput = {
        // RetrieveRequest
        knowledgeBaseId: knowledgeBaseID, // required
        retrievalQuery: {
          // KnowledgeBaseQuery
          text: query, // required
        },
        retrievalConfiguration: {
          // KnowledgeBaseRetrievalConfiguration
          vectorSearchConfiguration: {
            // KnowledgeBaseVectorSearchConfiguration
            numberOfResults: 100,
          },
        },
        nextToken: "STRING_VALUE",
      };

      const command = new RetrieveCommand(inputQuery);
      const response = await client.send(command);

      return response.retrievalResults
        ?.filter((res) => res.location?.s3Location?.uri?.includes(email))
        .splice(0, 5);
    } catch (err) {
      console.error(err);
    }
  }
}
