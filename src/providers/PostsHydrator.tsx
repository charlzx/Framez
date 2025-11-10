import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import { useSettingsStore } from '../store/settingsStore';
import type { Post } from '../types/post';

const mapConvexPostToPost = (doc: Doc<'posts'>): Post => ({
  _id: doc._id,
  _creationTime: doc._creationTime,
  authorId: doc.authorId,
  authorName: doc.authorName,
  authorUsername: doc.authorUsername ?? undefined,
  authorAvatar: doc.authorAvatar ?? undefined,
  content: doc.content,
  imageUrl: doc.imageUrl ?? undefined,
  imageStorageId: doc.imageStorageId ?? undefined,
  timestamp: doc.timestamp,
  likeCount: doc.likeCount ?? 0,
  replyCount: doc.replyCount ?? doc.comments?.length ?? 0,
  frameCount: doc.frameCount ?? (doc.frames ? doc.frames.length + 1 : undefined),
  frames: doc.frames ?? undefined,
  media: doc.media ?? undefined,
  comments: doc.comments ?? undefined,
});

/**
 * Subscribes to Convex posts collection and keeps the Zustand store in sync.
 * Render once near the top of the signed-in tree.
 */
export function PostsHydrator(): null {
  const setPosts = useSettingsStore((state) => state.setPosts);
  const posts = useQuery(api.posts.getAll);

  useEffect(() => {
    if (!posts) {
      return;
    }

    setPosts(posts.map(mapConvexPostToPost));
  }, [posts, setPosts]);

  return null;
}
