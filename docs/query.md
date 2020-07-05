---
id: query
title: Query
sidebar_label: Query
---

## Intro
DynamoDB is very different from conventional RDS in many regards.  
in order to use DynamoDB at it's best form, understanding the core concept of DynamoDB rather than blindly trying replicate the design patterns from RDS is crucial.    
for this, [DynamoDB Guide](https://www.dynamodbguide.com/what-is-dynamo-db/) did fantastic job, we recommend to read it  
on this chapter, we'll focus example of actual of "query" - retriving records from DynamoDB.  

There are 5 different types of queryable enttiy in Dynamorm  
But DynamoDB query patterns are identical, based on key type (Hash or Hash + Range)  
In Dynamorm, we use the term "Hash" and "Full" for those.  

| Entity                   | Data Structure                               |
| :---                     |  :---                                        |
| [HashPrimaryKey](#hashprimarykey)           | Hash                                         |
| [FullPrimaryKey](#fullprimarykey)           | Hash + Range                                 |
| [LocalSecondaryIndex](#localsecondaryindex)      | Hash (Same with PK) + Range                  |
| [HashGlobalSecondaryIndex](#hashglobalsecondaryindex) | Hash (Can be different with PK)              |
| [FullGlobalSecondaryIndex](#fullglobalsecondaryindex) | Hash + Range (both can be different with PK) |

So for example, **FullPrimaryKey** and **FullGlobalSecondaryIndex** has almost identical query interface, except few APIs


## HashPrimaryKey
### ```.get(hashKey: HashKeyType, options: { consistent: boolean }): Promise<T | null>```
find single record with hashKey, return null if record not exists  
if the record is < 4KB, consumes 1 read capacity.
### ```.scan(options)```
(TBD)

### ```.batchGet(hashKeys)```
(TBD)

### ```.batchGetFull()```
(TBD)

## FullPrimaryKey
### ```.get(hashKey, sortKey, options)```
(TBD)

### ```.batchGet(keys)```
(TBD)

### ```.batchGetFull(keys)```
(TBD)

### ```.query(options)```
(TBD)

### ```.scan(options)```
(TBD)

## LocalSecondaryIndex
Identical to [FullPrimaryKey](#fullprimarykey)

## HashGlobalSecondaryIndex
Identical to [HashPrimaryKey](#hashprimarykey)

## FullGlobalSecondaryIndex
Identical to [FullPrimaryKey](#fullprimarykey)

<!-- ### .delete(hashKey, sortKey)
### .update(hashKey, sortKey, changes)
### .batchDelete(keys) -->
<!-- #### .delete(hashKey)
#### .batchDelete(hashKeys)
#### .update(hashKey, changes) -->