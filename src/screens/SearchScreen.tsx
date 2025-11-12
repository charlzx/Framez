import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from 'convex/react';
import { useSettingsStore } from '../store/settingsStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize, borderRadius } from '../constants/spacing';
import PostCard from '../components/PostCard';
import PostOptionsModal from '../components/PostOptionsModal';
import { SearchStackParamList } from '../navigation/SearchStack';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { usePostInteractions } from '../hooks/usePostInteractions';

const SEARCH_TABS: Array<{ key: 'users' | 'posts'; label: string }> = [
  { key: 'users', label: 'Users' },
  { key: 'posts', label: 'Posts' },
];

type SearchScreenProps = NativeStackScreenProps<SearchStackParamList, 'SearchMain'>;

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const colors = useThemeColors();
  const people = useSettingsStore((state) => state.people);
  const posts = useSettingsStore((state) => state.posts);
  const likedPostIds = useSettingsStore((state) => state.likedPostIds);
  const recentSearches = useSettingsStore((state) => state.recentSearches);
  const addRecentSearch = useSettingsStore((state) => state.addRecentSearch);
  const hiddenPostIds = useSettingsStore((state) => state.hiddenPostIds);
  const removePost = useSettingsStore((state) => state.removePost);
  const deletePostMutation = useMutation(api.posts.deletePost);
  const currentUserId = useSettingsStore((state) => state.currentUserId);
  const { toggleLike: toggleLikeOnServer, hidePost: hidePostOnServer } = usePostInteractions();

  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  useScrollToTop(scrollRef);

  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return [];
    }

    return people.filter((person) => {
      const nameMatch = person.displayName?.toLowerCase().includes(value);
      const usernameMatch = person.username?.toLowerCase().includes(value);
      const bioMatch = person.bio?.toLowerCase().includes(value);
      return Boolean(nameMatch || usernameMatch || bioMatch);
    });
  }, [people, query]);

  const filteredPosts = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return [];
    }

    return posts.filter((post) => {
      if (hiddenPostIds.includes(post._id)) {
        return false;
      }

      const contentMatch = post.content.toLowerCase().includes(value);
      const authorMatch = post.authorName.toLowerCase().includes(value);
      const usernameMatch = post.authorUsername?.toLowerCase().includes(value);
      return Boolean(contentMatch || authorMatch || usernameMatch);
    });
  }, [hiddenPostIds, posts, query]);

  const triggerSearch = useCallback(() => {
    const value = query.trim();
    Keyboard.dismiss();

    if (!value) {
      setShowResults(false);
      return;
    }

    addRecentSearch(value);
    setShowResults(true);

    if (filteredUsers.length === 0 && filteredPosts.length > 0) {
      setActiveTab('posts');
    } else if (filteredUsers.length > 0) {
      setActiveTab('users');
    }
  }, [addRecentSearch, filteredPosts.length, filteredUsers.length, query]);

  const handleRecentSearchPress = useCallback(
    (term: string) => {
      setQuery(term);
      setShowResults(true);
      addRecentSearch(term);
      Keyboard.dismiss();
    },
    [addRecentSearch]
  );

  const handleMoreOptions = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setOptionsVisible(true);
  }, []);

  const handleCloseOptions = useCallback(() => {
    setOptionsVisible(false);
    setSelectedPostId(null);
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
              console.log('Deleting post:', postId, 'by user:', currentUserId);
              await deletePostMutation({ id: postId as Id<'posts'>, requesterId: currentUserId });
              console.log('Post deleted from Convex, removing from local state');
              removePost(postId);
              console.log('Post removed from local state');
              // Close the options modal
              setOptionsVisible(false);
              setSelectedPostId(null);
            } catch (error) {
              console.error('Delete post error:', error);
              Alert.alert(
                'Unable to delete',
                error instanceof Error ? error.message : 'Please try again.'
              );
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
  const handleToggleLike = useCallback(
    (postId: string) => {
      toggleLikeOnServer(postId).catch((error) => {
        Alert.alert('Unable to update like', error instanceof Error ? error.message : 'Please try again.');
      });
    },
    [toggleLikeOnServer]
  );


  const handleDeleteSelected = useCallback(() => {
    if (!selectedPostId) {
      return;
    }

    confirmDelete(selectedPostId);
  }, [confirmDelete, selectedPostId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Search</Text>
        </View>

        <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            placeholder="Search posts, people, categories"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              if (!value.trim()) {
                setShowResults(false);
              }
            }}
            onSubmitEditing={triggerSearch}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable
              style={styles.clearButton}
              onPress={() => {
                setQuery('');
                setShowResults(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
          <Pressable
            style={styles.submitButton}
            onPress={triggerSearch}
            accessibilityRole="button"
            accessibilityLabel="Run search"
          >
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {!showResults ? (
          <View style={styles.emptyState}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent searches</Text>
            <View style={styles.chipRow}>
              {recentSearches.map((term) => (
                <Pressable
                  key={term}
                  onPress={() => handleRecentSearchPress(term)}
                  style={[styles.chip, { backgroundColor: colors.secondary }]}
                >
                  <Text style={[styles.chipLabel, { color: colors.secondaryForeground }]}>{term}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <View style={styles.tabRow}>
              {SEARCH_TABS.map((tab) => {
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

            {activeTab === 'users' ? (
              <View style={styles.userResults}>
                {filteredUsers.length === 0 ? (
                  <Text style={[styles.emptyResultText, { color: colors.mutedForeground }]}>No matching users just yet.</Text>
                ) : (
                  filteredUsers.map((person) => (
                    <View
                      key={person._id}
                      style={[styles.userCard, { borderColor: colors.border, backgroundColor: colors.card }]}
                    >
                      <Pressable
                        onPress={() => handleOpenProfile(person.clerkId ?? person._id)}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${person.displayName}'s profile`}
                      >
                        <Image
                          source={{ uri: person.avatarUrl ?? 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=128&h=128&q=80' }}
                          style={[styles.avatar, { borderColor: colors.border }]}
                        />
                      </Pressable>
                      <View style={styles.userInfo}>
                        <Text style={[styles.displayName, { color: colors.foreground }]}>{person.displayName}</Text>
                        <Text style={[styles.username, { color: colors.mutedForeground }]}>@{person.username}</Text>
                        {person.bio ? (
                          <Text style={[styles.bio, { color: colors.mutedForeground }]} numberOfLines={2}>
                            {person.bio}
                          </Text>
                        ) : null}
                      </View>
                      <Pressable
                        style={[styles.followButton, { backgroundColor: colors.secondary }]}
                        accessibilityRole="button"
                        onPress={() => handleOpenProfile(person.clerkId ?? person._id)}
                      >
                        <Text style={[styles.followLabel, { color: colors.secondaryForeground }]}>View</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            ) : (
              <View style={styles.postResults}>
                {filteredPosts.length === 0 ? (
                  <Text style={[styles.emptyResultText, { color: colors.mutedForeground }]}>No matching posts just yet.</Text>
                ) : (
                  filteredPosts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      isLiked={likedPostIds.includes(post._id)}
                      onToggleLike={handleToggleLike}
                      onPressMore={handleMoreOptions}
                      onReply={handleOpenPost}
                      onPressPost={handleOpenPost}
                      onPressAuthor={handleOpenProfile}
                    />
                  ))
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  scrollContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.xxl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.large,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
  },
  clearButton: {
    paddingHorizontal: spacing.xs,
  },
  submitButton: {
    paddingHorizontal: spacing.xs,
  },
  emptyState: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
  },
  chipLabel: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceMono_700Bold',
  },
  resultsContainer: {
    marginTop: spacing.xl,
    gap: spacing.lg,
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
  userResults: {
    gap: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.large,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  displayName: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.lg,
  },
  username: {
    fontSize: fontSize.sm,
  },
  bio: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  followButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
  },
  followLabel: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.sm,
  },
  postResults: {
    gap: spacing.lg,
  },
  emptyResultText: {
    fontSize: fontSize.md,
  },
});
