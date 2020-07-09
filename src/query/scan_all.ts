import { DynamoDB } from "aws-sdk";
import * as _ from "lodash";

export async function scanAll(
  documentClient: DynamoDB.DocumentClient,
  tableName: string,
  options: {
    parallelize?: number;
    scanBatchSize?: number;
  },
) {
  if (options.parallelize && options.parallelize < 1) {
    throw new Error("Parallelize value at scanAll always positive number");
  }
  const buffer: DynamoDB.AttributeMap[] = [];
  const totalSegments = options.parallelize || 1;
  const scanners = _.times(totalSegments)
    .map((i) => (async (exclusiveStartKey?: DynamoDB.DocumentClient.Key) =>
      await documentClient.scan({
        TableName: tableName,
        Limit: options.scanBatchSize,
        ExclusiveStartKey: exclusiveStartKey,
        ReturnConsumedCapacity: "TOTAL",
        TotalSegments: totalSegments,
        Segment: i,
      }).promise()),
    );
  let lastEvaluatedKeys = new Array<DynamoDB.DocumentClient.Key | undefined>(totalSegments);
  _.fill(lastEvaluatedKeys, undefined);

  do {
    const results = await Promise.all(
      _.times(totalSegments)
        .map((i) => scanners[i](lastEvaluatedKeys[i])),
    );

    buffer.push(
      ..._.chain(results)
        .map(({ Items }) => (Items || []))
        .flatten()
        .value(),
    );
    lastEvaluatedKeys = results.map(({ LastEvaluatedKey }) => LastEvaluatedKey);
  } while(_.compact(lastEvaluatedKeys).length);

  return buffer;
}
