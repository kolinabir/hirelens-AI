import { MongoClient, Db, Collection, Document, Filter } from "mongodb";
import { env } from "../config/env";
import { DB_CONFIG } from "../config/constants";
import type {
  JobPost,
  FacebookGroup,
  UserCredentials,
  DashboardStats,
} from "../types";
import type { ApifyPost } from "./apify-service";
import crypto from "crypto";

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (this.client && this.db) {
        return; // Already connected
      }

      console.log("🔄 Connecting to MongoDB...");
      this.client = new MongoClient(env.mongodbUri);
      await this.client.connect();
      this.db = this.client.db(env.mongodbDbName);

      // Create indexes
      await this.createIndexes();

      console.log("✅ Connected to MongoDB successfully");
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log("✅ Disconnected from MongoDB");
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  public getCollection<T extends Document>(
    collectionName: string
  ): Collection<T> {
    return this.getDb().collection<T>(collectionName);
  }

  // Typed collection getters
  public getJobsCollection(): Collection<JobPost> {
    return this.getCollection<JobPost>(DB_CONFIG.collections.jobs);
  }

  public getGroupsCollection(): Collection<FacebookGroup> {
    return this.getCollection<FacebookGroup>(DB_CONFIG.collections.groups);
  }

  public getCredentialsCollection(): Collection<UserCredentials> {
    return this.getCollection<UserCredentials>(
      DB_CONFIG.collections.credentials
    );
  }

  private async createIndexes(): Promise<void> {
    try {
      const db = this.getDb();

      // Job posts indexes
      const jobsCollection = db.collection(DB_CONFIG.collections.jobs);

      // Create indexes with proper error handling for duplicates
      const indexes = [
        { key: { postId: 1 }, options: {} },
        { key: { postUrl: 1 }, options: {} },
        { key: { groupId: 1 }, options: {} },
        { key: { scrapedAt: -1 }, options: {} },
        { key: { isProcessed: 1 }, options: {} },
        { key: { isDuplicate: 1 }, options: {} },
        { key: { "jobDetails.type": 1 }, options: {} },
        { key: { "jobDetails.location": 1 }, options: {} },
        { key: { tags: 1 }, options: {} },
        {
          key: {
            content: "text",
            "jobDetails.title": "text",
            "jobDetails.description": "text",
          },
          options: {},
        },
      ];

      for (const { key, options } of indexes) {
        try {
          // Check if index already exists before creating
          const existingIndexes = await jobsCollection.indexes();
          const indexName = Object.keys(key).join("_") + "_1";
          const indexExists = existingIndexes.some(
            (idx) =>
              idx.name === indexName ||
              JSON.stringify(idx.key) === JSON.stringify(key)
          );

          if (!indexExists) {
            await jobsCollection.createIndex(key, options);
          }
        } catch (error: any) {
          // Ignore duplicate index errors (code 85) and duplicate key errors (code 11000)
          if (error.code !== 85 && error.code !== 11000) {
            console.warn(
              `Failed to create index ${JSON.stringify(key)}:`,
              error.message
            );
          }
        }
      }

      // Groups indexes
      const groupsCollection = db.collection(DB_CONFIG.collections.groups);
      await Promise.all([
        groupsCollection.createIndex({ groupId: 1 }, { unique: true }),
        groupsCollection.createIndex({ url: 1 }, { unique: true }),
        groupsCollection.createIndex({ isActive: 1 }),
        groupsCollection.createIndex({ lastScraped: -1 }),
      ]);

      // Credentials indexes
      const credentialsCollection = db.collection(
        DB_CONFIG.collections.credentials
      );
      await Promise.all([
        credentialsCollection.createIndex({ email: 1 }, { unique: true }),
        credentialsCollection.createIndex({ isActive: 1 }),
        credentialsCollection.createIndex({ isBlocked: 1 }),
      ]);

      console.log("✅ Database indexes created successfully");
    } catch (error) {
      console.error("❌ Failed to create indexes:", error);
      throw error;
    }
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) {
        return false;
      }
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();

// Utility functions for common database operations
export class DatabaseUtils {
  // Job Posts operations
  static async insertJobPost(jobPost: Omit<JobPost, "_id">): Promise<string> {
    const collection = dbConnection.getJobsCollection();
    const result = await collection.insertOne(jobPost);
    return result.insertedId.toString();
  }

  static async findJobPosts(
    filter: Filter<JobPost> = {},
    limit = 50,
    skip = 0
  ): Promise<JobPost[]> {
    const collection = dbConnection.getJobsCollection();
    return await collection
      .find(filter)
      .sort({ scrapedAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
  }

  static async countJobPosts(filter: Filter<JobPost> = {}): Promise<number> {
    const collection = dbConnection.getJobsCollection();
    return await collection.countDocuments(filter);
  }

  static async countGroups(
    filter: Filter<FacebookGroup> = {}
  ): Promise<number> {
    const collection = dbConnection.getGroupsCollection();
    return await collection.countDocuments(filter);
  }

  static async updateJobPost(
    postId: string,
    update: Partial<JobPost>
  ): Promise<boolean> {
    const collection = dbConnection.getJobsCollection();
    const result = await collection.updateOne({ postId }, { $set: update });
    return result.modifiedCount > 0;
  }

  static async deleteJobPost(postId: string): Promise<boolean> {
    const collection = dbConnection.getJobsCollection();
    const result = await collection.deleteOne({ postId });
    return result.deletedCount > 0;
  }

  static async clearAllJobPosts(): Promise<number> {
    const collection = dbConnection.getJobsCollection();
    const result = await collection.deleteMany({});
    return result.deletedCount;
  }

  // Remove only unstructured job posts (missing both postUrl and extractedAt)
  static async clearUnstructuredJobPosts(): Promise<number> {
    const collection = dbConnection.getJobsCollection();
    const result = await collection.deleteMany({
      $nor: [
        { postUrl: { $exists: true } },
        { extractedAt: { $exists: true } },
      ],
    });
    return result.deletedCount;
  }

  // Apify-specific operations
  static async saveApifyPosts(
    apifyPosts: ApifyPost[],
    groupId: string,
    groupName: string
  ): Promise<{ saved: number; duplicates: number }> {
    let saved = 0;
    let duplicates = 0;

    for (const apifyPost of apifyPosts) {
      // Generate a unique post ID from the content and user
      const postId = crypto
        .createHash("md5")
        .update(
          `${apifyPost.facebookUrl}_${apifyPost.user.id}_${apifyPost.text}`
        )
        .digest("hex");

      // Check if this post already exists
      const existingPost = await DatabaseUtils.findJobPosts({ postId }, 1);
      if (existingPost.length > 0) {
        duplicates++;
        continue;
      }

      // Convert Apify post to our JobPost format
      const jobPost: Omit<JobPost, "_id"> = {
        postId,
        groupId,
        groupName,
        content: apifyPost.text,
        author: {
          name: apifyPost.user.name,
          profileUrl: `https://facebook.com/${apifyPost.user.id}`,
        },
        postedDate: new Date(), // Apify doesn't provide exact post date
        engagementMetrics: {
          likes: apifyPost.likesCount,
          comments: apifyPost.commentsCount,
          shares: 0, // Not provided by Apify
        },
        jobDetails: {
          // These will be parsed later by LLM or regex
          title: "",
          company: "",
          location: "",
          salary: "",
          description: apifyPost.text,
        },
        apifyData: {
          facebookUrl: apifyPost.facebookUrl,
          user: apifyPost.user,
          likesCount: apifyPost.likesCount,
          commentsCount: apifyPost.commentsCount,
          attachments: apifyPost.attachments?.map((att) => ({
            thumbnail: att.thumbnail,
            __typename: att.__typename,
            photo_image: att.photo_image,
            url: att.url,
            id: att.id,
            ocrText: att.ocrText,
          })),
        },
        scrapedAt: new Date(),
        isProcessed: false,
        isDuplicate: false,
        tags: [],
        source: "apify",
      };

      await DatabaseUtils.insertJobPost(jobPost);
      saved++;
    }

    return { saved, duplicates };
  }

  // Groups operations
  static async insertGroup(group: Omit<FacebookGroup, "_id">): Promise<string> {
    const collection = dbConnection.getGroupsCollection();
    const result = await collection.insertOne(group);
    return result.insertedId.toString();
  }

  static async findGroups(
    filter: Filter<FacebookGroup> = {}
  ): Promise<FacebookGroup[]> {
    const collection = dbConnection.getGroupsCollection();
    return await collection.find(filter).toArray();
  }

  static async updateGroup(
    groupId: string,
    update: Partial<FacebookGroup>
  ): Promise<boolean> {
    const collection = dbConnection.getGroupsCollection();
    const result = await collection.updateOne({ groupId }, { $set: update });
    return result.modifiedCount > 0;
  }

  static async deleteGroup(groupId: string): Promise<boolean> {
    const collection = dbConnection.getGroupsCollection();
    const result = await collection.deleteOne({ groupId });
    return result.deletedCount > 0;
  }

  // Dashboard stats
  static async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalJobs, todayJobs, activeGroups] = await Promise.all([
      DatabaseUtils.countJobPosts(),
      DatabaseUtils.countJobPosts({ scrapedAt: { $gte: today } }),
      DatabaseUtils.countGroups({ isActive: true }),
    ]);

    return {
      totalJobs,
      todayJobs,
      activeGroups,
      activeSessions: 0, // No longer tracking sessions
      lastUpdate: new Date(),
    };
  }
}

export default dbConnection;
