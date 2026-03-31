import { QueryCommandInput, ScanCommandInput, GetCommand, DeleteCommand, UpdateCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

import { ITable, Table } from "../table";

import * as Codec from "../codec";
import * as Metadata from "../metadata";
import * as Query from "./query";

import { batchGetFull, batchGetTrim } from "./batch_get";
import { batchWrite } from "./batch_write";
import { Conditions } from "./expressions/conditions";
import { buildCondition, buildUpdate } from "./expressions/transformers";
import { UpdateChanges } from "./expressions/update";

const HASH_KEY_REF = "#hk";
const HASH_VALUE_REF = ":hkv";

const RANGE_KEY_REF = "#rk";

export class FullPrimaryKey<T extends Table, HashKeyType, RangeKeyType> {
  constructor(
    readonly tableClass: ITable<T>,
    readonly metadata: Metadata.Indexes.FullPrimaryKeyMetadata
  ) {}

  public async delete(
    hashKey: HashKeyType,
    sortKey: RangeKeyType,
    options: Partial<{
      condition: Conditions<T> | Array<Conditions<T>>;
    }> = {}
  ) {
    await this.tableClass.metadata.connection.documentClient.send(new DeleteCommand({
      TableName: this.tableClass.metadata.name,
      Key: {
        [this.metadata.hash.name]: hashKey,
        [this.metadata.range.name]: sortKey,
      },
      ...buildCondition(this.tableClass.metadata, options.condition),
    }));
  }

  /**
   * @param hashKey - HashKey
   * @param sortKey - sortKey
   * @param options - read options. consistent means "strongly consistent" or not
   */
  public async get(
    hashKey: HashKeyType,
    sortKey: RangeKeyType,
    options: { consistent: boolean } = { consistent: false }
  ): Promise<T | null> {
    const dynamoRecord =
      await this.tableClass.metadata.connection.documentClient.send(new GetCommand({
        TableName: this.tableClass.metadata.name,
        Key: {
          [this.metadata.hash.name]: hashKey,
          [this.metadata.range.name]: sortKey,
        },
        ConsistentRead: options.consistent,
      }));
    if (!dynamoRecord.Item) {
      return null;
    } else {
      return Codec.deserialize(this.tableClass, dynamoRecord.Item);
    }
  }

  public async batchGet(keys: Array<[HashKeyType, RangeKeyType]>) {
    const res = await batchGetTrim(
      this.tableClass.metadata.connection.documentClient,
      this.tableClass.metadata.name,
      keys.map((key) => {
        return {
          [this.metadata.hash.name]: key[0],
          [this.metadata.range.name]: key[1],
        };
      })
    );

    return {
      records: res.map((item) => {
        return Codec.deserialize(this.tableClass, item);
      }),
    };
  }

  public async batchGetFull(keys: Array<[HashKeyType, RangeKeyType]>) {
    const res = await batchGetFull(
      this.tableClass.metadata.connection.documentClient,
      this.tableClass.metadata.name,
      keys.map((key) => {
        return {
          [this.metadata.hash.name]: key[0],
          [this.metadata.range.name]: key[1],
        };
      })
    );

    return {
      records: res.map((item) => {
        return item ? Codec.deserialize(this.tableClass, item) : undefined;
      }),
    };
  }

  public async batchDelete(keys: Array<[HashKeyType, RangeKeyType]>) {
    return await batchWrite(
      this.tableClass.metadata.connection.documentClient,
      this.tableClass.metadata.name,
      keys.map((key) => {
        return {
          DeleteRequest: {
            Key: {
              [this.metadata.hash.name]: key[0],
              [this.metadata.range.name]: key[1],
            },
          },
        };
      })
    );
  }

  public async query(options: {
    hash: HashKeyType,
    range?: Query.Conditions<RangeKeyType>,
    rangeOrder?: "ASC" | "DESC",
    limit?: number,
    exclusiveStartKey?: Record<string, any>,
    consistent?: boolean,
  }) {
    if (!options.rangeOrder) {
      options.rangeOrder = "ASC";
    }
    const ScanIndexForward = options.rangeOrder === "ASC";

    const params: QueryCommandInput = {
      TableName: this.tableClass.metadata.name,
      Limit: options.limit,
      ScanIndexForward,
      ExclusiveStartKey: options.exclusiveStartKey,
      ReturnConsumedCapacity: "TOTAL",
      KeyConditionExpression: `${HASH_KEY_REF} = ${HASH_VALUE_REF}`,
      ExpressionAttributeNames: {
        [HASH_KEY_REF]: this.metadata.hash.name,
      },
      ExpressionAttributeValues: {
        [HASH_VALUE_REF]: options.hash,
      },
      ConsistentRead: options.consistent,
    };

    if (options.range) {
      const rangeKeyOptions = Query.parseCondition(options.range, RANGE_KEY_REF);
      params.KeyConditionExpression += ` AND ${rangeKeyOptions.conditionExpression}`;
      params.ExpressionAttributeNames = { ...params.ExpressionAttributeNames, [RANGE_KEY_REF]: this.metadata.range.name };
      params.ExpressionAttributeValues = { ...params.ExpressionAttributeValues, ...rangeKeyOptions.expressionAttributeValues };
    }

    const result = await this.tableClass.metadata.connection.documentClient.send(new QueryCommand(params));

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

  public async scan(options: {
    limit?: number,
    totalSegments?: number,
    segment?: number,
    exclusiveStartKey?: Record<string, any>,
  } = {}) {
    const params: ScanCommandInput = {
      TableName: this.tableClass.metadata.name,
      Limit: options.limit,
      ExclusiveStartKey: options.exclusiveStartKey,
      ReturnConsumedCapacity: "TOTAL",
      TotalSegments: options.totalSegments,
      Segment: options.segment,
    };

    const result = await this.tableClass.metadata.connection.documentClient.send(new ScanCommand(params));

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

  public async update(
    hashKey: HashKeyType,
    sortKey: RangeKeyType,
    changes: Partial<UpdateChanges<T>>,
    options: Partial<{
      condition: Conditions<T> | Array<Conditions<T>>;
    }> = {}
  ): Promise<void> {
    const update = buildUpdate(this.tableClass.metadata, changes);
    const condition = buildCondition(this.tableClass.metadata, options.condition);

    await this.tableClass.metadata.connection.documentClient.send(new UpdateCommand({
      TableName: this.tableClass.metadata.name,
      Key: {
        [this.metadata.hash.name]: hashKey,
        [this.metadata.range.name]: sortKey,
      },
      UpdateExpression: update.UpdateExpression,
      ConditionExpression: condition.ConditionExpression,
      ExpressionAttributeNames: { ...update.ExpressionAttributeNames, ...condition.ExpressionAttributeNames },
      ExpressionAttributeValues: { ...update.ExpressionAttributeValues, ...condition.ExpressionAttributeValues },
    }));
  }
}
