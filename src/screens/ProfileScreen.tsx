import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useScrollToTop } from '@react-navigation/native';
import { useMutation } from 'convex/react';
import { ProfileStackParamList } from '../navigation/ProfileStack';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSettingsStore } from '../store/settingsStore';
import PostCard from '../components/PostCard';
import EditProfileModal from '../components/EditProfileModal';
import PostOptionsModal from '../components/PostOptionsModal';
import { spacing, fontSize, borderRadius } from '../constants/spacing';
import { Post } from '../types/post';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { usePostInteractions } from '../hooks/usePostInteractions';

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

type TabKey = 'posts' | 'likes';

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const listRef = useRef<FlatList<Post> | null>(null);

  useScrollToTop(listRef);

  const displayName = useSettingsStore((state) => state.displayName);
  const username = useSettingsStore((state) => state.username);
  const description = useSettingsStore((state) => state.description);
  const avatarUrl = useSettingsStore((state) => state.avatarUrl);
  const posts = useSettingsStore((state) => state.posts);
  const likedPostIds = useSettingsStore((state) => state.likedPostIds);
  const updateProfile = useSettingsStore((state) => state.updateProfile);
  const attemptUsernameChange = useSettingsStore((state) => state.attemptUsernameChange);
  const currentUserId = useSettingsStore((state) => state.currentUserId);
  const people = useSettingsStore((state) => state.people);
  const hiddenPostIds = useSettingsStore((state) => state.hiddenPostIds);
  const deletePostMutation = useMutation(api.posts.deletePost);
  const { toggleLike: toggleLikeOnServer, hidePost: hidePostOnServer } = usePostInteractions();

  const currentUser = useMemo(
    () => people.find((person) => person._id === currentUserId),
    [currentUserId, people]
  );

  const userPosts = useMemo(
    () => posts.filter((post) => post.authorId === currentUserId && !hiddenPostIds.includes(post._id)),
    [currentUserId, hiddenPostIds, posts]
  );

  const likedPosts = useMemo(
    () => posts.filter((post) => likedPostIds.includes(post._id) && !hiddenPostIds.includes(post._id)),
    [hiddenPostIds, likedPostIds, posts]
  );

  const activePosts = activeTab === 'posts' ? userPosts : likedPosts;

  const selectedPost = useMemo(
    () => (selectedPostId ? posts.find((post) => post._id === selectedPostId) ?? null : null),
    [posts, selectedPostId]
  );

  const handleMoreOptions = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setOptionsVisible(true);
  }, []);

  const handleCloseOptions = useCallback(() => {
    setOptionsVisible(false);
    setSelectedPostId(null);
  }, []);

  const handleHideSelected = useCallback(() => {
    if (!selectedPostId || !selectedPost) {
      return;
    }

    handleCloseOptions();
    hidePostOnServer(selectedPostId, selectedPost.authorId).catch((error) => {
      Alert.alert('Unable to hide', error instanceof Error ? error.message : 'Please try again.');
    });
  }, [handleCloseOptions, hidePostOnServer, selectedPost, selectedPostId]);

  const confirmDelete = useCallback(
    (postId: string) => {
      if (!currentUserId) {
        Alert.alert('Unable to delete', 'You need to be signed in.');
        return;
      }

      Alert.alert('Delete this post?', 'This will remove the post for everyone and cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation({ id: postId as Id<'posts'>, requesterId: currentUserId });
            } catch (error) {
              Alert.alert(
                'Unable to delete',
                error instanceof Error ? error.message : 'Please try again.'
              );
            }
          },
        },
      ]);
    },
    [currentUserId, deletePostMutation]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedPostId) {
      confirmDelete(selectedPostId);
    }
  }, [confirmDelete, selectedPostId]);

  const handleOpenPost = useCallback(
    (postId: string) => {
      navigation.navigate('PostDetail', { postId });
    },
    [navigation]
  );

  const handleOpenProfile = useCallback(
    (userId: string) => {
      if (userId === currentUserId) {
        return;
      }
      navigation.navigate('UserProfile', { userId });
    },
    [currentUserId, navigation]
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerSection}>
        <View style={styles.topBar}>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Ionicons name="settings-outline" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.profileRow}>
          <Image
            source={{
              uri:
                avatarUrl ||
                'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=256&h=256&q=80',
            }}
            style={[styles.avatar, { borderColor: colors.border }]}
          />
          <View style={styles.profileDetails}>
            <Text style={[styles.displayName, { color: colors.foreground }]}>{displayName}</Text>
            <Text style={[styles.username, { color: colors.mutedForeground }]}>@{username}</Text>
            {description ? (
              <Text style={[styles.bio, { color: colors.foreground }]}>{description}</Text>
            ) : null}
          </View>
        </View>

        <Pressable
          style={[styles.editButton, { backgroundColor: colors.secondary }]}
          onPress={() => setShowEditProfile(true)}
          accessibilityRole="button"
        >
          <Ionicons name="pencil" size={16} color={colors.secondaryForeground} />
          <Text style={[styles.editLabel, { color: colors.secondaryForeground }]}>Edit profile</Text>
        </Pressable>

        <View style={[styles.statsRow, { borderColor: colors.border }]}> 
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{userPosts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {currentUser?.followersCount ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {currentUser?.followingCount ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Following</Text>
          </View>
        </View>

        <View style={styles.tabRow}>
          {(['posts', 'likes'] as TabKey[]).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === 'posts' ? 'Posts' : 'Likes';
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
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
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    ),
    [activeTab, avatarUrl, colors, currentUser?.followersCount, currentUser?.followingCount, description, displayName, navigation, userPosts.length, username]
  );

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList<Post>
        ref={listRef}
        data={activePosts}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<View style={{ height: spacing.xxl }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing here yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              {activeTab === 'posts'
                ? 'Share your first moment to fill this space.'
                : 'Posts you like will show up here.'}
            </Text>
          </View>
        }
      />

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        initialDisplayName={displayName}
        initialUsername={username}
        initialDescription={description}
        initialAvatarUrl={avatarUrl}
        onSave={updateProfile}
        onAttemptUsernameChange={attemptUsernameChange}
      />

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
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.xxl,
  },
  iconButton: {
    padding: spacing.sm,
    position: 'relative',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
  },
  profileDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  displayName: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.xl,
  },
  username: {
    fontSize: fontSize.md,
  },
  bio: {
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  editButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
  },
  editLabel: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
  },
  statsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
  },
  statBlock: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.lg,
  },
  statLabel: {
    fontSize: fontSize.sm,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tabButton: {
    borderRadius: borderRadius.large,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tabLabel: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.lg,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
