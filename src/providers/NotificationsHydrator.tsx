import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Notification item matching the store interface
 */
type NotificationItem = {
  id: string;
  type: 'like' | 'reply' | 'follow' | 'system';
  title: string;
  description: string;
  read: boolean;
  timestamp: number;
};

const mapConvexNotificationToNotification = (doc: Doc<'notifications'>): NotificationItem => ({
  id: doc._id,
  type: doc.type,
  title: doc.title,
  description: doc.description,
  read: doc.read,
  timestamp: doc.timestamp,
});

/**
 * Keeps the local notifications in sync with Convex for the signed-in user.
 */
export function NotificationsHydrator(): null {
  const currentUserId = useSettingsStore((state) => state.currentUserId);
  const setNotifications = useSettingsStore((state) => state.setNotifications);

  const notifications = useQuery(
    api.notifications.getByUser,
    currentUserId ? { userId: currentUserId } : 'skip'
  );

  useEffect(() => {
    if (!notifications) {
      return;
    }

    setNotifications(notifications.map(mapConvexNotificationToNotification));
  }, [notifications, setNotifications]);

  return null;
}
