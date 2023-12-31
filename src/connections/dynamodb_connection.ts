import { Connection } from "./connection";

import * as AWS from "aws-sdk";

import * as HTTP from "http";
import * as HTTPS from "https";

export class DynamoDBConnection implements Connection {
  public readonly documentClient: AWS.DynamoDB.DocumentClient;
  public readonly client: AWS.DynamoDB;

  constructor(options: {
    region?: string;
    endpoint: string | undefined;
    enableAWSXray: boolean;
  }) {
    const dynamoDBOptions: AWS.DynamoDB.ClientConfiguration = {
      region: options.region,
      endpoint: options.endpoint,
      httpOptions: {
        agent: this.httpAgent(options.endpoint),
      },
    };

    if (options.enableAWSXray) {
      // Since "require" itself does something for this lib, such as logging
      // importing this only when it's needed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AWSXRay = require("aws-xray-sdk-core");
      const aws = AWSXRay.captureAWS(AWS);
      this.client = new aws.DynamoDB(dynamoDBOptions);
      this.documentClient = new aws.DynamoDB.DocumentClient({
        service: this.client,
      });
    } else {
      this.client = new AWS.DynamoDB(dynamoDBOptions);
      this.documentClient = new AWS.DynamoDB.DocumentClient({
        service: this.client,
      });
    }
  }

  private httpAgent(endpoint: string | undefined) {
    if (endpoint && endpoint.startsWith("http://")) {
      return new HTTP.Agent({
        keepAlive: true,
      });
    } else {
      return new HTTPS.Agent({
        rejectUnauthorized: true,
        keepAlive: true,
      });
    }
  }
}
