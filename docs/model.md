---
id: model
title: Model
sidebar_label: Model
---

## Model
Dynamorm maps your plain ES6 class with DynamoDB table  
in order to do so, we use Decorator (Annotation) to declare mapping metadata  

## Example
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

  @Decorator.Writer()
  public static readonly writer: Query.Writer<BlogPost>;

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

---

## API

### @Table(options: { name?: string; connection?: Connection } = {}) 
- name means DynamoDB table name
- connection can be customized per table
  - if you want to use [DAX](https://aws.amazon.com/dynamodb/dax/) 
    - ```typescript
        @Decorator.Table({
          name: `table_name`,
          connection: new Connection.DAXConnection({ endpoints: ["dax-url-1", "dax-ur1-2"] })
        })
      ```
  - if you want to use tables from different regions at the same time 
    - ```typescript
        import { DynamoDB } from "aws-sdk";

        const client = new DynamoDB({ region: "ap-northeast-2" });
        const documentClient = new DynamoDB.DocumentClient({ service: client });
        @Decorator.Table({
          name: `catalog_${process.env.STAGE}_absolute_product_popularity`,
          connection: { documentClient, client }
        })
        class TableAtSeoul {}
      ``` 
  - As default, it create connection based on default AWS-SDK environment variables

### @Attribute(options: { name?: string; timeToLive?: true })
defines the attributes that mapped to DynamoDB Table  
timeToLive(TTL) indicates this attributes used for [DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)  
if you run ```createTable()``` having this attribute, Dynamorm configures this attribute as TTL on DynamoDB  
value has to be unix timestamp in seconds, be aware this is not milliseconds  
if the value is undefined, it will be ignored from expiration  
```typescript
@Decorator.Table({ name: `your_table_name_on_aws_dynamodb` })
export class BlogPost extends Table {
  @Decorator.HashPrimaryKey("id")
  public static readonly primaryKey: Query.HashPrimaryKey<BlogPost, number>; 

  @Decorator.Attribute({ name: "id" })
  public id: string!;

  @Decorator.Attribute({ name: "title" })
  public title: string!;

  @Decorator.Attribute({ name: "expiresAt", timeToLive: true })
  public expiresAt?: number;
}


// This will create table and set expiresAt as TTL field
await BlogPost.createTable()

const blogPost = new BlogPost();
blogPost.id = "1";
blogPost.title = "title"
// Expires in 60 seconds
blogPost.expiresAt = Math.floor(Date.now() / 1000) + 60; 
await blogPost.save();


// This record won't expire
const blogPost2 = new BlogPost();
blogPost2.id = "1";
blogPost2.title = "title"
await blogPost2.save();
```
