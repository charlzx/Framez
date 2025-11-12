import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useSettingsStore } from '../store/settingsStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize, borderRadius } from '../constants/spacing';

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const notifications = useSettingsStore((state) => state.notifications);
  const currentUserId = useSettingsStore((state) => state.currentUserId);
  const markNotificationReadMutation = useMutation(api.notifications.markAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);

  const hasUnread = useMemo(
    () => notifications.some((notification) => !notification.read),
    [notifications]
  );

  const handleMarkAllAsRead = () => {
    if (!currentUserId) return;
    markAllAsReadMutation({ userId: currentUserId });
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationReadMutation({ id: notificationId as Id<'notifications'> });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        {hasUnread ? (
          <Pressable
            onPress={handleMarkAllAsRead}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
          >
            <Text style={[styles.clearLabel, { color: colors.primary }]}>Mark all as read</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const iconName = item.type === 'like'
            ? 'heart'
            : item.type === 'reply'
              ? 'chatbubble'
              : item.type === 'follow'
                ? 'person'
                : 'notifications';

          return (
            <Pressable
              style={[styles.notificationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleMarkAsRead(item.id)}
            >
              <View style={[styles.iconBadge, { backgroundColor: colors.secondary }]}
              >
                <Ionicons name={iconName} size={18} color={colors.secondaryForeground} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.notificationDescription, { color: colors.mutedForeground }]}>
                  {item.description}
                </Text>
              </View>
              {!item.read ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
            </Pressable>
          );
        }}
        contentContainerStyle={{ paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, gap: spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>You are all caught up</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>New activity shows up here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.xl,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearLabel: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.sm,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.large,
    borderWidth: 1,
    padding: spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
    gap: spacing.xs,
  },
  notificationTitle: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
  },
  notificationDescription: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.lg,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
  },
});
