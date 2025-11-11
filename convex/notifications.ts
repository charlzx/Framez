import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a notification for a user
 */
export const create = mutation({
  args: {
    userId: v.string(),
    type: v.union(v.literal("like"), v.literal("reply"), v.literal("follow"), v.literal("system")),
    title: v.string(),
    description: v.string(),
    actorId: v.optional(v.string()),
    actorName: v.optional(v.string()),
    actorAvatar: v.optional(v.string()),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Don't create notification if user is acting on their own content
    if (args.actorId && args.actorId === args.userId) {
      return null;
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      description: args.description,
      read: false,
      timestamp: Date.now(),
      actorId: args.actorId,
      actorName: args.actorName,
      actorAvatar: args.actorAvatar,
      postId: args.postId,
      commentId: args.commentId,
    });

    return notificationId;
  },
});

/**
 * Get all notifications for a user
 */
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return notifications;
  },
});

/**
 * Get unread notifications for a user
 */
export const getUnreadByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("read", false))
      .order("desc")
      .collect();

    return notifications;
  },
});

/**
 * Mark a notification as read
 */
export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { read: true });
  },
});

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", args.userId).eq("read", false))
      .collect();

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, { read: true })
      )
    );
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
