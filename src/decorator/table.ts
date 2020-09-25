import * as Metadata from "../metadata";
import * as Query from "../query";
import { ITable, Table as TableClass } from "../table";

import Config from "../config";
import { Connection } from "../connections";

// Table Decorator
export function Table(options: { name?: string; connection?: Connection } = {}) {
  return (target: ITable<any>) => {
    target.metadata.connection = options.connection || Config.defaultConnection;
    target.metadata.name = options.name || target.name;

    // Table Decorator Executed at last,
    // So Validate metadata, presume all the setups are finisehd
    Metadata.Table.validateMetadata(target.metadata);

    // After validation, setup some methods.
    defineAttributeProperties(target);
    definePrimaryKeyProperty(target);

    defineGlobalSecondaryIndexes(target);
    defineLocalSecondaryIndexes(target);
  };
}

function defineAttributeProperties(table: ITable<any>) {
  table.metadata.attributes.forEach((attr) => {
    Object.defineProperty(
      table.prototype,
      attr.propertyName,
      {
        configurable: true,
        enumerable: true,
        get(this: TableClass) {
          return this.getAttribute(attr.name);
        },
        set(this: TableClass, v) {
          this.setAttribute(attr.name, v);
        },
      },
    );
  });
}

function defineGlobalSecondaryIndexes(table: ITable<any>) {
  table.metadata.globalSecondaryIndexes.forEach((metadata) => {
    if (metadata.type === "HASH") {
      Object.defineProperty(
        table,
        metadata.propertyName,
        {
          value: new Query.HashGlobalSecondaryIndex(table, metadata),
          writable: false,
        },
      );
    } else {
      Object.defineProperty(
        table,
        metadata.propertyName,
        {
          value: new Query.FullGlobalSecondaryIndex(table, metadata),
          writable: false,
        },
      );
    }
  });
}

function defineLocalSecondaryIndexes(table: ITable<any>) {
  table.metadata.localSecondaryIndexes.forEach((metadata) => {
    Object.defineProperty(
      table,
      metadata.propertyName,
      {
        value: new Query.LocalSecondaryIndex(table, metadata),
        writable: false,
      },
    );
  });
}

function definePrimaryKeyProperty(table: ITable<any>) {
  if (table.metadata.primaryKey) {
    const pkMetdata = table.metadata.primaryKey;
    if (pkMetdata.type === "FULL") {
      Object.defineProperty(
        table,
        pkMetdata.name,
        {
          value: new Query.FullPrimaryKey(table, pkMetdata),
          writable: false,
        },
      );
    } else {
      Object.defineProperty(
        table,
        pkMetdata.name,
        {
          value: new Query.HashPrimaryKey(table, pkMetdata),
          writable: false,
        },
      );
    }
  }
}
