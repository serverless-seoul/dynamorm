---
id: quick-start
title: Quick Start
sidebar_label: Quick Start
---

Let's see a simple example of creating Blog model for quick start!  
This guide assumes basic understanding about below things from readers:
-  Typescript
- ES6 Async & Await
- AWS DynamoDB
  - concept of aws credential / IAM / region

***

## 1. Install
```bash
npm install @serverless-seoul/dynamorm
```

## 2. TSC setting
Dynamorm utilize [reflect-metadata](https://github.com/rbuckton/reflect-metadata) to read metadata (usually type of variables) from Typescript code. to do so, you must enable those options.

```json
/**
 * tsconfig.json
 */
{
    "compilerOptions": {
        // other options..
        //
        "experimentalDecorators": true, // required
        "emitDecoratorMetadata": true // required
    }
}
```

## 2. Define your model
```typescript
/**
 * src/blog_post.ts
 */
import {
  Config,
  Decorator,
  Query,
  Table,
} from "@serverless-seoul/dynamorm";

@Decorator.Table({ name: `your_table_name_on_aws_dynamodb` })
export class BlogPost extends Table {
  // Here we define this tables primaryKey as "Hash" - which means it'll only have hash key, no rangekey
  @Decorator.HashPrimaryKey("id")
  public static readonly primaryKey: Query.HashPrimaryKey<BlogPost, number>; 

  // Writer is optional syntax sugar - only needed for none instance method operations, such as batchUpdate
  @Decorator.Writer()
  public static readonly writer: Query.Writer<BlogPost>;

  // Name stands for how this attribute will be mapped into DynamoDB record's attribute
  @Decorator.Attribute({ name: "id" })
  public id: string!;

  @Decorator.Attribute({ name: "title" })
  public title: string!;

  // DynamoDB can take any json representable plain javascript object as attribute
  @Decorator.Attribute({ name: "body" })
  public body: Array<
    | { type: "text", text: string }
    | { type: "image", url: string, width: number, height: number }
  > = [];

  /**
   * You can skip "name", 
   * this is equal to @Decorator.Attribute({ name: "viewCount" })
   */
  @Decorator.Attribute()
  public viewCount: number = 0;

  @Decorator.Attribute()
  public author: {
    name: string;
    profileImageURL: string;
  }
}
```

## 3. Use it!
```typescript
/**
 * src/test.ts
 */
import { BlogPost } from "./blog_post";

async function test() {
  // Create table(including index / TTL) at AWS, based on configuration from the table
  await BlogPost.createTable();

  // Drop table from AWS
  await BlogPost.dropTable();

  // Creating Record
  let post = new BlogPost();
  post.id = "first-blog-post";
  post.title = "My First Blog Post";
  post.body = [
    { type: "text", text: "Some great header" },
    { type: "image", url: "http://some-great-image", width: 1000, height: 1000 },
    { type: "text", text: "Some great footer" },
  ]
  post.viewCount = 0;
  await post.save();

  // Inserting multiple records at once (through DynamoDB batchPut API)
  await BlogPost.writer.batchPut([
    new BlogPost(),
    new BlogPost()
  ]);

  // Find Record
  let post = await BlogPost.primaryKey.get("first-blog-post");

  // BatchGet
  // This array is strongly typed such as Array<[number, string]> so don't worry.
  await BlogPost.primaryKey.batchGet([
    "first-blog-post",
    "second-blog-post"
  ])
  
  // Delete record
  await post.delete()
}
test();

```

## 4. Configure your AWS Credentials
Dynamorm rely on aws-sdk's official credential system, [Docs](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-started-nodejs.html)
```bash
export AWS_ACCESS_KEY_ID = "Your AWS Access Key ID"
export AWS_SECRET_ACCESS_KEY = "Your AWS Secret Access Key"
export AWS_REGION = "ap-northeast-2"
```

## 5. Run
```bash
npx ts-node ./src/test.ts
```