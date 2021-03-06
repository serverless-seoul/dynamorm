import * as Metadata from "../../metadata";

export async function dropTable(metadata: Metadata.Table.Metadata) {
  const res = await metadata.connection.client.deleteTable({ TableName: metadata.name }).promise();
  return res.TableDescription;
}
