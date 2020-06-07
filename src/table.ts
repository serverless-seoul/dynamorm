// Base Table
import * as Metadata from "./metadata";
import * as Query from "./query";

import * as _ from "lodash";

export class Table {
  // This will be setted by Decorator
  static get metadata() {
    if (!(this as any).__metadata) {
      (this as any).__metadata = Metadata.Table.createMetadata();
    }
    return (this as any).__metadata as Metadata.Table.Metadata;
  }
  static set metadata(metadata: Metadata.Table.Metadata) {
    (this as any).__metadata = metadata;
  }

  // Table Operations
  static async createTable() {
    await Query.TableOperations.createTable(this.metadata);
  }
  static async dropTable() {
    await Query.TableOperations.dropTable(this.metadata);
  }

  // raw storage for all attributes this record (instance) has
  // tslint:disable-next-line: variable-name
  private attributes: { [key: string]: any } = {};

  // Those are pretty much "Private". don't use it if its possible
  setAttribute(name: string, value: any) {
    // Do validation with Attribute metadata maybe
    this.attributes[name] = value;
  }
  getAttribute(name: string) {
    return this.attributes[name];
  }
  setAttributes(attributes: { [name: string]: any }) {
    _.forEach(attributes, (value, name) => {
      this.setAttribute(name, value);
    });
  }

  // tslint:disable-next-line: variable-name
  private __writer: Query.Writer<Table> | undefined = undefined;
  private get writer(): Query.Writer<Table> {
    if (!this.__writer) {
      this.__writer = new Query.Writer(this.constructor as ITable<Table>);
    }
    return this.__writer;
  }

  public async save() {
    return await this.writer.put(this);
  }
  public async delete() {
    return await this.writer.delete(this);
  }

  serialize() {
    // TODO some serialization logic
    return this.attributes;
  }
}

// tslint:disable-next-line: interface-name
export interface ITable<T extends Table> {
  metadata: Metadata.Table.Metadata;
  new(): T;
}
