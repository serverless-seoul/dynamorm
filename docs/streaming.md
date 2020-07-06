---
id: streaming
title: Streaming (Change Data Capture)
sidebar_label: Streaming
---

## Intro
[DynamoDB Stream](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html) is simple but powerful tool for capturing any data changes in DynamoDB  
in general, any actions that happens reactively based on data change (insert / delete / update) of DynamoDB, can be implemented with DynamoDB Stream.  
this can be used for a lot of things, such as  
- Sending notification based on model change. 
  - Message record inserted ➤ send notification.
- [backup records when it's expired by TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/time-to-live-ttl-streams.html)
- [cross region replication](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.CrossRegionRepl.html)
  - but you can just use global table now :)
- Asynchronously update counters / stats. 
  - Like created ➤ Post.like_count += 1
- Asynchronously updates search index, such as ElasticSearch
  - UserGameRanking changed ➤ Update ElasticSearch's user record  
  
And more.  


Most of those features are also implmentable in periodic batch reading,  
but streaming is far more superior on those aspects:  
- Efficient data reading & indexing
  - You don't need to create new index such as "updated_at" just to get the list of items has been updated
- Fail safe retrying
  - Under the hood, DynamoDB stream is very similar to Kinesis stream. so it has queue of events, let handler (in this case AWS Lambda) to handle it. If it fails, event remains on queue for maximum 24 hours 
  


## So what does dynamorm-stream do exactly?
DynamoDB Stream gives serialized records as input - so you need to know how to deserialize it  
Naturally this involve some sort of **Mapping**:  
```json
// Original Input you'll get from DynamoDB Stream
{
    "Records": [
        {
            "eventID": "7de3041dd709b024af6f29e4fa13d34c",
            "eventName": "INSERT",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-west-2",
            "dynamodb": {
                "ApproximateCreationDateTime": 1479499740,
                "Keys": {
                    "Timestamp": {
                        "S": "2016-11-18:12:09:36"
                    },
                    "Username": {
                        "S": "John Doe"
                    }
                },
                "NewImage": {
                    "Timestamp": {
                        "S": "2016-11-18:12:09:36"
                    },
                    "Message": {
                        "S": "This is a bark from the Woofer social network"
                    },
                    "Username": {
                        "S": "John Doe"
                    }
                },
                "SequenceNumber": "13021600000000001596893679",
                "SizeBytes": 112,
                "StreamViewType": "NEW_IMAGE"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-east-1:123456789012:table/BarkTable/stream/2016-11-16T20:42:48.104"
        }
    ]
}
```
  
And this should be just look like 
```typescript
class BarkTable {
  Timestamp: string;
  Username: string;
  Message: string;
}
```
  
dynamorm-stream does exactly this part. converting those records (events) safely back to mapped object
