import { Connection } from "./connection";

import * as AWS from "aws-sdk";
import { DynamoDB } from "aws-sdk";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AmazonDaxClient = require("amazon-dax-client");

export class DAXConnection implements Connection {
  private __documentClient: AWS.DynamoDB.DocumentClient;
  private __client: AWS.DynamoDB;

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
    this.__documentClient = new DynamoDB.DocumentClient({
      service: this.__client,
    });
  }

  public get documentClient() {
    return this.__documentClient;
  }

  public get client() {
    return this.__client;
  }
}
