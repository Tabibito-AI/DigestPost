import cron from "node-cron";
import { getActiveUserConfigs } from "../db";
import { getRandomArticle } from "./scraper";
import { generateContent, generateFallbackTweet } from "./contentGenerator";
import { generateTweetImage } from "./imageGenerator";
import { postTweet } from "./twitterPoster";

/**
 * Process a single user configuration and post a tweet
 */
async function processUserConfig(config: any): Promise<void> {
  try {
    console.log(`[Scheduler] Processing config ${config.id} for user ${config.userId}`);

    // Get a random article
    const article = await getRandomArticle();
    if (!article) {
      console.warn(`[Scheduler] Failed to get article for config ${config.id}`);
      return;
    }

    console.log(`[Scheduler] Got article: ${article.title} from ${article.source}`);

    // Generate content
    let content = await generateContent(article.title, article.content, article.url);
    if (!content) {
      // Use fallback if AI generation fails
      content = {
        tweetText: generateFallbackTweet(article.title),
        imagePrompt: `A professional news illustration about: ${article.title}`,
      };
    }

    console.log(`[Scheduler] Generated tweet: ${content.tweetText}`);

    // Generate image
    const imageUrl = await generateTweetImage(content.imagePrompt);

    // Post to Twitter
    const credentials = {
      apiKey: config.xApiKey,
      apiSecret: config.xApiSecret,
      accessToken: config.xAccessToken,
      accessTokenSecret: config.xAccessTokenSecret,
    };

    const success = await postTweet(
      credentials,
      content.tweetText,
      imageUrl,
      article.url,
      article.title,
      article.source,
      config.id
    );

    if (success) {
      console.log(`[Scheduler] Successfully posted tweet for config ${config.id}`);
    } else {
      console.error(`[Scheduler] Failed to post tweet for config ${config.id}`);
    }
  } catch (error) {
    console.error(`[Scheduler] Error processing config ${config.id}:`, error);
  }
}

/**
 * Main scheduler task - runs every 5 hours
 */
async function runScheduledTask(): Promise<void> {
  try {
    console.log("[Scheduler] Running scheduled task at", new Date().toISOString());

    // Get all active configurations
    const configs = await getActiveUserConfigs();
    console.log(`[Scheduler] Found ${configs.length} active configurations`);

    // Process each configuration
    for (const config of configs) {
      await processUserConfig(config);
      // Add a small delay between processing to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log("[Scheduler] Scheduled task completed");
  } catch (error) {
    console.error("[Scheduler] Error in scheduled task:", error);
  }
}

/**
 * Initialize the scheduler
 * Runs every 5 hours
 */
export function initializeScheduler(): void {
  try {
    // Schedule task to run every 5 hours
    // Cron expression: 0 */5 * * * * (seconds minutes hours day month day-of-week)
    const task = cron.schedule("0 0 */5 * * *", async () => {
      await runScheduledTask();
    });

    console.log("[Scheduler] Scheduler initialized - will run every 5 hours at minute 0");

    // Also run once on startup (after a short delay to ensure DB is ready)
    setTimeout(() => {
      console.log("[Scheduler] Running initial task on startup");
      runScheduledTask().catch((error) =>
        console.error("[Scheduler] Error in initial task:", error)
      );
    }, 5000);

    // Task is registered with cron
  } catch (error) {
    console.error("[Scheduler] Failed to initialize scheduler:", error);
  }
}

/**
 * Run the scheduler task manually (for testing)
 */
export async function runSchedulerManually(): Promise<void> {
  await runScheduledTask();
}
