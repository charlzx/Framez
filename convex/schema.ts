import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    displayName: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    followersCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  posts: defineTable({
    authorId: v.string(),
    authorName: v.string(),
    authorUsername: v.optional(v.string()),
    authorAvatar: v.optional(v.string()),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    timestamp: v.number(),
    likeCount: v.optional(v.number()),
    replyCount: v.optional(v.number()),
    frameCount: v.optional(v.number()),
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
  })
    .index("by_author", ["authorId"])
    .index("by_timestamp", ["timestamp"]),
});
