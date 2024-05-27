import { Index, Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { S3 } from "clients";
import { Document } from "@langchain/core/documents";
import { TokenTextSplitter } from "@langchain/textsplitters";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

import { models } from "../../conf/openai";
import { Client } from "../client";

export class PineconeClient extends Client {
  pinecone: Pinecone;
  index: Index;

  constructor(indexName: string, email: string) {
    super("");
    this.pinecone = new Pinecone();
    this.index = this.pinecone.Index(indexName);
  }

  async chat({
    query,
    documents,
    email,
  }: {
    query: string;
    documents: string[];
    email: string;
  }) {
    try {
      const vectorStore = await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings(),
        { pineconeIndex: this.index },
      );

      const template = `Answer the question based only on the following context:
        {context}
        Question: {question}
        If the context is empty, simply say that you don't have enough information to answer the question.
      `;

      const prompt = ChatPromptTemplate.fromTemplate(template);

      const model = new ChatOpenAI({
        modelName: models.gpt,
        temperature: 0,
      });

      let citations: any[] = [];

      const chain = RunnableSequence.from([
        {
          context: async (input, config) => {
            if (!config || !("configurable" in config)) {
              throw new Error("No config");
            }
            const { configurable } = config;

            citations = await vectorStore
              .asRetriever(configurable)
              .getRelevantDocuments(input);
            // citations = await vectorStore.similaritySearch(query, 10, {
            //   namespace: email,
            //   source: { $in: documents },
            // });
            return JSON.stringify(citations);
          },
          question: new RunnablePassthrough(),
        },
        prompt,
        model,
        new StringOutputParser(),
      ]);

      const answer = await chain.invoke(query, {
        configurable: {
          filter: { namespace: email, source: { $in: documents } },
        },
      });

      return {
        answer,
        citations: [...new Set(citations.map((c) => c.metadata.fileName))],
      };
    } catch (error: any) {
      console.error(error);
      throw new Error(`[Pinecone]::[chat]::${error.message}`);
    }
  }

  // Gets a giant prompt containing all the documents
  async getAllDocumentsPrompt({
    query,
    documents,
  }: {
    query: string;
    documents: string[];
  }) {
    try {
      // const vectorStore = await PineconeStore.fromExistingIndex(
      //   new OpenAIEmbeddings(),
      //   { pineconeIndex: this.index },
      // );

      // const template = `Answer the question based only on the context provided below. The context is basically the text content of a bunch of documents you need to look at, in order to answer the question. For each document below, you will see the document name, the document URL, and the document content. You need to read the content of the documents to answer the question. If you don't have enough information to answer the question, simply say that you don't have enough information to answer the question. Also provide the name of the documents (that you will find beside Document Name) that you used to answer the question.:

      // Question: {question}

      // Context: {context}

      // If the context is empty, simply say that you don't have enough information to answer the question.
      // `;

      const template = `You are a legal bot meant to aid lawyers and startups with answers to their questions from the legal perspective. Think of yourself as a lawyer. Answer the question based only on the context provided. The context is basically the text content of a bunch of documents you need to look at, in order to answer the question. For each document below, you will see the document name, the document URL, and the document content. You need to read the content of the documents to answer the question. If you don't have enough information to answer the question, simply say that you don't have enough information to answer the question. Also provide the name of the documents (that you will find beside Document Name) that you used to answer the question.:

      Question: {question}
        
      If the context is empty, simply say that you don't have enough information to answer the question.
      `;

      const prompt = ChatPromptTemplate.fromTemplate(template);

      const parentDocuments: any = {};
      // const citations = await vectorStore
      // .maxMarginalRelevanceSearch(
      //   "pinecone",
      //   {
      //     k: documents.length,
      //     // fetchK: 30,
      //     filter: {
      //       namespace: email,
      //       source: { $in: documents },
      //     },
      //   },
      // );
      // .asRetriever({
      //   filter: {
      //     namespace: email,
      //     source: { $in: documents },
      //   },
      // })
      // .getRelevantDocuments(query);
      // .similaritySearch(query, documents.length, {
      //   namespace: email,
      //   source: { $in: documents },
      // });

      // for (const citation of citations) {
      //   if (!parentDocuments[citation.metadata.source]) {
      //     const s3 = new S3();
      //     const bucket = process.env.EXTRACTED_TEXT_BUCKET_NAME;

      //     const params = {
      //       Bucket: bucket!,
      //       Key:
      //         citation.metadata.source.split("/").slice(1).join("/") + ".txt",
      //     };

      //     const content = await s3.getDocumentText(params);

      //     parentDocuments[citation.metadata.source] = {
      //       metadata: citation.metadata,
      //       documentContent: content,
      //     };
      //   }
      // }

      for (const document of documents) {
        if (!parentDocuments[document]) {
          const s3 = new S3();
          const bucket = process.env.EXTRACTED_TEXT_BUCKET_NAME;

          const params = {
            Bucket: bucket!,
            Key: document.split("/").slice(1).join("/") + ".txt",
          };

          const content = await s3.getDocumentText(params);

          parentDocuments[document] = {
            metadata: {
              fileName: document.split("/").at(-1),
              source: document,
            },
            documentContent: content,
          };
        }
      }

      // const context = Object.values(parentDocuments).reduce(
      //   (acc, doc: any, index) =>
      //     acc +
      //     "\n\n" +
      //     `
      //     Document Number: ${index + 1}
      //     Document Name: ${doc.metadata.fileName}
      //     Document URL: ${doc.metadata.source}
      //     Document Content(within triple quotes):
      //     """
      //     ${doc.documentContent}
      //     """
      // `,
      //   ``,
      // );

      const context = Object.values(parentDocuments).map((doc: any, index) => ({
        text: `
          Document Number: ${index + 1}
          Document Name: ${doc.metadata.fileName}
          Document URL: ${doc.metadata.source}
          Document Content(within triple quotes):
          """
          ${doc.documentContent}
          """
      `,
      }));

      const formattedPrompt = await prompt.format({ context, question: query });

      return { prompt: formattedPrompt, context };

      // return prompt.format({ context, question: query });
    } catch (error: any) {
      console.error(error);
      throw new Error(`[Pinecone]::[retrieveParentDocument]::${error.message}`);
    }
  }

  async deleteUserDocuments(email: string) {
    try {
      const results = await this.index.namespace(email).deleteAll();

      return results;
    } catch (error: any) {
      console.error(`[Pinecone]::[deleteUserDocuments]::${error}`);
      return;
    }
  }

  async addDocumentToPinecone(
    bucketName: string,
    fileKey: string,
    originalBucketName: string,
    originalFileKey: string,
  ) {
    try {
      const s3 = new S3();
      const content = await s3.getDocumentText({
        Bucket: bucketName,
        Key: fileKey,
      });

      if (!content)
        return {
          statusCode: 200,
          body: JSON.stringify("Empty Document"),
        };

      const docText = [
        {
          metadata: {
            source: `${originalBucketName}/${originalFileKey}`,
          },
          pageContent: content,
        },
      ];
      const splitter = new TokenTextSplitter({
        encodingName: "gpt2",
        chunkSize: 2000,
        chunkOverlap: 200,
      });

      let docs: any[] = [];
      let userEmail = fileKey.split("/")[0];

      for (let doc of docText) {
        const output = await splitter.createDocuments([doc.pageContent]);

        for (let chunk of output) {
          const [email, fileName] = originalFileKey.split("/");
          docs = [
            ...docs,
            new Document({
              metadata: { email, fileName, source: doc.metadata.source },
              pageContent: chunk.pageContent,
            }),
          ];
        }
      }
      await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
        pineconeIndex: this.index,
        maxConcurrency: 5,
        namespace: userEmail,
      });

      return {
        statusCode: 200,
        body: JSON.stringify("Document added to Pinecone"),
      };
    } catch (error: any) {
      console.error(error);
      throw new Error(`[addDocumentToPinecone]::${error.message}`);
    }
  }
}
