import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDb, LOGS_TABLE_NAME } from './db';

export const saveLog = async (userId: string, date: string, content: string) => {
  await getDynamoDb().send(
    new PutCommand({
      TableName: LOGS_TABLE_NAME,
      Item: {
        userId,
        date,
        content,
      },
    })
  );
};

export const getLog = async (userId: string, date: string) => {
  const result = await getDynamoDb().send(
    new GetCommand({
      TableName: LOGS_TABLE_NAME,
      Key: {
        userId,
        date,
      },
    })
  );
  return result.Item;
};
