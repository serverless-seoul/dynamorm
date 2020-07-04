---
id: quick-start
title: Quick Start
sidebar_label: Quick Start
---

Let's see a simple example of creating Blog model for quick start!
This guide assumes below things from readers:
1. Basic understanding of Typescript
2. Basic understa

## 1. Install
```bash
npm install @serverless-seoul/dynamorm
```

## 2. Make sure TSC setting
Dynamorm utilize [reflect-metadata](https://github.com/rbuckton/reflect-metadata) to read metadata (usually type of variables) from Typescript code. to do so, you must enable those options.

```json
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
 * src/models/blog_post.ts
 */
import {
  Config,
  Decorator,
  Query,
  Table,
} from "dynamo-types";

@Decorator.Table({ name: `your_table_name_on_aws_dynamodb` })
export class BlogPost extends Table {
  // Here we define this tables primaryKey as "Hash" - which means it'll only have hash key, no rangekey
  @Decorator.HashPrimaryKey("id")
  public static readonly primaryKey: Query.HashPrimaryKey<CardStat, number>; 

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

## 3. Use it
```typescript
/**
 * src/test.ts
 */
import {
  Config,
  Decorator,
  Query,
  Table,
} from "dynamo-types";

@Decorator.Table({ name: `your_table_name_on_aws_dynamodb` })
export class BlogPost extends Table {
  // Here we define this tables primaryKey as "Hash" - which means it'll only have hash key, no rangekey
  @Decorator.HashPrimaryKey("id")
  public static readonly primaryKey: Query.HashPrimaryKey<CardStat, number>; 

  // Writer is optional syntax sugar - only needed for none instance method operations, such as batchUpdate
  @Decorator.Writer()
  public static readonly writer: Query.Writer<BlogPost>;

  // Name stands for how this attribute will be mapped into DynamoDB record's attribute
  @Decorator.Attribute({ name: "id" })
  public id: string!;

  @Decorator.Attribute({ name: "title" })
  public title: string!;

  // DynamoDB can take json representable plain javascript object as attribute
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

