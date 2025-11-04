import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userConfigs, postedTweets, InsertUserConfig, InsertPostedTweet } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user configuration by ID
 */
export async function getUserConfigById(configId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user config: database not available");
    return undefined;
  }

  const result = await db.select().from(userConfigs).where(eq(userConfigs.id, configId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all active user configurations
 */
export async function getActiveUserConfigs() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get active configs: database not available");
    return [];
  }

  return await db.select().from(userConfigs).where(eq(userConfigs.isActive, true));
}

/**
 * Get user configurations by user ID
 */
export async function getUserConfigsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user configs: database not available");
    return [];
  }

  return await db.select().from(userConfigs).where(eq(userConfigs.userId, userId));
}

/**
 * Create or update user configuration
 */
export async function upsertUserConfig(config: InsertUserConfig) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user config: database not available");
    return undefined;
  }

  try {
    if (config.id) {
      // Update existing config
      await db.update(userConfigs).set({
        xApiKey: config.xApiKey,
        xApiSecret: config.xApiSecret,
        xAccessToken: config.xAccessToken,
        xAccessTokenSecret: config.xAccessTokenSecret,
        isActive: config.isActive,
        updatedAt: new Date(),
      }).where(eq(userConfigs.id, config.id));
      return await getUserConfigById(config.id);
    } else {
      // Insert new config
      const result = await db.insert(userConfigs).values(config);
      const insertedId = (result as any).insertId;
      return await getUserConfigById(insertedId);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user config:", error);
    throw error;
  }
}

/**
 * Delete user configuration
 */
export async function deleteUserConfig(configId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete user config: database not available");
    return false;
  }

  try {
    await db.delete(userConfigs).where(eq(userConfigs.id, configId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete user config:", error);
    throw error;
  }
}

/**
 * Toggle user configuration active status
 */
export async function toggleUserConfigActive(configId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot toggle user config: database not available");
    return undefined;
  }

  try {
    await db.update(userConfigs).set({
      isActive,
      updatedAt: new Date(),
    }).where(eq(userConfigs.id, configId));
    return await getUserConfigById(configId);
  } catch (error) {
    console.error("[Database] Failed to toggle user config:", error);
    throw error;
  }
}

/**
 * Create posted tweet log
 */
export async function createPostedTweet(tweet: InsertPostedTweet) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create posted tweet: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(postedTweets).values(tweet);
    const insertedId = (result as any).insertId;
    return await getPostedTweetById(insertedId);
  } catch (error) {
    console.error("[Database] Failed to create posted tweet:", error);
    throw error;
  }
}

/**
 * Get posted tweet by ID
 */
export async function getPostedTweetById(tweetId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get posted tweet: database not available");
    return undefined;
  }

  const result = await db.select().from(postedTweets).where(eq(postedTweets.id, tweetId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get posted tweets by config ID with pagination
 */
export async function getPostedTweetsByConfigId(configId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get posted tweets: database not available");
    return [];
  }

  return await db.select()
    .from(postedTweets)
    .where(eq(postedTweets.configId, configId))
    .orderBy(desc(postedTweets.postedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get posted tweets count by config ID
 */
export async function getPostedTweetsCountByConfigId(configId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get posted tweets count: database not available");
    return 0;
  }

  const result = await db.select({ count: postedTweets.id }).from(postedTweets).where(eq(postedTweets.configId, configId));
  return result.length > 0 ? result[0].count : 0;
}
