import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getUserConfigsByUserId,
  getUserConfigById,
  upsertUserConfig,
  deleteUserConfig,
  toggleUserConfigActive,
  updateUserConfigScheduleInterval,
  getPostedTweetsByConfigId,
  getPostedTweetsCountByConfigId,
} from "./db";
import { getRandomArticle } from "./modules/scraper";
import { generateContent, generateFallbackTweet } from "./modules/contentGenerator";
import { generateTweetImage } from "./modules/imageGenerator";
import { postTweet } from "./modules/twitterPoster";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // User Configuration Management
  config: router({
    /**
     * Get all configurations for the current user
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserConfigsByUserId(ctx.user.id);
    }),

    /**
     * Get a specific configuration by ID
     */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getUserConfigById(input.id);
      }),

    /**
     * Create or update a configuration
     */
    upsert: protectedProcedure
      .input(
        z.object({
          id: z.number().optional(),
          xApiKey: z.string().min(1),
          xApiSecret: z.string().min(1),
          xAccessToken: z.string().min(1),
          xAccessTokenSecret: z.string().min(1),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await upsertUserConfig({
          id: input.id,
          userId: ctx.user.id,
          xApiKey: input.xApiKey,
          xApiSecret: input.xApiSecret,
          xAccessToken: input.xAccessToken,
          xAccessTokenSecret: input.xAccessTokenSecret,
          isActive: input.isActive,
        });
      }),

    /**
     * Delete a configuration
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteUserConfig(input.id);
      }),

    /**
     * Toggle configuration active status
     */
    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        return await toggleUserConfigActive(input.id, input.isActive);
      }),

    /**
     * Update configuration schedule interval
     */
    updateScheduleInterval: protectedProcedure
      .input(z.object({ id: z.number(), scheduleInterval: z.number().min(5).max(1440) }))
      .mutation(async ({ input }) => {
        return await updateUserConfigScheduleInterval(input.id, input.scheduleInterval);
      }),
  }),

  // Posted Tweets Management
  tweets: router({
    /**
     * Get posted tweets for a configuration with pagination
     */
    list: protectedProcedure
      .input(
        z.object({
          configId: z.number(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await getPostedTweetsByConfigId(input.configId, input.limit, input.offset);
      }),

    /**
     * Get total count of posted tweets for a configuration
     */
    count: protectedProcedure
      .input(z.object({ configId: z.number() }))
      .query(async ({ input }) => {
        return await getPostedTweetsCountByConfigId(input.configId);
      }),
  }),

  // Manual Execution
  manual: router({
    /**
     * Manually execute the posting workflow for a specific configuration
     */
    executePost: protectedProcedure
      .input(z.object({ configId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          // Get the configuration
          const config = await getUserConfigById(input.configId);
          if (!config) {
            throw new Error("Configuration not found");
          }

          // Get a random article
          const article = await getRandomArticle();
          if (!article) {
            throw new Error("Failed to fetch article");
          }

          // Generate content
          let content = await generateContent(article.title, article.content, article.url);
          if (!content) {
            content = {
              tweetText: generateFallbackTweet(article.title),
              imagePrompt: `A professional news illustration about: ${article.title}`,
            };
          }

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

          if (!success) {
            throw new Error("Failed to post tweet");
          }

          return {
            success: true,
            message: "ツイートを投稿しました",
            tweet: {
              text: content.tweetText,
              imageUrl,
              sourceUrl: article.url,
              sourceTitle: article.title,
              sourceMedia: article.source,
            },
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to execute post: ${errorMessage}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
