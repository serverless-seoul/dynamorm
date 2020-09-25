import { expect } from "chai";

import { DAXConnection } from "../dax_connection";
const AmazonDaxClient = require("amazon-dax-client"); // tslint:disable-line

import * as AWS from "aws-sdk";

describe.skip(DAXConnection.name, () => {
  describe("#constructor", () => {
    it("should work", () => {
      const conn = new DAXConnection({ endpoints: ["vingle-production.zwsblh.clustercfg.dax.use1.cache.amazonaws.com:8111"]});
      expect(conn).to.be.instanceof(DAXConnection);
    });
  });

  describe("#documentClient", () => {
    it("should return documentClient", () => {
      const conn = new DAXConnection({ endpoints: ["vingle-production.zwsblh.clustercfg.dax.use1.cache.amazonaws.com:8111"] });
      expect(conn.documentClient).to.be.instanceof(AWS.DynamoDB.DocumentClient);
    });
  });

  describe("#client", () => {
    it("should return client", () => {
      const conn = new DAXConnection({ endpoints: ["vingle-production.zwsblh.clustercfg.dax.use1.cache.amazonaws.com:8111"] });
      expect(conn.client).to.be.instanceof(AmazonDaxClient);
    });
  });
});
