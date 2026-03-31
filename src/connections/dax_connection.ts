import { Connection } from "./connection";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AmazonDaxClient = require("amazon-dax-client");

export class DAXConnection implements Connection {
  private __documentClient: DynamoDBDocumentClient;
  private __client: DynamoDBClient;

  constructor(options: {
    region?: string;
    endpoints: string[];
    requestTimeout?: number;
  }) {
    this.__client = new AmazonDaxClient({
      region: options.region,
      endpoints: options.endpoints,
      requestTimeout: options.requestTimeout,
    });
    this.__documentClient = DynamoDBDocumentClient.from(this.__client);
  }

  public get documentClient() {
    return this.__documentClient;
  }

  public get client() {
    return this.__client;
  }
}
