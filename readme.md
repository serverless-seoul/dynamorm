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

Dynamorm supports all dynamodb query / scan / update / delete interface, and...
- TimeToLive attribute
- DAX (DynamoDB Accelerator)
- Optimized aws-sdk usage (HTTP Connection reusing)
- AWS X-Ray
- Testing (Local DynamoDB) support  

... and more!
# **[Checkout Full Documents](https://serverless-seoul.github.io/dynamorm/docs/introduction)!**


# Testing
you need to run dynamodb locally in order to run unit tests  
```
brew cask install docker
docker pull amazon/dynamodb-local
docker run --rm --name catch-dynamo -p 8000:8000 -d amazon/dynamodb-local
```
running test  
```
DYNAMO_TYPES_ENDPOINT=http://127.0.0.1:8000 npm run test
```
