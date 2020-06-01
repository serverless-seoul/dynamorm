import { Connection } from "./connection";

import * as AWS from "aws-sdk";
import { DynamoDB } from "aws-sdk";

// tslint:disable-next-line: no-var-requires
const AmazonDaxClient = require("amazon-dax-client");

export class DAXConnection implements Connection {
  constructor(options: {
    endpoints: string[];
    requestTimeout?: number;
  }) {
    this.client = new AmazonDaxClient({
      endpoints: options.endpoints,
      requestTimeout: options.requestTimeout,
    });
    this.documentClient = new DynamoDB.DocumentClient({ service: this.client });
  }
  public readonly documentClient: AWS.DynamoDB.DocumentClient;
  public readonly client: AWS.DynamoDB;
}
