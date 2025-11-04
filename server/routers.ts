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
  getPostedTweetsByConfigId,
  getPostedTweetsCountByConfigId,
} from "./db";

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
});

export type AppRouter = typeof appRouter;
