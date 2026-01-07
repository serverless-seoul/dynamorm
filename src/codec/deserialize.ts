import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import * as _ from "lodash";

import { ITable, Table } from "../table";

export function deserialize<T extends Table>(
  tableClass: ITable<T>,
  dynamoAttributes: Record<string, unknown>
): T {
  const record = new tableClass();

  tableClass.metadata.attributes.forEach((attributeMetadata) => {
    const attributeValue = dynamoAttributes[attributeMetadata.name];
    if (!Object.prototype.hasOwnProperty.call(dynamoAttributes, attributeMetadata.name)) {
      // attribute is defined but not provided by DynamoDB
      // raise error but maybe later?
      return;
    } else {
      record.setAttribute(attributeMetadata.name, attributeValue);
    }
  });

  return record;
}

export function unmarshal<T extends Table>(
  tableClass: ITable<T>,
  dynamoAttributes: Record<string, AttributeValue>
): T {
  const result = unmarshall(dynamoAttributes) as Record<string, unknown>;
  _.map(result, (val, key) => {
    // SDK v3 unmarshall returns Set for NS/SS types - convert to array for backward compatibility
    if (val instanceof Set) {
      result[key] = Array.from(val);
    } else if (val !== null && typeof(val) === "object" && (val as Record<string, unknown>).values && (val as Record<string, unknown>).type) {
      result[key] = (val as Record<string, unknown>).values;
    }
  });
  return deserialize(tableClass, result);
}
