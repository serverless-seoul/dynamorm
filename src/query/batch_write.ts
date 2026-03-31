import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import * as _ from "lodash";

// this is limit of dynamoDB
const MAX_ITEMS = 25;

export async function batchWrite(
  documentClient: DynamoDBDocumentClient,
  tableName: string,
  requests: Array<{
    PutRequest?: { Item: Record<string, any> };
    DeleteRequest?: { Key: Record<string, any> };
  }>
) {
  try {
    return await Promise.all(
      _.chunk(requests, MAX_ITEMS)
        .map(async (chunk) => {
          const res =
            await documentClient.send(new BatchWriteCommand({
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
