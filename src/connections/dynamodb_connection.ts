import { Connection } from "./connection";

import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { NodeHttpHandler } from "@smithy/node-http-handler";

import * as HTTP from "http";
import * as HTTPS from "https";

export class DynamoDBConnection implements Connection {
  public readonly documentClient: DynamoDBDocumentClient;
  public readonly client: DynamoDBClient;

  constructor(options: {
    region?: string;
    endpoint: string | undefined;
    enableAWSXray: boolean;
  }) {
    const dynamoDBOptions: DynamoDBClientConfig = {
      region: options.region,
      endpoint: options.endpoint,
      requestHandler: new NodeHttpHandler({
        httpAgent: this.httpAgent(options.endpoint),
        httpsAgent: this.httpsAgent(),
      }),
    };

    if (options.enableAWSXray) {
      // Since "require" itself does something for this lib, such as logging
      // importing this only when it's needed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const AWSXRay = require("aws-xray-sdk-core");
      this.client = AWSXRay.captureAWSv3Client(new DynamoDBClient(dynamoDBOptions));
    } else {
      this.client = new DynamoDBClient(dynamoDBOptions);
    }
    this.documentClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  private httpAgent(endpoint: string | undefined) {
    if (endpoint && endpoint.startsWith("http://")) {
      return new HTTP.Agent({
        keepAlive: true,
      });
    }
    return undefined;
  }

  private httpsAgent() {
    return new HTTPS.Agent({
      rejectUnauthorized: true,
      keepAlive: true,
    });
  }
}
