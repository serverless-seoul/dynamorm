import * as _ from "lodash";

import * as Metadata from "./metadata";
import * as Query from "./query";
import { Conditions } from "./query/expressions/conditions";

export class Table {
  // This will be setted by Decorator
  public static get metadata() {
    if (!(this as any).__metadata) {
      (this as any).__metadata = Metadata.Table.createMetadata();
    }
    return (this as any).__metadata as Metadata.Table.Metadata;
  }
  public static set metadata(metadata: Metadata.Table.Metadata) {
    (this as any).__metadata = metadata;
  }

  // Table Operations
  public static async createTable() {
    await Query.TableOperations.createTable(this.metadata);
  }
  public static async dropTable() {
    await Query.TableOperations.dropTable(this.metadata);
  }

  // raw storage for all attributes this record (instance) has
  private attributes: { [key: string]: any } = {};

  private __writer: Query.Writer<Table> | null = null;

  public getAttribute(name: string) {
    return this.attributes[name];
  }

  // Those are pretty much "Private". don't use it if its possible
  public setAttribute(name: string, value: any) {
    // Do validation with Attribute metadata maybe
    this.attributes[name] = value;
  }

  public setAttributes(attributes: { [name: string]: any }) {
    _.forEach(attributes, (value, name) => {
      this.setAttribute(name, value);
    });
  }

  private get writer(): Query.Writer<Table> {
    if (!this.__writer) {
      this.__writer = new Query.Writer(this.constructor as ITable<Table>);
    }
    return this.__writer;
  }

  public async save<T extends Table>(
    this: T,
    options?: Partial<{
      condition?: Conditions<T> | Array<Conditions<T>>;
    }>
  ) {
    return await this.writer.put(this, options);
  }
  public async delete<T extends Table>(
    this: T,
    options?: Partial<{
      condition?: Conditions<T> | Array<Conditions<T>>;
    }>
  ) {
    return await this.writer.delete(this, options);
  }
  public serialize() {
    // TODO some serialization logic
    return this.attributes;
  }
}

export interface ITable<T extends Table> {
  metadata: Metadata.Table.Metadata;
  new(): T;
}
