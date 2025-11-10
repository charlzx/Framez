import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user
export const store = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    displayName: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    followersCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        displayName: args.displayName ?? existingUser.displayName,
        username: args.username ?? existingUser.username,
        bio: args.bio ?? existingUser.bio,
        avatarUrl: args.avatarUrl,
        followersCount: args.followersCount ?? existingUser.followersCount ?? 0,
        followingCount: args.followingCount ?? existingUser.followingCount ?? 0,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        displayName: args.displayName ?? args.name,
        username: args.username,
        bio: args.bio,
        avatarUrl: args.avatarUrl,
        followersCount: args.followersCount ?? 0,
        followingCount: args.followingCount ?? 0,
      });
      return userId;
    }
  },
});

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get current user info
export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    
    return user;
  },
});

// List all users (for discovery/search)
export const list = query({
  handler: async (ctx) => {
    return ctx.db.query("users").collect();
  },
});

// Get user by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

// Get user by Convex document id
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
