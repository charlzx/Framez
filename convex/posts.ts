import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new post
export const create = mutation({
  args: {
    authorId: v.string(),
    authorName: v.string(),
    authorUsername: v.optional(v.string()),
    authorAvatar: v.optional(v.string()),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    frames: v.optional(v.array(v.string())),
    media: v.optional(
      v.array(
        v.object({
          id: v.string(),
          url: v.string(),
          type: v.union(v.literal("image"), v.literal("video")),
          alt: v.optional(v.string()),
        })
      )
    ),
    likeCount: v.optional(v.number()),
    replyCount: v.optional(v.number()),
    comments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          postId: v.string(),
          authorId: v.string(),
          authorName: v.string(),
          authorUsername: v.optional(v.string()),
          authorAvatar: v.optional(v.string()),
          content: v.string(),
          timestamp: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const frames = args.frames ?? [];
    const comments = args.comments ?? [];
    const frameCount = frames.length > 0 ? frames.length + 1 : undefined;
    const replyCount = args.replyCount ?? comments.length;

    const postId = await ctx.db.insert("posts", {
      authorId: args.authorId,
      authorName: args.authorName,
      authorUsername: args.authorUsername,
      authorAvatar: args.authorAvatar,
      content: args.content,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      timestamp: Date.now(),
      frames,
      frameCount,
      media: args.media,
      likeCount: args.likeCount ?? 0,
      replyCount,
      comments,
    });
    return postId;
  },
});

// Get all posts (for feed)
export const getAll = query({
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
    return posts;
  },
});

// Get posts by user (for profile)
export const getByUser = query({
  args: { authorId: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .collect();
    return posts;
  },
});

// Get a single post by id
export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Delete a post
export const deletePost = mutation({
  args: {
    id: v.id("posts"),
    requesterId: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== args.requesterId) {
      throw new Error("You can only delete your own post.");
    }

    if (post.imageStorageId) {
      await ctx.storage.delete(post.imageStorageId);
    }

    const existingLikes = await ctx.db
      .query("postLikes")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();

    for (const like of existingLikes) {
      await ctx.db.delete(like._id);
    }

    const hiddenEntries = await ctx.db
      .query("hiddenPosts")
      .withIndex("by_post", (q) => q.eq("postId", args.id))
      .collect();

    for (const entry of hiddenEntries) {
      await ctx.db.delete(entry._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Generate upload URL for images
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Add a comment to a post
export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    authorId: v.string(),
    authorName: v.string(),
    content: v.string(),
    authorUsername: v.optional(v.string()),
    authorAvatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const comments = post.comments ?? [];
    const commentId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const newComment = {
      id: commentId,
      postId: args.postId,
      authorId: args.authorId,
      authorName: args.authorName,
      authorUsername: args.authorUsername,
      authorAvatar: args.authorAvatar,
      content: args.content,
      timestamp: Date.now(),
    };

    await ctx.db.patch(args.postId, {
      comments: [...comments, newComment],
      replyCount: (post.replyCount ?? comments.length) + 1,
    });

    return newComment;
  },
});

export const toggleLike = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const existingLike = await ctx.db
      .query("postLikes")
      .withIndex("by_post_user", (q) => q.eq("postId", args.postId).eq("userId", args.userId))
      .unique();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
    } else {
      await ctx.db.insert("postLikes", {
        postId: args.postId,
        userId: args.userId,
        createdAt: Date.now(),
      });
    }

    const likes = await ctx.db
      .query("postLikes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    await ctx.db.patch(args.postId, {
      likeCount: likes.length,
    });

    return { liked: !existingLike, likeCount: likes.length };
  },
});

export const hidePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId === args.userId) {
      throw new Error("You cannot hide your own post.");
    }

    const existingEntry = await ctx.db
      .query("hiddenPosts")
      .withIndex("by_post_user", (q) => q.eq("postId", args.postId).eq("userId", args.userId))
      .unique();

    if (existingEntry) {
      return { hidden: true };
    }

    await ctx.db.insert("hiddenPosts", {
      postId: args.postId,
      userId: args.userId,
      createdAt: Date.now(),
    });

    return { hidden: true };
  },
});

export const unhidePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingEntry = await ctx.db
      .query("hiddenPosts")
      .withIndex("by_post_user", (q) => q.eq("postId", args.postId).eq("userId", args.userId))
      .unique();

    if (existingEntry) {
      await ctx.db.delete(existingEntry._id);
    }

    return { hidden: false };
  },
});

export const getUserPreferences = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const [likes, hidden] = await Promise.all([
      ctx.db
        .query("postLikes")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("hiddenPosts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
    ]);

    return {
      likedPostIds: likes.map((like) => like.postId),
      hiddenPostIds: hidden.map((entry) => entry.postId),
    };
  },
});
