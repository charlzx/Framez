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
      // If no username was provided, generate one from the first word of the displayName/name
      let finalUsername: string | undefined = args.username ?? undefined;

      if (!finalUsername) {
        const source = (args.displayName ?? args.name ?? '').trim();
        const firstWord = source.split(/\s+/)[0] ?? '';
        // Normalize: lowercase and keep only alphanumeric characters
        let candidate = firstWord.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (candidate.length > 0) {
          // Ensure uniqueness by checking the by_username index
          let exists = await ctx.db
            .query('users')
            .withIndex('by_username', (q) => q.eq('username', candidate))
            .unique();

          let suffix = 1;
          while (exists) {
            const numbered = `${candidate}${suffix}`;
            exists = await ctx.db
              .query('users')
              .withIndex('by_username', (q) => q.eq('username', numbered))
              .unique();
            if (!exists) {
              candidate = numbered;
              break;
            }
            suffix += 1;
          }

          finalUsername = candidate;
        } else {
          finalUsername = undefined;
        }
      }

      const userId = await ctx.db.insert('users', {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        displayName: args.displayName ?? args.name,
        username: finalUsername,
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
    
    // Normalize username if provided (server-side validation)
    let nextUsername = user.username ?? undefined;
    if (args.username !== undefined) {
      const normalized = args.username.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalized.length >= 3) {
        // Check if username is available (excluding current user)
        const existingUser = await ctx.db
          .query('users')
          .withIndex('by_username', (q) => q.eq('username', normalized))
          .unique();
        
        if (existingUser && existingUser.clerkId !== args.clerkId) {
          throw new Error('Username is already taken');
        }
        
        nextUsername = normalized;
      } else if (normalized.length > 0) {
        throw new Error('Username must be at least 3 characters');
      }
    }
    
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

// Check if a username is available (case-insensitive)
export const isUsernameAvailable = query({
  args: { 
    username: v.string(),
    currentClerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Normalize username (lowercase, alphanumeric only)
    const normalized = args.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Empty or invalid usernames are not available
    if (normalized.length === 0) {
      return { available: false, message: 'Username must contain at least one letter or number' };
    }

    // Check minimum length
    if (normalized.length < 3) {
      return { available: false, message: 'Username must be at least 3 characters long' };
    }

    // Check maximum length
    if (normalized.length > 30) {
      return { available: false, message: 'Username must be 30 characters or less' };
    }

    // Check if username is already taken
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .unique();
    
    // If no user found, it's available
    if (!existingUser) {
      return { available: true, normalized };
    }

    // If the existing user is the current user, it's available (they're keeping their username)
    if (args.currentClerkId && existingUser.clerkId === args.currentClerkId) {
      return { available: true, normalized };
    }

    // Username is taken by another user
    return { available: false, message: 'This username is already taken' };
  },
});
