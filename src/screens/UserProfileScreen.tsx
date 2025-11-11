import React, { useCallback, useMemo, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	FlatList,
	Alert,
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
import { Post } from '../types/post';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { usePostInteractions } from '../hooks/usePostInteractions';

export default function UserProfileScreen() {
	const colors = useThemeColors();
	const route = useRoute<RouteProp<{ UserProfile: { userId: string } }, 'UserProfile'>>();
	const navigation = useNavigation<any>();
	const { userId } = route.params;

	const currentUserId = useSettingsStore((state) => state.currentUserId);
	const people = useSettingsStore((state) => state.people);
	const posts = useSettingsStore((state) => state.posts);
	const likedPostIds = useSettingsStore((state) => state.likedPostIds);
	const deletePostMutation = useMutation(api.posts.deletePost);
  const { toggleLike: toggleLikeOnServer, hidePost: hidePostOnServer } = usePostInteractions();

	const [optionsVisible, setOptionsVisible] = useState(false);
	const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

	const person = useMemo(() => people.find((entry) => entry._id === userId) ?? null, [people, userId]);

	const userPosts = useMemo(
		() => posts.filter((post) => post.authorId === userId),
		[posts, userId]
	);

		const selectedPost = useMemo(
			() => (selectedPostId ? posts.find((post) => post._id === selectedPostId) ?? null : null),
			[posts, selectedPostId]
		);

	const handleMoreOptions = useCallback((postId: string) => {
		setOptionsVisible(true);
		setSelectedPostId(postId);
	}, []);

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
						} catch (error) {
							Alert.alert(
								'Unable to delete',
								error instanceof Error ? error.message : 'Please try again.'
							);
						} finally {
							setOptionsVisible(false);
							setSelectedPostId(null);
						}
					},
				},
			]);
		},
		[currentUserId, deletePostMutation]
	);

		const handleHideSelected = useCallback(() => {
			if (!selectedPostId || !selectedPost) {
				return;
			}

			handleCloseOptions();
			hidePostOnServer(selectedPostId, selectedPost.authorId).catch((error) => {
				Alert.alert('Unable to hide', error instanceof Error ? error.message : 'Please try again.');
			});
		}, [handleCloseOptions, hidePostOnServer, selectedPost, selectedPostId]);

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
			(nextUserId: string) => {
				if (nextUserId === userId) {
					return;
				}
				navigation.push('UserProfile', { userId: nextUserId });
			},
			[navigation, userId]
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

	if (!person) {
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
				<View style={styles.emptyState}>
					<Ionicons name="alert-circle" size={32} color={colors.mutedForeground} />
					<Text style={[styles.emptyTitle, { color: colors.foreground }]}>Profile not found</Text>
					<Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>This creator may have left Framez.</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
			<FlatList
				data={userPosts}
				keyExtractor={(item) => item._id}
				renderItem={renderItem}
				ListHeaderComponent={
					<View style={styles.headerSection}>
						<View style={styles.profileRow}>
							<Image
								source={{
									uri:
										person.avatarUrl ||
										'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=256&h=256&q=80',
								}}
								style={[styles.avatar, { borderColor: colors.border }]}
							/>
							<View style={styles.profileDetails}>
								<Text style={[styles.displayName, { color: colors.foreground }]}>{person.displayName}</Text>
								<Text style={[styles.username, { color: colors.mutedForeground }]}>@{person.username}</Text>
								{person.bio ? (
									<Text style={[styles.bio, { color: colors.foreground }]}>{person.bio}</Text>
								) : null}
							</View>
						</View>

						<View style={[styles.statsRow, { borderColor: colors.border }]}> 
							<View style={styles.statBlock}>
								<Text style={[styles.statValue, { color: colors.foreground }]}>{userPosts.length}</Text>
								<Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
							</View>
							<View style={styles.statBlock}>
								<Text style={[styles.statValue, { color: colors.foreground }]}>{person.followersCount ?? 0}</Text>
								<Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
							</View>
							<View style={styles.statBlock}>
								<Text style={[styles.statValue, { color: colors.foreground }]}>{person.followingCount ?? 0}</Text>
								<Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Following</Text>
							</View>
						</View>
					</View>
				}
				ListFooterComponent={<View style={{ height: spacing.xxl }} />}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nothing yet</Text>
						<Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>This creator is warming up their first frame.</Text>
					</View>
				}
			/>

			<PostOptionsModal
				visible={optionsVisible}
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
		paddingTop: spacing.lg,
		gap: spacing.lg,
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
