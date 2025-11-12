import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for profile image
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

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
    avatarStorageId: v.optional(v.id("_storage")),
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
        avatarStorageId: args.avatarStorageId,
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
        avatarStorageId: args.avatarStorageId,
        followersCount: args.followersCount ?? 0,
        followingCount: args.followingCount ?? 0,
      });
      return userId;
    }
  },
});

export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    displayName: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const nextDisplayName = args.displayName ?? user.displayName ?? user.name;
    const nextUsername = args.username ?? user.username ?? undefined;
    const nextBio = args.bio ?? user.bio;
    const nextAvatarStorageId = args.avatarStorageId ?? user.avatarStorageId;
    
    // Resolve avatar URL from storage
    const nextAvatar = nextAvatarStorageId 
      ? await ctx.storage.getUrl(nextAvatarStorageId)
      : user.avatarUrl ?? undefined;

    await ctx.db.patch(user._id, {
      displayName: nextDisplayName,
      username: nextUsername,
      bio: nextBio,
      avatarUrl: nextAvatar ?? undefined,
      avatarStorageId: nextAvatarStorageId,
    });

    const posts = await ctx.db.query("posts").collect();

    for (const post of posts) {
      const patch: Record<string, any> = {};

      if (post.authorId === args.clerkId) {
        patch.authorName = nextDisplayName;
        patch.authorUsername = nextUsername;
        patch.authorAvatar = nextAvatar ?? undefined;
      }

      if (post.comments && post.comments.length > 0) {
        const updatedComments = post.comments.map((comment) =>
          comment.authorId === args.clerkId
            ? {
                ...comment,
                authorName: nextDisplayName,
                authorUsername: nextUsername,
                authorAvatar: nextAvatar ?? undefined,
              }
            : comment
        );

        const hasChanged = updatedComments.some((comment, index) => comment !== post.comments![index]);
        if (hasChanged) {
          patch.comments = updatedComments;
        }
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(post._id, patch);
      }
    }

    const notifications = await ctx.db.query("notifications").collect();
    for (const notification of notifications) {
      if (notification.actorId === args.clerkId) {
        await ctx.db.patch(notification._id, {
          actorName: nextDisplayName,
          actorAvatar: nextAvatar ?? undefined,
        });
      }
    }

    return { success: true };
  },
});

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    
    if (!user) return null;
    
    // Resolve avatar URL from storage if available
    const avatarUrl = user.avatarStorageId
      ? await ctx.storage.getUrl(user.avatarStorageId)
      : user.avatarUrl;
    
    return {
      ...user,
      avatarUrl: avatarUrl ?? undefined,
    };
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
    
    if (!user) return null;
    
    // Resolve avatar URL from storage if available
    const avatarUrl = user.avatarStorageId
      ? await ctx.storage.getUrl(user.avatarStorageId)
      : user.avatarUrl;
    
    return {
      ...user,
      avatarUrl: avatarUrl ?? undefined,
    };
  },
});

// List all users (for discovery/search)
export const list = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    // Resolve avatar URLs from storage for all users
    return Promise.all(
      users.map(async (user) => {
        const avatarUrl = user.avatarStorageId
          ? await ctx.storage.getUrl(user.avatarStorageId)
          : user.avatarUrl;
        
        return {
          ...user,
          avatarUrl: avatarUrl ?? undefined,
        };
      })
    );
  },
});

// Get user by username
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    
    if (!user) return null;
    
    // Resolve avatar URL from storage if available
    const avatarUrl = user.avatarStorageId
      ? await ctx.storage.getUrl(user.avatarStorageId)
      : user.avatarUrl;
    
    return {
      ...user,
      avatarUrl: avatarUrl ?? undefined,
    };
  },
});

// Get user by Convex document id
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    
    if (!user) return null;
    
    // Resolve avatar URL from storage if available
    const avatarUrl = user.avatarStorageId
      ? await ctx.storage.getUrl(user.avatarStorageId)
      : user.avatarUrl;
    
    return {
      ...user,
      avatarUrl: avatarUrl ?? undefined,
    };
  },
});
