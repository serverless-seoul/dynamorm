[![Build Status](https://github.com/balmbees/dynamo-types/workflows/workflow/badge.svg)](https://github.com/balmbees/dynamo-types/actions)
[![npm version](https://badge.fury.io/js/dynamo-types.svg)](https://badge.fury.io/js/dynamo-types)
[![Semantic Release enabled](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)


# DynamoTypes

Typescript ORM of DynamoDB, written from scratch to fully support DynamoDB. Powering [Vingle](https://www.vingle.net)

## Features
1. Serialize / Deserialize DynamoDB record -> TS class object based on annotations.
2. Table Configurations
   - CreateTable
     - Create secondary indexes (Both local / global)
     - Configure TTL
   - DropTable
3. PrimaryKey
   - FullPrimaryKey (Hash, Range)
   - HashPrimaryKey (Hash)
4. Indexes
   - Local, both hash and range key
   - Global, both hash and range key
5. Attribute
   - Type Support (Number / String / Boolean / Array / Object / Buffer)
   - TimeToLive
6. DAX Support
   - You can specify this by setting the connection of table. 
7. Optimized aws-sdk usage
   - aws-sdk has a serious problem of not reusing HTTP connection towards DynamoDB by default. check [this issue](https://github.com/aws/aws-sdk-js/issues/900)
   - this could cause unbearable latency sometimes with showing > 100ms. it's more of an issue of NodeJS HTTP module but nevertheless, it has been optimized here by keep-alive [Code](https://github.com/balmbees/dynamo-types/blob/master/src/connections/dynamodb_connection.ts#L37)
8. AWS X-Ray support
   - XRay is serverless distributed tracing service. In order to log DynamoDB transaction into it, you also need to some sort of risk monkey-patching. Here you can turn it on by setting [`process.env.ENABLE_XRAY = "true"`](https://github.com/balmbees/dynamo-types/blob/e0391c1c171638d06f9262446d8cbcb14a573cc8/src/config.ts#L9)
9. Testing
   - You can change the endpoint of DynamoDB by setting the environment variable or setting new connection, So you can install [local-dynamo](https://www.npmjs.com/package/local-dynamo) locally at setup endpoint to local. refer package.json for the detailed how-to

Also, dynamo-types let you overcome several limits that DynamoDB or the aws-sdk has.

1. BatchWrite (batchDelete / batchPut) has a limit of a maximum of 25 items per request.
   - dynamo-types automatically splits given items into chunks of 25 and sends requests in parallel
2. BatchGet has a limit of a maximum of 100 items per requests
   - dynamo-types automatically splits given keys to chunks of 100 and sends requests in parallel
3. BatchGet doesn't keep the order of items as it is in input keys,
   - dynamo-types sort return items based on input keys
4. BatchGet doesn't handle "missing items".
   - dynamo-types has "BatchGet" / "BatchGetFull" 
     - BatchGet  
        order items follow to keys, missing items are just missing. return type Promise<Array<Item>>  
        so keys.legnth !== items.keys in this case  
     - BatchGetFull   
        order items follow to keys, fill missing items with "null". return type Promise<Array<Item | null>>  
        so keys.length === items.keys always true  

And most importantly, all of those queries regardless of whether it's from index or primary key, strongly typed. I mean what's the point of using typescript if not anyway?

## Usage
```typescript
  @Decorator.Table({ name: "prod-Card" })
  class Card extends Table {
    @Decorator.Attribute()
    public id: number;

    @Decorator.Attribute()
    public title: string;

    @Decorator.Attribute({ timeToLive: true })
    public expiresAt: number;

    @Decorator.FullPrimaryKey('id', 'title')
    static readonly primaryKey: Query.FullPrimaryKey<Card, number, string>;

    @Decorator.Writer()
    static readonly writer: Query.Writer<Card>;
  }

  // Create Table At DynamoDB
  await Card.createTable();

  // Drop Table At DynamoDB
  await Card.dropTable();


  // Creating Record
  const card = new Card();
  card.id = 100;
  card.title = "Title";
  //
  await Card.writer.put(card);
  // OR just
  await card.save();

  // Batch Put
  await Card.writer.batchPut([
    new Card(),
    new Card()
  ]);

  // Get Record
  await Card.primaryKey.get(100, "Title");

  // BatchGet
  // This array is strongly typed such as Array<[number, string]> so don't worry.
  await Card.primaryKey.batchGet([
    [100, "Title"],
    [200, "Title2"]
  ])

  // Query
  // Range key opreations are stringly typed. ([">=", T] | ["=", T] ...)
  await Card.primaryKey.query({
    hash: 100,
    range: [">=", "Title"]
  })

  // Delete record
  await card.delete()

  // Delete record only when it meets condition.
  // with this, you can avoid race condition such as somebody updating the record while you're trying to delete it
  await card.delete({
    condition: { title: Equal("Title") }
  });
  // when mismatch occurs, it raises "ConditionalCheckFailedException" error.

  // Likewise, update record only when it meets condition
  card.title = "New Title"
  await card.save({ condition: { title: "Title" } });
  // when mismatch occurs, it raises "ConditionalCheckFailedException" error.
```

# How does it looks like?
```typescript
import {
  Config,
  Decorator,
  Query,
  Table,
} from "@serverless-seoul/dynamorm";

@Decorator.Table({ name: `your_table_name_on_aws_dynamodb` })
export class BlogPost extends Table {
  @Decorator.HashPrimaryKey("id")
  public static readonly primaryKey: Query.HashPrimaryKey<BlogPost, number>; 

  @Decorator.Attribute({ name: "id" })
  public id: string!;

  @Decorator.Attribute({ name: "title" })
  public title: string!;

  @Decorator.Attribute({ name: "body" })
  public body: Array<
    | { type: "text", text: string }
    | { type: "image", url: string, width: number, height: number }
  > = [];

  @Decorator.Attribute()
  public viewCount: number = 0;

  @Decorator.Attribute()
  public author: {
    name: string;
    profileImageURL: string;
  }
}
```


# **[Checkout Full Documents](https://serverless-seoul.github.io/dynamorm/docs/introduction)!**
and figure out all the features!
