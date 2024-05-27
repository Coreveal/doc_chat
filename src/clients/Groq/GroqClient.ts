import Groq from "groq-sdk";
import { S3 } from "clients";

import { Client } from "../client";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export class GroqClient extends Client {
  groq: Groq;

  constructor(model: string = "mixtral-8x7b-32768") {
    super("");

    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  getAnswerFromFiles = async (question: string, email: string) => {
    const s3 = new S3();
    const bucket = process.env.EXTRACTED_TEXT_BUCKET_NAME!;

    const files = await s3.listObjects({
      Bucket: bucket,
      Prefix: email + "/",
    });

    const fileText: ChatCompletionMessageParam[] = [];

    for (const file of files || []) {
      const params = {
        Bucket: bucket!,
        Key: file.fileUri!,
      };

      const content = await s3.getDocumentText(params);
      fileText.push({
        role: "user",
        content:
          `Here is the text content of the document titled - ${file.fileUri}: ` +
          content,
      });
    }

    console.log("Document text retrieved for all documents");

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: `I have provided some documents to you. Based on the content of these documents, try to best answer the following question: ${question} Provide detail behind your reasoning and any relevant text that corroborates the answer. Only answer the question if you are absolutely certain of the answer. If you cannot answer the question, leave the response blank.`,
    };

    // Split files into batches
    const batchSize = 1;
    const fileBatches: ChatCompletionMessageParam[][] = [];

    for (let i = 0; i < fileText.length; i += batchSize) {
      fileBatches.push(fileText.slice(i, i + batchSize));
    }

    const responses = [];
    for (const [index, fileBatch] of fileBatches.entries()) {
      const result = await this.groq.chat.completions.create({
        messages: [systemMessage, ...fileBatch],
        model: "mixtral-8x7b-32768",
      });

      console.log(
        "Result generated for fileBatch: ",
        index,
        result.choices[0].message.content,
      );

      if (result) {
        responses.push(result);
      }
    }

    console.log("Responses generated for all file batches: ", responses);

    const combineResultsPrompt = `I previously provided you with an instruction and processed batches of documents with that instuction. Now, using the responses you provided for each batch, come up with a single response that combines all the responses you provided and answers the original question: ${systemMessage.content}.Provide detail behind your reasoning and any relevant text that corroborates the answer. Only answer the question if you are absolutely certain of the answer.
    Here is a summary of the responses you provided: ${responses.join("\n")}`;

    console.log("Combination text part: ", combineResultsPrompt);

    const result = await this.groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: combineResultsPrompt,
        },
      ],
      model: "mixtral-8x7b-32768",
    });

    return result;
  };
}
