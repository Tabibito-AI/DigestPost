import { TwitterApi } from "twitter-api-v2";
import { createPostedTweet } from "../db";
import { InsertPostedTweet } from "../../drizzle/schema";

export interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

/**
 * Post a tweet with optional image to Twitter
 */
export async function postTweet(
  credentials: TwitterCredentials,
  tweetText: string,
  imageUrl: string | null,
  sourceNewsUrl: string,
  sourceTitle: string,
  sourceMedia: string,
  configId: number
): Promise<boolean> {
  try {
    // Initialize Twitter API client
    const client = new TwitterApi({
      appKey: credentials.apiKey,
      appSecret: credentials.apiSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessTokenSecret,
    });

    const rwClient = client.readWrite;

    // Prepare tweet text with URL
    const fullTweetText = `${tweetText}\n\n${sourceNewsUrl}`;

    // Validate tweet length (X has a 280 character limit)
    const tweetLength = Array.from(fullTweetText).length;
    if (tweetLength > 280) {
      console.error(
        `[TwitterPoster] Tweet exceeds X limit: ${tweetLength} > 280`
      );
      return false;
    }

    let tweetPayload: any = {
      text: fullTweetText,
    };

    // Add image if available
    if (imageUrl) {
      try {
        console.log("[TwitterPoster] Downloading image from:", imageUrl);
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();

        // Upload media to Twitter
        const mediaResult = await rwClient.v1.uploadMedia(Buffer.from(buffer), {
          mimeType: "image/png",
        });

        const mediaId = typeof mediaResult === 'string' ? mediaResult : (mediaResult as any).media_id_string;

        tweetPayload.media = {
          media_ids: [mediaId],
        };

        console.log("[TwitterPoster] Image uploaded with media ID:", mediaId);
      } catch (imageError) {
        console.warn("[TwitterPoster] Failed to upload image, posting without media:", imageError);
      }
    }

    // Post the tweet
    const tweet = await rwClient.v2.tweet(tweetPayload);
    console.log("[TwitterPoster] Tweet posted successfully:", tweet.data.id);

    // Log the posted tweet to database
    const tweetLog: InsertPostedTweet = {
      configId,
      tweetText,
      imageUrl: imageUrl || undefined,
      sourceNewsUrl,
      sourceTitle,
      sourceMedia,
      postedAt: new Date(),
    };

    await createPostedTweet(tweetLog);
    console.log("[TwitterPoster] Tweet logged to database");

    return true;
  } catch (error) {
    console.error("[TwitterPoster] Failed to post tweet:", error);
    return false;
  }
}

/**
 * Validate Twitter credentials
 */
export async function validateCredentials(
  credentials: TwitterCredentials
): Promise<boolean> {
  try {
    const client = new TwitterApi({
      appKey: credentials.apiKey,
      appSecret: credentials.apiSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessTokenSecret,
    });

    const rwClient = client.readWrite;
    const user = await rwClient.v2.me();

    console.log("[TwitterPoster] Credentials validated for user:", user.data.username);
    return true;
  } catch (error) {
    console.error("[TwitterPoster] Failed to validate credentials:", error);
    return false;
  }
}
