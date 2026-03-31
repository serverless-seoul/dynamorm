import * as Metadata from "../../metadata";

import { DeleteTableCommand } from "@aws-sdk/client-dynamodb";

export async function dropTable(metadata: Metadata.Table.Metadata) {
  const res = await metadata.connection.client.send(new DeleteTableCommand({ TableName: metadata.name }));
  return res.TableDescription;
}
