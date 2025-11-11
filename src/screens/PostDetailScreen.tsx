import React, { useCallback, useMemo, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	FlatList,
	Alert,
	Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { spacing, fontSize, borderRadius } from '../constants/spacing';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSettingsStore } from '../store/settingsStore';
import PostCard from '../components/PostCard';
import PostOptionsModal from '../components/PostOptionsModal';
import { Comment } from '../types/post';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { usePostInteractions } from '../hooks/usePostInteractions';

export default function PostDetailScreen() {
	const colors = useThemeColors();
	const route = useRoute<RouteProp<{ PostDetail: { postId: string } }, 'PostDetail'>>();
	const navigation = useNavigation<any>();
	const { postId } = route.params;

	const post = useSettingsStore(
		useCallback((state) => state.posts.find((item) => item._id === postId) ?? null, [postId])
	);
	const likedPostIds = useSettingsStore((state) => state.likedPostIds);
	const displayName = useSettingsStore((state) => state.displayName);
	const username = useSettingsStore((state) => state.username);
	const avatarUrl = useSettingsStore((state) => state.avatarUrl);
	const currentUserId = useSettingsStore((state) => state.currentUserId);
	const deletePostMutation = useMutation(api.posts.deletePost);
	const addCommentMutation = useMutation(api.posts.addComment);
  const { toggleLike: toggleLikeOnServer, hidePost: hidePostOnServer } = usePostInteractions();

	const [commentText, setCommentText] = useState('');
	const [optionsVisible, setOptionsVisible] = useState(false);

	const comments = useMemo(() => {
		if (!post?.comments) {
			return [] as Comment[];
		}
		return [...post.comments].sort((a, b) => a.timestamp - b.timestamp);
	}, [post?.comments]);

	const handleOpenOptions = useCallback(() => {
		setOptionsVisible(true);
	}, []);

	const handleCloseOptions = useCallback(() => {
		setOptionsVisible(false);
	}, []);

	const handleHidePost = useCallback(() => {
		if (!post) {
			return;
		}

		hidePostOnServer(post._id, post.authorId)
			.then(() => {
				navigation.goBack();
			})
			.catch((error) => {
				Alert.alert('Unable to hide', error instanceof Error ? error.message : 'Please try again.');
			});
	}, [hidePostOnServer, navigation, post]);

	const handleDeletePost = useCallback(() => {
		if (!post) {
			return;
		}

		Alert.alert('Delete this frame?', 'This will remove the frame for everyone and cannot be undone.', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					try {
						await deletePostMutation({ id: post._id as Id<'posts'>, requesterId: currentUserId });
						setOptionsVisible(false);
						navigation.goBack();
					} catch (error) {
						Alert.alert(
							'Unable to delete',
							error instanceof Error ? error.message : 'Please try again.'
						);
					}
				},
			},
		]);
	}, [currentUserId, deletePostMutation, navigation, post]);

	const handleToggleLike = useCallback(
		(postIdValue: string) => {
			toggleLikeOnServer(postIdValue).catch((error) => {
				Alert.alert('Unable to update like', error instanceof Error ? error.message : 'Please try again.');
			});
		},
		[toggleLikeOnServer]
	);

	const handleSubmitComment = useCallback(() => {
		if (!post) {
			return;
		}

		const value = commentText.trim();
		if (!value) {
			Alert.alert('Add a comment', 'Share a thought before submitting.');
			return;
		}

		const authorId = currentUserId || 'unknown-user';
		const authorName = displayName || 'Framez user';
		const authorUsername = username || 'framezer';
		const authorAvatar = avatarUrl;

		addCommentMutation({
			postId: post._id as Id<'posts'>,
			authorId,
			authorName,
			content: value,
			authorUsername,
			authorAvatar,
		})
			.then(() => {
				setCommentText('');
			})
			.catch((error) => {
				Alert.alert('Unable to comment', error instanceof Error ? error.message : 'Please try again.');
			});
	}, [addCommentMutation, avatarUrl, commentText, currentUserId, displayName, post, username]);

	const handleOpenProfile = useCallback(
		(userId: string) => {
			navigation.navigate('UserProfile', { userId });
		},
		[navigation]
	);

	if (!post) {
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
				<View style={styles.emptyState}>
					<Ionicons name="alert-circle" size={32} color={colors.mutedForeground} />
					<Text style={[styles.emptyTitle, { color: colors.foreground }]}>This frame is unavailable</Text>
					<Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>It may have been removed or hidden.</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
			>
				<FlatList
					data={comments}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContent}
					ListHeaderComponent={
						<View style={styles.headerSpacing}>
							<PostCard
								post={post}
								isLiked={likedPostIds.includes(post._id)}
								onToggleLike={handleToggleLike}
								onPressMore={handleOpenOptions}
								onPressAuthor={handleOpenProfile}
							/>
							<Text style={[styles.commentsTitle, { color: colors.foreground }]}>Comments</Text>
						</View>
					}
					renderItem={({ item }) => (
						<View style={[styles.commentCard, { borderColor: colors.border }]}>
							<View style={styles.commentHeader}>
								<Pressable
									onPress={() => handleOpenProfile(item.authorId)}
									accessibilityRole="button"
									style={styles.commentAvatarButton}
								>
									<Image
										source={{
											uri:
												item.authorAvatar ||
												'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=128&h=128&q=80',
										}}
										style={[styles.commentAvatar, { borderColor: colors.border }]}
									/>
								</Pressable>
								<View style={styles.commentAuthor}>
									<Text style={[styles.commentName, { color: colors.foreground }]}>{item.authorName}</Text>
									<Text style={[styles.commentMeta, { color: colors.mutedForeground }]}>@{item.authorUsername ?? 'framezer'}</Text>
								</View>
							</View>
							<Text style={[styles.commentBody, { color: colors.foreground }]}>{item.content}</Text>
						</View>
					)}
					ListFooterComponent={<View style={{ height: spacing.lg }} />}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Text style={[styles.emptyTitle, { color: colors.foreground }]}>No comments yet</Text>
							<Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Be the first to react to this frame.</Text>
						</View>
					}
				/>

				<View style={[styles.commentInputBar, { borderTopColor: colors.border, backgroundColor: colors.card }]}> 
					<TextInput
						value={commentText}
						onChangeText={setCommentText}
						placeholder="Add a comment"
						placeholderTextColor={colors.mutedForeground}
						style={[styles.commentInput, { color: colors.foreground }]}
						multiline
					/>
					<Pressable
						style={[styles.sendButton, { backgroundColor: colors.primary }]}
						onPress={handleSubmitComment}
						accessibilityRole="button"
						accessibilityLabel="Submit comment"
					>
						<Ionicons name="send" size={18} color={colors.primaryForeground} />
					</Pressable>
				</View>
			</KeyboardAvoidingView>

			<PostOptionsModal
				visible={optionsVisible}
				onClose={handleCloseOptions}
				onHide={post.authorId !== currentUserId ? handleHidePost : undefined}
				onDelete={post.authorId === currentUserId ? handleDeletePost : undefined}
				canHide={post.authorId !== currentUserId}
				canDelete={post.authorId === currentUserId}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	flex: {
		flex: 1,
	},
	listContent: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.xl,
		paddingTop: spacing.lg,
	},
	headerSpacing: {
		paddingBottom: spacing.lg,
		gap: spacing.md,
	},
	commentsTitle: {
		fontFamily: 'SpaceMono_700Bold',
		fontSize: fontSize.lg,
	},
	commentCard: {
		borderWidth: 1,
		borderRadius: borderRadius.medium,
		padding: spacing.md,
		marginBottom: spacing.md,
		gap: spacing.sm,
	},
	commentHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
	},
	commentAvatarButton: {
		borderRadius: borderRadius.full,
	},
	commentAuthor: {
		flex: 1,
		gap: spacing.xs / 2,
	},
	commentAvatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		borderWidth: 1,
	},
	commentName: {
		fontFamily: 'SpaceMono_700Bold',
		fontSize: fontSize.md,
	},
	commentMeta: {
		fontSize: fontSize.sm,
	},
	commentBody: {
		fontSize: fontSize.md,
		lineHeight: 20,
	},
	commentInputBar: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		borderTopWidth: 1,
		paddingHorizontal: spacing.md,
		paddingTop: spacing.sm,
		paddingBottom: spacing.md,
		gap: spacing.sm,
	},
	commentInput: {
		flex: 1,
		maxHeight: 120,
		fontSize: fontSize.md,
	},
	sendButton: {
		width: 40,
		height: 40,
		borderRadius: borderRadius.full,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyState: {
		paddingVertical: spacing.xl,
		alignItems: 'center',
		gap: spacing.sm,
		paddingHorizontal: spacing.lg,
	},
	emptyTitle: {
		fontFamily: 'SpaceMono_700Bold',
		fontSize: fontSize.lg,
		textAlign: 'center',
	},
	emptySubtitle: {
		fontSize: fontSize.md,
		textAlign: 'center',
		lineHeight: 20,
	},
});
