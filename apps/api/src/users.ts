import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { getDynamoDb, TABLE_NAME } from "./db";

export interface User {
  username: string;
  passwordHash: string;
  settings?: Record<string, string>;
}

export type UserSettings = Partial<
  Record<"app-theme" | "app-theme-by-scheme", string>
>;

const USER_SETTING_KEYS = ["app-theme", "app-theme-by-scheme"] as const;

const sanitizeUserSettings = (value: unknown): UserSettings => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const settings = value as Record<string, unknown>;
  const sanitized: UserSettings = {};

  for (const key of USER_SETTING_KEYS) {
    const rawValue = settings[key];
    if (typeof rawValue === "string") {
      sanitized[key] = rawValue;
    }
  }

  return sanitized;
};

export const findUser = async (username: string): Promise<User | undefined> => {
  const result = await getDynamoDb().send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { username },
    })
  );
  return result.Item as User;
};

export const createUser = async (
  username: string,
  passwordHash: string
): Promise<User> => {
  const user: User = {
    username,
    passwordHash,
  };

  await getDynamoDb().send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: user,
      ConditionExpression: "attribute_not_exists(username)",
    })
  );

  return user;
};

export const getUserSettings = async (
  username: string
): Promise<UserSettings> => {
  const user = await findUser(username);
  return sanitizeUserSettings(user?.settings ?? null);
};

export const saveUserSettings = async (
  username: string,
  settings: unknown
): Promise<UserSettings> => {
  const sanitizedInput = sanitizeUserSettings(settings);
  const currentSettings = await getUserSettings(username);
  const mergedSettings = {
    ...currentSettings,
    ...sanitizedInput,
  };

  await getDynamoDb().send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { username },
      UpdateExpression: "SET #settings = :settings, #updatedAt = :updatedAt",
      ConditionExpression: "attribute_exists(username)",
      ExpressionAttributeNames: {
        "#settings": "settings",
        "#updatedAt": "settingsUpdatedAt",
      },
      ExpressionAttributeValues: {
        ":settings": mergedSettings,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );

  return mergedSettings;
};
