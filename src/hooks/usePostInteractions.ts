import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Provides shared like and hide handlers that stay in sync with Convex.
 */
export function usePostInteractions() {
  const currentUserId = useSettingsStore((state) => state.currentUserId);
  const likedPostIds = useSettingsStore((state) => state.likedPostIds);
  const hiddenPostIds = useSettingsStore((state) => state.hiddenPostIds);
  const toggleLikeLocal = useSettingsStore((state) => state.toggleLike);
  const applyLikeState = useSettingsStore((state) => state.applyLikeState);
  const hidePostLocal = useSettingsStore((state) => state.hidePost);
  const unhidePostLocal = useSettingsStore((state) => state.unhidePost);

  const toggleLikeMutation = useMutation(api.posts.toggleLike);
  const hidePostMutation = useMutation(api.posts.hidePost);

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!currentUserId) {
        throw new Error('You need to be signed in to like posts.');
      }

      const wasLiked = likedPostIds.includes(postId);
      toggleLikeLocal(postId);

      try {
        const result = await toggleLikeMutation({
          postId: postId as Id<'posts'>,
          userId: currentUserId,
        });
        applyLikeState(postId, result.liked);
        return result;
      } catch (error) {
        applyLikeState(postId, wasLiked);
        throw error;
      }
    },
    [applyLikeState, currentUserId, likedPostIds, toggleLikeLocal, toggleLikeMutation]
  );

  const hidePost = useCallback(
    async (postId: string, postAuthorId: string) => {
      if (!currentUserId) {
        throw new Error('You need to be signed in to hide posts.');
      }

      if (currentUserId === postAuthorId) {
        throw new Error('You cannot hide your own post.');
      }

      const wasHidden = hiddenPostIds.includes(postId);
      if (!wasHidden) {
        hidePostLocal(postId);
      }

      try {
        const result = await hidePostMutation({
          postId: postId as Id<'posts'>,
          userId: currentUserId,
        });

        if (!result.hidden) {
          unhidePostLocal(postId);
        }

        return result;
      } catch (error) {
        if (!wasHidden) {
          unhidePostLocal(postId);
        }
        throw error;
      }
    },
    [currentUserId, hiddenPostIds, hidePostLocal, hidePostMutation, unhidePostLocal]
  );

  return { currentUserId, toggleLike, hidePost };
}
