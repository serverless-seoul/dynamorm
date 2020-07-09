import { expect } from 'chai';

import * as Query from '../index';

import * as Decorator from '../../decorator';
import { Table } from '../../table';

@Decorator.Table({ name: "prod-Card" })
class Card extends Table {
  static create(id: number, title: string, count: number) {
    const record = new this();
    record.id = id;
    record.title = title;
    record.count = count;
    return record;
  }

  @Decorator.Attribute()
  public id: number;

  @Decorator.Attribute()
  public title: string;

  @Decorator.Attribute()
  public count: number;

  @Decorator.FullPrimaryKey('id', 'title')
  static readonly primaryKey: Query.FullPrimaryKey<Card, number, string>;

  @Decorator.HashGlobalSecondaryIndex('title')
  static readonly hashTitleIndex: Query.HashGlobalSecondaryIndex<Card, string>;

  @Decorator.FullGlobalSecondaryIndex('title', 'id')
  static readonly fullTitleIndex: Query.FullGlobalSecondaryIndex<Card, string, number>;

  @Decorator.Writer()
  static readonly writer: Query.Writer<Card>;
}

describe("HashGlobalSecondaryIndex", () => {
  beforeEach(async() => {
    await Card.createTable();
  });

  afterEach(async () => {
    await Card.dropTable();
  });

  describe("#query", () => {
    it("should find items", async () => {
      await Card.writer.batchPut([
        Card.create(10, "abc", 1),
        Card.create(11, "abd", 1),
        Card.create(12, "abd", 1),
      ]);

      const res = await Card.hashTitleIndex.query("abd");
      expect(res.records.length).to.eq(2);
      expect(res.records[0].id).to.eq(12);
      expect(res.records[1].id).to.eq(11);
    });
  });

  describe("#scanAll", () => {
    it("should find all items", async () => {
      await Card.writer.batchPut([
        Card.create(10, "abc", 1),
        Card.create(11, "abd", 1),
        Card.create(12, "abd", 1),
        Card.create(13, "abd", 1),
        Card.create(14, "abe", 1),
        Card.create(15, "abe", 1),
      ]);
      const res = await Card.hashTitleIndex.scanAll({
        scanBatchSize: 1,
        parallelize: 3,
      });

      expect(res.records.length).to.eq(6);
    });
  });
});

describe("FullGlobalSecondaryIndex", () => {
  beforeEach(async() => {
    await Card.createTable();
  });

  afterEach(async () => {
    await Card.dropTable();
  });

  describe("#query", () => {
    it("should find items", async () => {
      await Card.writer.batchPut([
        Card.create(10, "abc", 1),
        Card.create(11, "abd", 1),
        Card.create(12, "abd", 1),
        Card.create(13, "abd", 1),
      ]);
      const res = await Card.fullTitleIndex.query({
        hash: "abd",
        range: [">=", 12],
        rangeOrder: "DESC",
      });
      expect(res.records.length).to.eq(2);

      expect(res.records[0].id).to.eq(13);
      expect(res.records[1].id).to.eq(12);
    });
  });

  describe("#scanAll", () => {
    it("should find all items", async () => {
      await Card.writer.batchPut([
        Card.create(10, "abc", 1),
        Card.create(11, "abd", 1),
        Card.create(12, "abd", 1),
        Card.create(13, "abd", 1),
        Card.create(14, "abe", 1),
        Card.create(15, "abe", 1),
      ]);
      const res = await Card.fullTitleIndex.scanAll({
        scanBatchSize: 1,
        parallelize: 3,
      });
      expect(res.records.length).to.eq(6);
    });
  });
});
