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
  let scanners = _.times(totalSegments)
    .map((i) => ({
      scanner: async (exclusiveStartKey?: DynamoDB.DocumentClient.Key) =>
        await documentClient.scan({
          TableName: tableName,
          Limit: options.scanBatchSize,
          ExclusiveStartKey: exclusiveStartKey,
          ReturnConsumedCapacity: "TOTAL",
          TotalSegments: totalSegments,
          Segment: i,
        }).promise(),
      key: undefined as DynamoDB.DocumentClient.Key | undefined,
    }));

  do {
    const results = await Promise.all(
      _.chain(scanners)
        .map(async ({ scanner, key }) => await scanner(key))
        .value(),
    );
    buffer.push(
      ..._.chain(results)
        .map(({ Items }) => (Items || []))
        .flatten()
        .value(),
    );
    scanners = scanners
      .map(({ scanner }, index) => ({
        scanner, key: results[index].LastEvaluatedKey,
      }))
      .filter(({ key }) => !!key );
  } while(scanners.length);

  return buffer;
}
