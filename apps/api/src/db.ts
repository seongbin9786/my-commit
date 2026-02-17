import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let docClient: DynamoDBDocumentClient | null = null;

// 로컬 DynamoDB 엔드포인트 결정
const getLocalEndpoint = () => {
  // DynamoDB Local 사용 시
  if (process.env.IS_OFFLINE === "true") {
    return "http://localhost:8000";
  }
  return undefined;
};

export const getDynamoDb = (): DynamoDBDocumentClient => {
  if (docClient) return docClient;

  const endpoint = getLocalEndpoint();

  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-northeast-2",
    ...(endpoint && {
      endpoint,
      credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
      },
    }),
  });

  docClient = DynamoDBDocumentClient.from(client);
  return docClient;
};

export const TABLE_NAME =
  process.env.DYNAMODB_USERS_TABLE_NAME ||
  `${process.env.SLS_STAGE || "dev"}-my-time-users`;
export const LOGS_TABLE_NAME =
  process.env.DYNAMODB_LOGS_TABLE_NAME ||
  `${process.env.SLS_STAGE || "dev"}-my-time-logs`;
export const LOG_BACKUPS_TABLE_NAME =
  process.env.DYNAMODB_LOG_BACKUPS_TABLE_NAME ||
  `${process.env.SLS_STAGE || "dev"}-my-time-log-backups`;
