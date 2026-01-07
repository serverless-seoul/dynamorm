import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import * as _ from "lodash";

// WriteRequest type for DocumentClient (uses native JS types, not AttributeValue)
interface DocumentClientWriteRequest {
  PutRequest?: {
    Item: Record<string, unknown>;
  };
  DeleteRequest?: {
    Key: Record<string, unknown>;
  };
}

// this is limit of dynamoDB
const MAX_ITEMS = 25;

export async function batchWrite(
  documentClient: DynamoDBDocumentClient,
  tableName: string,
  requests: DocumentClientWriteRequest[]
) {
  try {
    return await Promise.all(
      _.chunk(requests, MAX_ITEMS)
        .map(async (chunk) => {
          const res = await documentClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: chunk,
            },
          }));
          return res;
        })
    );
  } catch (e) {
    console.log(`Dynamo-Types batchWrite - ${JSON.stringify(requests, null, 2)}`);
    throw e;
  }
}
