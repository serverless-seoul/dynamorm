import { DynamoDB } from 'aws-sdk';
import * as _ from 'lodash';

import * as Codec from '../codec';
import * as Metadata from '../metadata';
import { ITable, Table } from '../table';

import { batchGetFull, batchGetTrim } from "./batch_get";
import { batchWrite } from "./batch_write";
import { scanAll } from './scan_all';

export class HashPrimaryKey<T extends Table, HashKeyType> {
  constructor(
    readonly tableClass: ITable<T>,
    readonly metadata: Metadata.Indexes.HashPrimaryKeyMetadata,
  ) {}

  async delete(hashKey: HashKeyType) {
    await this.tableClass.metadata.connection.documentClient.delete({
      TableName: this.tableClass.metadata.name,
      Key: {
        [this.metadata.hash.name]: hashKey,
      },
    }).promise();
  }

  async get(hashKey: HashKeyType, options: { consistent: boolean } = { consistent: false }): Promise<T | null> {
    const dynamoRecord =
      await this.tableClass.metadata.connection.documentClient.get({
        TableName: this.tableClass.metadata.name,
        Key: {
          [this.metadata.hash.name]: hashKey,
        },
        ConsistentRead: options.consistent,
      }).promise();
    if (!dynamoRecord.Item) {
      return null;
    } else {
      return Codec.deserialize(this.tableClass, dynamoRecord.Item);
    }
  }

  async scan(options: {
    limit?: number;
    totalSegments?: number;
    segment?: number;
    exclusiveStartKey?: DynamoDB.DocumentClient.Key;
  }) {
    const params: DynamoDB.DocumentClient.ScanInput = {
      TableName: this.tableClass.metadata.name,
      Limit: options.limit,
      ExclusiveStartKey: options.exclusiveStartKey,
      ReturnConsumedCapacity: "TOTAL",
      TotalSegments: options.totalSegments,
      Segment: options.segment,
    };

    const result = await this.tableClass.metadata.connection.documentClient.scan(params).promise();

    return {
      records: (result.Items || []).map((item) => {
        return Codec.deserialize(this.tableClass, item);
      }),
      count: result.Count,
      scannedCount: result.ScannedCount,
      lastEvaluatedKey: result.LastEvaluatedKey,
      consumedCapacity: result.ConsumedCapacity,
    };
  }

  async scanAll(options: {
    parallelize?: number;
    scanBatchSize?: number;
  }) {
    if (options.parallelize && options.parallelize < 1) {
      throw new Error("Parallelize value at scanAll always positive number");
    }

    const res = await scanAll(
      this.tableClass.metadata.connection.documentClient,
      this.tableClass.metadata.name,
      options,
    );

    return {
      records: res.map((item) => Codec.deserialize(this.tableClass, item)),
      count: res.length,
    };
  }

  async batchGet(keys: HashKeyType[]) {
    const res = await batchGetTrim(
      this.tableClass.metadata.connection.documentClient,
      this.tableClass.metadata.name,
      keys.map((key) => {
        return {
          [this.metadata.hash.name]: key,
        };
      }),
    );

    return {
      records: res.map((item) => {
        return Codec.deserialize(this.tableClass, item);
      }),
    };
  }

  async batchGetFull(keys: HashKeyType[]) {
    const res = await batchGetFull(
      this.tableClass.metadata.connection.documentClient,
      this.tableClass.metadata.name,
      keys.map((key) => {
        return {
          [this.metadata.hash.name]: key,
        };
      }),
    );

    return {
      records: res.map((item) => {
        return item ? Codec.deserialize(this.tableClass, item) : undefined;
      }),
    };
  }

  async batchDelete(keys: HashKeyType[]) {
    return await batchWrite(
      this.tableClass.metadata.connection.documentClient,
      this.tableClass.metadata.name,
      keys.map((key) => {
        return {
          DeleteRequest: {
            Key: {
              [this.metadata.hash.name]: key,
            },
          },
        };
      }),
    );
  }

  async update(
    hashKey: HashKeyType,
    changes: {
      [key: string]: [
        DynamoDB.DocumentClient.AttributeAction,
        any
      ];
    },
  ): Promise<void> {
    // Select out only declared Attributes
    const attributeUpdates: DynamoDB.DocumentClient.AttributeUpdates = {};

    this.tableClass.metadata.attributes.forEach((attr) => {
      const change = changes[attr.propertyName];
      if (change) {
        attributeUpdates[attr.name] = {
          Action: change[0],
          Value: change[1],
        };
      }
    });

    await this.tableClass.metadata.connection.documentClient.update({
      TableName: this.tableClass.metadata.name,
      Key: {
        [this.metadata.hash.name]: hashKey,
      },
      AttributeUpdates: attributeUpdates,
    }).promise();
  }
}
