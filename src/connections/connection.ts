// Represent "Connection" to DynamoDB

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export interface Connection {
  readonly documentClient: DynamoDBDocumentClient;
  readonly client: DynamoDBClient;
}
