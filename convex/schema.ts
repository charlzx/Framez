import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  posts: defineTable({
    authorId: v.string(),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    timestamp: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_timestamp", ["timestamp"]),
});
