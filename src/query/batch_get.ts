import { DynamoDB } from "aws-sdk";
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
  documentClient: DynamoDB.DocumentClient,
  tableName: string,
  keys: DynamoDB.DocumentClient.KeyList
) {
  try {
    return await Promise.all(
      _.chunk(keys, MAX_ITEMS)
        .map(async (chunkedKeys) => {
          const res =
            await documentClient.batchGet({
              RequestItems: {
                [tableName]: {
                  Keys: chunkedKeys,
                },
              },
            }).promise();

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
  documentClient: DynamoDB.DocumentClient,
  tableName: string,
  keys: DynamoDB.DocumentClient.KeyList
) {
  return await __batchGet(documentClient, tableName, keys);
}

export async function batchGetTrim(
  documentClient: DynamoDB.DocumentClient,
  tableName: string,
  keys: DynamoDB.DocumentClient.KeyList
) {
  return _.compact(await __batchGet(documentClient, tableName, keys));
}
