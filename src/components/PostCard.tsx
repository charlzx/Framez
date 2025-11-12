import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  GestureResponderEvent,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types/post';
import { spacing, fontSize, borderRadius } from '../constants/spacing';
import { formatDate } from '../utils/formatDate';
import { useThemeColors } from '../hooks/useThemeColors';

type PostCardProps = {
  post: Post;
  isLiked: boolean;
  onToggleLike: (postId: string) => void;
  onReply?: (postId: string) => void;
  onPressMore?: (postId: string) => void;
  onPressPost?: (postId: string) => void;
  onPressAuthor?: (authorId: string) => void;
};

const AVATAR_PLACEHOLDER =
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=256&h=256&q=80';

const PostCardComponent: React.FC<PostCardProps> = ({
  post,
  isLiked,
  onToggleLike,
  onReply,
  onPressMore,
  onPressPost,
  onPressAuthor,
}) => {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const cardMaxWidth = Math.min(width - spacing.lg * 2, 720);
  const commentCount = post.comments?.length ?? post.replyCount ?? 0;
  const [isImageLoading, setImageLoading] = useState(false);

  const primaryImage = post.media?.find((item) => item.type === 'image');
  const postImageUri = primaryImage?.url ?? post.imageUrl;
  const postImageAlt = primaryImage?.alt ?? 'Post media';

  const handlePressPost = () => {
    if (onPressPost) {
      onPressPost(post._id);
    }
  };

  const stopPropagation = (event: GestureResponderEvent) => {
    if (typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
  };

  const handlePressAuthor = (event: GestureResponderEvent) => {
    stopPropagation(event);
    onPressAuthor?.(post.authorId);
  };

  const handlePressMore = (event: GestureResponderEvent) => {
    stopPropagation(event);
    onPressMore?.(post._id);
  };

  const handleReplyPress = (event: GestureResponderEvent) => {
    stopPropagation(event);
    onReply?.(post._id);
  };

  const handleToggleLikePress = (event: GestureResponderEvent) => {
    stopPropagation(event);
    onToggleLike(post._id);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          maxWidth: cardMaxWidth,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={handlePressAuthor}
          accessibilityRole="button"
          accessibilityLabel={`View ${post.authorName}'s profile`}
        >
          <Image
            source={{ uri: post.authorAvatar || AVATAR_PLACEHOLDER }}
            style={[styles.avatar, { borderColor: colors.border }]}
            cachePolicy="memory-disk"
            transition={150}
            contentFit="cover"
          />
        </Pressable>
        <View style={styles.titleWrapper}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: colors.foreground }]} numberOfLines={1}>
              {post.authorName}
            </Text>
            <Text style={[styles.username, { color: colors.mutedForeground }]} numberOfLines={1}>
              @{post.authorUsername ?? 'framezer'}
            </Text>
            <View style={styles.bullet}>
              <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>•</Text>
            </View>
            <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
              {formatDate(post.timestamp)}
            </Text>
          </View>
          {post.frameCount && post.frameCount > 1 ? (
            <View
              style={[styles.frameBadge, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="layers-outline" size={14} color={colors.secondaryForeground} />
              <Text
                style={[styles.frameCountText, { color: colors.secondaryForeground }]}
              >
                {post.frameCount} frames
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More options"
          style={styles.moreButton}
          onPress={handlePressMore}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <Pressable
        onPress={handlePressPost}
        disabled={!onPressPost}
        style={({ pressed }) => ({
          opacity: onPressPost && pressed ? 0.97 : 1,
        })}
      >
        <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>

        {post.frames && post.frames.length > 0 ? (
          <View
            style={[
              styles.frameContainer,
              { borderColor: colors.border, backgroundColor: colors.secondary },
            ]}
          >
            {post.frames.map((entry, index) => (
              <View key={`${post._id}-frame-${index}`} style={styles.frameItem}>
                <Text style={[styles.frameIndex, { color: colors.secondaryForeground }]}>{index + 1}.</Text>
                <Text style={[styles.frameText, { color: colors.secondaryForeground }]}>{entry}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {postImageUri ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: postImageUri }}
              accessibilityLabel={postImageAlt}
              style={[styles.mediaImage, { borderColor: colors.border }]}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={post._id}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {isImageLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </View>
        ) : null}
      </Pressable>

      <View style={styles.footerRow}>
        <Pressable
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Reply"
          onPress={handleReplyPress}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{commentCount}</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
          onPress={handleToggleLikePress}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={isLiked ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.actionText,
              { color: isLiked ? colors.primary : colors.mutedForeground },
            ]}
          >
            {post.likeCount ?? 0}
          </Text>
        </Pressable>

        <View style={styles.spacer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.large,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.md,
    borderWidth: 1,
  },
  titleWrapper: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  displayName: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.lg,
    marginRight: spacing.xs,
  },
  username: {
    fontSize: fontSize.sm,
  },
  bullet: {
    marginHorizontal: spacing.xs / 2,
  },
  timestamp: {
    fontSize: fontSize.sm,
  },
  frameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.medium,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  frameCountText: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceMono_700Bold',
  },
  moreButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  content: {
    fontSize: fontSize.lg,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  frameContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  frameItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  frameIndex: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.sm,
    marginTop: 1,
  },
  frameText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  imageContainer: {
    position: 'relative',
    marginTop: spacing.md,
  },
  mediaImage: {
    borderRadius: borderRadius.large,
    borderWidth: 1,
    width: '100%',
    aspectRatio: 1.6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.large,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: fontSize.sm,
  },
  spacer: {
    flex: 1,
  },
});

const PostCard = memo(PostCardComponent);
export default PostCard;
