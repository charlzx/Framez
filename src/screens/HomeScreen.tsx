import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Alert,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useScrollToTop } from '@react-navigation/native';
import { HomeStackParamList } from '../navigation/HomeStack';
import { useSettingsStore } from '../store/settingsStore';
import PostCard from '../components/PostCard';
import PostOptionsModal from '../components/PostOptionsModal';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize, borderRadius } from '../constants/spacing';
import { Post } from '../types/post';
import { usePostInteractions } from '../hooks/usePostInteractions';

const FEED_TABS: Array<{ key: 'forYou' | 'latest'; label: string }> = [
  { key: 'forYou', label: 'For you' },
  { key: 'latest', label: 'Latest' },
];

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'HomeFeed'>;

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const colors = useThemeColors();
  const posts = useSettingsStore((state) => state.posts);
  const likedPostIds = useSettingsStore((state) => state.likedPostIds);
  const notifications = useSettingsStore((state) => state.notifications);
  const hiddenPostIds = useSettingsStore((state) => state.hiddenPostIds);
  const removePost = useSettingsStore((state) => state.removePost);
  const deletePostMutation = useMutation(api.posts.deletePost);
  const { currentUserId, toggleLike: toggleLikeOnServer, hidePost: hidePostOnServer } =
    usePostInteractions();

  const [activeTab, setActiveTab] = useState<'forYou' | 'latest'>('forYou');
  const [isFabVisible, setFabVisible] = useState(true);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const fabAnimation = useRef(new Animated.Value(1)).current;
  const fabTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<Animated.FlatList<Post> | null>(null);

  useScrollToTop(listRef);

  useEffect(() => {
    Animated.timing(fabAnimation, {
      toValue: isFabVisible ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [fabAnimation, isFabVisible]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const visiblePosts = useMemo(
    () => posts.filter((post) => !hiddenPostIds.includes(post._id)),
    [hiddenPostIds, posts]
  );

  const sortedPosts = useMemo(() => {
    if (activeTab === 'latest') {
      return [...visiblePosts].sort((a, b) => b.timestamp - a.timestamp);
    }

    return [...visiblePosts].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
  }, [activeTab, visiblePosts]);

  const handleScroll = useCallback(
    (event: ScrollEvent) => {
      const currentOffset = event.nativeEvent.contentOffset.y;

      if (fabTimeoutRef.current) {
        clearTimeout(fabTimeoutRef.current);
        fabTimeoutRef.current = null;
      }

      if (isFabVisible && currentOffset > 0) {
        setFabVisible(false);
      }

      fabTimeoutRef.current = setTimeout(() => {
        setFabVisible(true);
      }, 3000);
    },
    [isFabVisible]
  );

  useEffect(() => {
    return () => {
      if (fabTimeoutRef.current) {
        clearTimeout(fabTimeoutRef.current);
        fabTimeoutRef.current = null;
      }
    };
  }, []);

  const handleMoreOptions = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setOptionsVisible(true);
  }, []);

  const handleOpenPost = useCallback(
    (postId: string) => {
      navigation.navigate('PostDetail', { postId });
    },
    [navigation]
  );

  const handleOpenProfile = useCallback(
    (userId: string) => {
      navigation.navigate('UserProfile', { userId });
    },
    [navigation]
  );

  const handleCloseOptions = useCallback(() => {
    setOptionsVisible(false);
    setSelectedPostId(null);
  }, []);

  const confirmDelete = useCallback(
    (postId: string) => {
      if (!currentUserId) {
        Alert.alert('Unable to delete', 'You need to be signed in.');
        return;
      }

      Alert.alert('Delete this frame?', 'This will remove the frame for everyone and cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation({ id: postId as Id<'posts'>, requesterId: currentUserId });
              removePost(postId);
            } catch (error) {
              Alert.alert('Unable to delete', error instanceof Error ? error.message : 'Please try again.');
            }
          },
        },
      ]);
    },
    [currentUserId, deletePostMutation, removePost]
  );

  const selectedPost = useMemo(
    () => (selectedPostId ? posts.find((post) => post._id === selectedPostId) ?? null : null),
    [posts, selectedPostId]
  );

  const handleHideSelected = useCallback(() => {
    if (!selectedPostId || !selectedPost) {
      return;
    }

    hidePostOnServer(selectedPostId, selectedPost.authorId).catch((error) => {
      Alert.alert('Unable to hide', error instanceof Error ? error.message : 'Please try again.');
    });
  }, [hidePostOnServer, selectedPost, selectedPostId]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedPostId) {
      return;
    }

    confirmDelete(selectedPostId);
  }, [confirmDelete, selectedPostId]);

  const renderHeader = useCallback(() => (
    <View style={styles.listHeader}>
      <View style={styles.topBar}>
        <Text style={[styles.logo, { color: colors.foreground }]}>Framez</Text>
        <Pressable
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
          {unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}> 
              <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {FEED_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabButton,
                {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  ), [activeTab, colors, navigation, unreadCount]);

  const handleToggleLike = useCallback(
    (postId: string) => {
      toggleLikeOnServer(postId).catch((error) => {
        Alert.alert('Unable to update like', error instanceof Error ? error.message : 'Please try again.');
      });
    },
    [toggleLikeOnServer]
  );

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        isLiked={likedPostIds.includes(item._id)}
        onToggleLike={handleToggleLike}
        onPressMore={handleMoreOptions}
        onReply={handleOpenPost}
        onPressPost={handleOpenPost}
        onPressAuthor={handleOpenProfile}
      />
    ),
    [handleMoreOptions, handleOpenPost, handleOpenProfile, handleToggleLike, likedPostIds]
  );

  const fabStyle = useMemo(
    () => ({
      transform: [
        {
          scale: fabAnimation,
        },
        {
          translateY: fabAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [42, 0],
          }),
        },
      ],
      opacity: fabAnimation,
    }),
    [fabAnimation]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.FlatList
        ref={listRef}
        data={sortedPosts}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<View style={{ height: spacing.xxl }} />}
        showsVerticalScrollIndicator={false}
      />

      <Animated.View style={[styles.fabWrapper, fabStyle]} pointerEvents={isFabVisible ? 'auto' : 'none'}>
        <Pressable
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreatePost')}
          accessibilityRole="button"
          accessibilityLabel="Create a new post"
        >
          <Ionicons name="add" size={26} color={colors.primaryForeground} />
        </Pressable>
      </Animated.View>

      <PostOptionsModal
        visible={optionsVisible && !!selectedPost}
        onClose={handleCloseOptions}
        onHide={selectedPost && selectedPost.authorId !== currentUserId ? handleHideSelected : undefined}
        onDelete={selectedPost && selectedPost.authorId === currentUserId ? handleDeleteSelected : undefined}
        canHide={!!selectedPost && selectedPost.authorId !== currentUserId}
        canDelete={!!selectedPost && selectedPost.authorId === currentUserId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  listHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  logo: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.xxl,
  },
  notificationButton: {
    position: 'relative',
    padding: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    minWidth: 18,
    height: 18,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceMono_700Bold',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tabButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
    borderWidth: 1,
  },
  tabLabel: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
  },
  fabWrapper: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});
