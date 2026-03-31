import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import * as _ from "lodash";

// this is limit of dynamoDB
const MAX_ITEMS = 100;

/**
 *
 * @param documentClient
 * @param tableName
 * @param keys
 * @param trimMissing - when given key doesn't have matching record,
 * return "undefined" for index? or just remove it (default is true)
 */
export async function __batchGet(
  documentClient: DynamoDBDocumentClient,
  tableName: string,
  keys: Record<string, any>[]
) {
  try {
    return await Promise.all(
      _.chunk(keys, MAX_ITEMS)
        .map(async (chunkedKeys) => {
          const res =
            await documentClient.send(new BatchGetCommand({
              RequestItems: {
                [tableName]: {
                  Keys: chunkedKeys,
                },
              },
            }));

          const records = res.Responses![tableName]!;

          return chunkedKeys.map((key) => {
            return records.find((record) => {
              for (const keyName of Object.keys(key)) {
                if (record[keyName] !== key[keyName]) {
                  return false;
                }
              }
              return true;
            });
          });
        })
    ).then((chunks) => {
      return _.flatten(chunks);
    });
  } catch (e) {
    console.log(`Dynamo-Types batchGet - ${JSON.stringify(keys, null, 2)}`);
    throw e;
  }
}

export async function batchGetFull(
  documentClient: DynamoDBDocumentClient,
  tableName: string,
  keys: Record<string, any>[]
) {
  return await __batchGet(documentClient, tableName, keys);
}

export async function batchGetTrim(
  documentClient: DynamoDBDocumentClient,
  tableName: string,
  keys: Record<string, any>[]
) {
  return _.compact(await __batchGet(documentClient, tableName, keys));
}
