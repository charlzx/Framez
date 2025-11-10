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
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }
    
    // Delete associated image from storage if it exists
    if (post.imageStorageId) {
      await ctx.storage.delete(post.imageStorageId);
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
