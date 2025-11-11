import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Keeps the local like/hidden state in sync with Convex for the signed-in user.
 */
export function PostPreferencesHydrator(): null {
  const currentUserId = useSettingsStore((state) => state.currentUserId);
  const setLikedPostIds = useSettingsStore((state) => state.setLikedPostIds);
  const setHiddenPostIds = useSettingsStore((state) => state.setHiddenPostIds);

  const preferences = useQuery(
    api.posts.getUserPreferences,
    currentUserId ? { userId: currentUserId } : 'skip'
  );

  useEffect(() => {
    if (!preferences) {
      return;
    }

    setLikedPostIds(preferences.likedPostIds.map((id) => id as string));
    setHiddenPostIds(preferences.hiddenPostIds.map((id) => id as string));
  }, [preferences, setHiddenPostIds, setLikedPostIds]);

  return null;
}
