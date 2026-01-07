[![GitHub version](https://badge.fury.io/gh/serverless-seoul%2Fdynamorm.svg)](https://badge.fury.io/gh/serverless-seoul%2Fdynamorm)
[![npm version](https://badge.fury.io/js/%40serverless-seoul%2Fdynamorm.svg)](https://badge.fury.io/js/%40serverless-seoul%2Fdynamorm)
[![Semantic Release enabled](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## What Is Dynamorm?
Dynamorm is a **native Typescript** ORM for [AWS DynamoDB](https://aws.amazon.com/dynamodb/)
Written in Typescript from scratch, Fully support typing through template / decorator syntax
*This is hard fork of [dynamo-types](https://github.com/balmbees/dynamo-types), for active maintenance reason*

# Install
```
npm install @serverless-seoul/dynamorm
```

> **Note:** v4.0.0 contains breaking changes. See the [Migration Guide](#migration-guide-3x--4x) below.

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
  declare id: string;

  @Decorator.Attribute({ name: "title" })
  declare title: string;

  @Decorator.Attribute({ name: "body" })
  public body: Array<
    | { type: "text", text: string }
    | { type: "image", url: string, width: number, height: number }
  > = [];

  @Decorator.Attribute()
  public viewCount: number = 0;

  @Decorator.Attribute()
  declare author: {
    name: string;
    profileImageURL: string;
  };
}
```

Dynamorm supports all dynamodb query / scan / update / delete interface, and...
- TimeToLive attribute
- Optimized aws-sdk usage (HTTP Connection reusing)
- AWS X-Ray
- Testing (Local DynamoDB) support

... and more!
# **[Checkout Full Documents](https://serverless-seoul.github.io/dynamorm/docs/introduction)!**


# Testing
you need to run dynamodb locally in order to run unit tests
```
brew install docker
docker pull amazon/dynamodb-local
docker run --rm --name dynamodb-local -p 8000:8000 -d amazon/dynamodb-local
```
running test
```
DYNAMO_TYPES_ENDPOINT=http://127.0.0.1:8000 npm run test
```

---

# Migration Guide: 3.x → 4.x

## Breaking Changes

### 1. AWS SDK v3
Dynamorm 4.x uses AWS SDK v3 instead of v2. This is a complete rewrite of the AWS SDK with a modular architecture.

**Connection interface changes:**
```typescript
// v3.x - SDK v2
import { DynamoDB } from "aws-sdk";

// v4.x - SDK v3
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
```

If you're using custom connections, update your code to use the new SDK v3 client types.

### 2. Node.js 20+ Required
Dynamorm 4.x requires Node.js 20.0.0 or higher.

### 3. DAX Support Removed
DAX (DynamoDB Accelerator) support has been removed. The `amazon-dax-client` package does not support AWS SDK v3. If you need DAX, stay on v3.x.

### 4. Class Property Declaration (Important!)
Due to TypeScript's ES2022 target and `useDefineForClassFields` behavior, properties decorated with `@Attribute()` must now use the `declare` keyword instead of the definite assignment assertion (`!`).

**Before (3.x):**
```typescript
@Decorator.Table({ name: "posts" })
class Post extends Table {
  @Decorator.Attribute()
  public id!: number;

  @Decorator.Attribute()
  public title!: string;
}
```

**After (4.x):**
```typescript
@Decorator.Table({ name: "posts" })
class Post extends Table {
  @Decorator.Attribute()
  declare id: number;

  @Decorator.Attribute()
  declare title: string;
}
```

**Why?** With ES2022+ target, class fields are defined using `Object.defineProperty` at construction time, which overwrites any getters/setters set by decorators. The `declare` keyword tells TypeScript the property exists but doesn't emit any JavaScript for it, allowing the decorator to manage the property.

Properties with default values don't need `declare`:
```typescript
@Decorator.Attribute()
public viewCount: number = 0;  // This is fine, has initializer
```

### 5. Dependencies Updated
- TypeScript 5.7+
- ESLint 9.x (flat config)
- Mocha 11.x
- Chai 5.x

## Quick Migration Checklist

- [ ] Update Node.js to v20+
- [ ] Replace `public prop!: Type` with `declare prop: Type` for `@Attribute()` decorated properties without initializers
- [ ] Remove any DAX connection code (or stay on v3.x if you need DAX)
- [ ] Update any custom connection code to use AWS SDK v3 types
- [ ] Run tests to verify everything works
