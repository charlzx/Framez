import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new post
export const create = mutation({
  args: {
    authorId: v.string(),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const postId = await ctx.db.insert("posts", {
      authorId: args.authorId,
      authorName: args.authorName,
      authorAvatar: args.authorAvatar,
      content: args.content,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      timestamp: Date.now(),
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
