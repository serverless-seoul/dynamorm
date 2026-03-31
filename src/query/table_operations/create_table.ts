import * as Metadata from "../../metadata";

import {
  CreateTableCommand,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
  KeySchemaElement,
  AttributeDefinition,
  CreateTableInput,
  ScalarAttributeType,
} from "@aws-sdk/client-dynamodb";
import * as _ from "lodash";

export async function createTable(metadata: Metadata.Table.Metadata) {
  let KeySchema: KeySchemaElement[];
  let AttributeDefinitions: AttributeDefinition[];

  if (metadata.primaryKey.type === "FULL") {
    KeySchema = [{
      AttributeName: metadata.primaryKey.hash.name,
      KeyType: "HASH",
    }, {
      AttributeName: metadata.primaryKey.range.name,
      KeyType: "RANGE",
    }];
    AttributeDefinitions = [{
      AttributeName: metadata.primaryKey.hash.name,
      AttributeType: metadata.primaryKey.hash.type as ScalarAttributeType,
    }, {
      AttributeName: metadata.primaryKey.range.name,
      AttributeType: metadata.primaryKey.range.type as ScalarAttributeType,
    }];
  } else {
    KeySchema = [{
      AttributeName: metadata.primaryKey.hash.name,
      KeyType: "HASH",
    }];
    AttributeDefinitions = [{
      AttributeName: metadata.primaryKey.hash.name,
      AttributeType: metadata.primaryKey.hash.type as ScalarAttributeType,
    }];
  }

  metadata.localSecondaryIndexes.map((index) => {
    AttributeDefinitions.push({
      AttributeName: index.range.name,
      AttributeType: index.range.type as ScalarAttributeType,
    });
  });

  metadata.globalSecondaryIndexes.map((index) => {
    AttributeDefinitions.push({
      AttributeName: index.hash.name,
      AttributeType: index.hash.type as ScalarAttributeType,
    });

    if (index.type === "FULL") {
      AttributeDefinitions.push({
        AttributeName: index.range.name,
        AttributeType: index.range.type as ScalarAttributeType,
      });
    }
  });

  AttributeDefinitions = _.uniqBy(AttributeDefinitions, (attr) => attr.AttributeName);

  const params: CreateTableInput = {
    AttributeDefinitions,
    TableName: metadata.name,
    KeySchema,
    LocalSecondaryIndexes:
      metadata.localSecondaryIndexes.length > 0 ?
        metadata.localSecondaryIndexes.map((index) => {
          return {
            IndexName: index.name,
            KeySchema: [{
              AttributeName: metadata.primaryKey.hash.name,
              KeyType: "HASH",
            }, {
              AttributeName: index.range.name,
              KeyType: "RANGE",
            }],
            Projection: {
              ProjectionType: "ALL",
            },
          };
        }) : undefined,
    GlobalSecondaryIndexes:
      metadata.globalSecondaryIndexes.length > 0 ?
        metadata.globalSecondaryIndexes.map((index) => {
          if (index.type === "FULL") {
            return {
              IndexName: index.name,
              KeySchema: [{
                AttributeName: index.hash.name,
                KeyType: "HASH",
              }, {
                AttributeName: index.range.name,
                KeyType: "RANGE",
              }],
              Projection: {
                ProjectionType: "ALL",
              },
            };
          } else {
            return {
              IndexName: index.name,
              KeySchema: [{
                AttributeName: index.hash.name,
                KeyType: "HASH",
              }],
              Projection: {
                ProjectionType: "ALL",
              },
            };
          }
        }) : undefined,
    BillingMode: "PAY_PER_REQUEST",
  };

  const res = await metadata.connection.client.send(new CreateTableCommand(params));

  await waitUntilTableExists(
    { client: metadata.connection.client, maxWaitTime: 120 },
    { TableName: metadata.name }
  );

  // TTL
  const ttlAttribute = metadata.attributes.find((attr) => !!attr.timeToLive);
  if (ttlAttribute) {
    await metadata.connection.client.send(new UpdateTimeToLiveCommand({
      TableName: metadata.name,
      TimeToLiveSpecification: {
        Enabled: true,
        AttributeName: ttlAttribute.name,
      },
    }));
  }

  return res.TableDescription;
}
