---
id: introduction
title: Introduction
sidebar_label: Introduction
---

## What Is Dynamorm?
Dynamorm is a **native Typescript** ORM for [AWS DynamoDB](https://aws.amazon.com/dynamodb/)  
Written in Typescript from scratch, Fully support typing through template / decorator syntax
<!-- This is hard fork of https://github.com/balmbees/dynamo-types, for active maintenance reason   -->

## Key Features
- DynamoDB record ⇄ plain TS class mapping, based on decorator
- Table Configurations
- PrimaryKey
   - FullPrimaryKey (Hash, Range)
   - HashPrimaryKey (Hash)
- Local / Global Secondary Indexes
- Attribute
   - Type Support (Number / String / Boolean / Array / Object / Buffer)
   - TimeToLive
- Overcome DynamoDBs limit
  - DynamoDB BatchWrite (batchDelete / batchPut) has a limit of a maximum of 25 items per request
    - Dynamorm automatically parallelize this
  - DynamoDB BatchGet has a limit of a maximum of 100 items per requests, 
    - Dynamorm automatically parallelize this
  - DynamoDB BatchGet doesn't keep the order of items as it is in input keys
    - dynamo-types sort return items based on input keys
  - DynamoDB BatchGet doesn't handle "missing items".
    - dynamo-types has "BatchGet" / "BatchGetFull"
    - BatchGet
      - order items follow to keys, missing items are just missing. returns ```Promise<Array<Model>>```
    - BatchGetFull
      - order items follow to keys, fill missing items with "null". returns ```Promise<Array<Model | null>>```
- DAX Support
   - You can specify this by setting the connection of table. 
- Optimized aws-sdk usage
   - aws-sdk has a problem of not reusing HTTP connection towards DynamoDB by default. check [this issue](https://github.com/aws/aws-sdk-js/issues/900)
   - this could often cause serious latency of > 100ms. it has been optimized here by keep-alive [Code](https://github.com/serverless-seoul/dynamorm/blob/master/src/connections/dynamodb_connection.ts#L37)
- AWS X-Ray support
- Testing (Local DynamoDB) support

## Why Not Other Libraries?
"Do not reinvent the wheel" is very important statements for us too.  
there are some other Javascript DynamoDB ORMs, but we've decided to make one that better on those aspects: 

1. Based on plain ES6 class
   - Most of other libraries has been built before ES6 become widely adapted,  
   thus those rely on custom javascript object rather than plain ES6 class.
2. Fully typed, including index / operator / query 
3. Various internal optimizations for production-ready high performance.
   - such as HTTP connection management 