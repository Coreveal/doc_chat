import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandOutput,
  S3 as S3Legacy,
  ListObjectsCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

import { Client } from "clients";
import { streamToString } from "utils/helpers";

export class S3 extends Client {
  s3: S3Client;

  constructor() {
    super("");
    this.s3 = new S3Client();
  }

  async generatePresignedUrl(
    bucketName: string,
    objectKey: string,
    expiresIn = 3600,
  ) {
    try {
      const getObjectParams = { Bucket: bucketName, Key: objectKey };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(this.s3, command, { expiresIn });
      return url;
    } catch (error: any) {
      console.error("Error generating pre-signed URL:", error);
      throw new Error(`[generatePresignedUrl]::${error.message}`);
    }
  }

  async getDocumentText(params: { Bucket: string; Key: string }) {
    const command = new GetObjectCommand(params);

    const { Body }: GetObjectCommandOutput = await this.s3.send(command);

    if (Body instanceof Readable) {
      // Convert the stream to text
      const textContent = await streamToString(Body);
      return textContent;
    } else {
      throw new Error("Received body is not a stream.");
    }
  }

  async getObject(params: { Bucket: string; Key: string }) {
    const command = new GetObjectCommand(params);

    const file: GetObjectCommandOutput = await this.s3.send(command);

    return file;
  }

  async putObject(params: { Bucket: string; Key: string; Body: string }) {
    const s3Legacy = new S3Legacy();
    return await s3Legacy.putObject(params);
  }

  async listObjects(params: { Bucket: string; Prefix: string }) {
    const { Bucket, Prefix } = params;
    const input = {
      Bucket,
      Prefix,
    };
    const command = new ListObjectsCommand(input);
    const response = await this.s3.send(command);
    return response.Contents?.map((doc) => ({ fileUri: doc.Key }));
  }
}
