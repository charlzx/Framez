import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSettingsStore } from '../store/settingsStore';
import { spacing, fontSize, borderRadius } from '../constants/spacing';
import type { HomeStackParamList } from '../navigation/HomeStack';

export default function CreatePostScreen() {
  const colors = useThemeColors();
  const posts = useSettingsStore((state) => state.posts);
  const displayName = useSettingsStore((state) => state.displayName);
  const username = useSettingsStore((state) => state.username);
  const avatarUrl = useSettingsStore((state) => state.avatarUrl);
  const fallbackUserId = useSettingsStore((state) => state.currentUserId);
  const { user } = useUser();
  const createPostMutation = useMutation(api.posts.create);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const [content, setContent] = useState('');
  const [frameInputs, setFrameInputs] = useState<string[]>(['']);
  const [isSubmitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const canPublish = useMemo(
    () => content.trim().length > 0 || Boolean(selectedImage),
    [content, selectedImage],
  );

  const handleAddFrameStep = () => {
    setFrameInputs((prev) => [...prev, '']);
  };

  const handleUpdateFrameStep = (index: number, value: string) => {
    setFrameInputs((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow access to your photos to attach an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedImage(result.assets[0]?.uri ?? null);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handlePublish = async () => {
    if (!canPublish) {
      Alert.alert('Add more details', 'Share a thought or attach an image before publishing.');
      return;
    }

    const frames = frameInputs
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const authorId = user?.id ?? fallbackUserId;
    if (!authorId) {
      Alert.alert('Missing profile', 'We could not determine who is posting. Please sign in again.');
      return;
    }

    const authorName = user?.fullName?.trim() || displayName || 'Framez user';
    const authorUsername = user?.username || username || 'framezer';
    const authorAvatar = user?.imageUrl || avatarUrl;

    try {
      setSubmitting(true);
      let uploadedImageId: Id<'_storage'> | undefined;

      if (selectedImage) {
        const uploadUrl = await generateUploadUrl();
        const imageResponse = await fetch(selectedImage);
        const blob = await imageResponse.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': blob.type || 'application/octet-stream',
          },
          body: blob,
        });

        if (!uploadResponse.ok) {
          throw new Error('Unable to upload image. Please try again.');
        }

        const { storageId } = (await uploadResponse.json()) as { storageId: Id<'_storage'> };
        uploadedImageId = storageId;
      }

      await createPostMutation({
        authorId,
        authorName,
        authorUsername,
        authorAvatar,
        content: content.trim(),
        frames,
        imageStorageId: uploadedImageId,
        likeCount: 0,
        replyCount: 0,
        comments: [],
      });
      setContent('');
      setFrameInputs(['']);
      setSelectedImage(null);
      navigation.navigate('HomeFeed');
    } catch (error) {
      Alert.alert('Unable to publish', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>New frame</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>What is happening?</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Share something engaging..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.contentInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Frame steps</Text>
            <Pressable
              style={[styles.iconButton, { backgroundColor: colors.secondary }]}
              onPress={handleAddFrameStep}
            >
              <Ionicons name="add" size={18} color={colors.secondaryForeground} />
              <Text style={[styles.iconButtonLabel, { color: colors.secondaryForeground }]}>Add frame</Text>
            </Pressable>
          </View>
          {frameInputs.map((value, index) => (
            <View key={`frame-${index}`} style={styles.frameItem}>
              <Text style={[styles.frameIndex, { color: colors.mutedForeground }]}>{index + 1}.</Text>
              <TextInput
                value={value}
                onChangeText={(text) => handleUpdateFrameStep(index, text)}
                placeholder="Optional supporting detail"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.frameInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Image</Text>
          {selectedImage ? (
            <View
              style={[styles.imagePreviewContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <Pressable
                style={[styles.removeImageButton, { borderColor: colors.border }]}
                onPress={handleRemoveImage}
                disabled={isSubmitting}
              >
                <Ionicons name="close" size={16} color={colors.mutedForeground} />
                <Text style={[styles.removeImageLabel, { color: colors.mutedForeground }]}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.imagePickerButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={handlePickImage}
              disabled={isSubmitting}
            >
              <Ionicons name="image-outline" size={20} color={colors.mutedForeground} />
              <Text style={[styles.imagePickerLabel, { color: colors.mutedForeground }]}>Pick from library</Text>
            </Pressable>
          )}
          <Text style={[styles.mediaHintText, { color: colors.mutedForeground }]}>JPEG or PNG up to 5 MB.</Text>
        </View>
      </ScrollView>
      <View style={[styles.toolbar, { borderTopColor: colors.border, backgroundColor: colors.card }]}
      >
        <View style={styles.metaInfo}>
          <Ionicons name="layers-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{posts.length} frames in your feed</Text>
        </View>
        <Pressable
          style={[
            styles.publishButton,
            { backgroundColor: canPublish && !isSubmitting ? colors.primary : colors.border },
          ]}
          onPress={handlePublish}
          disabled={!canPublish || isSubmitting}
        >
          <Text
            style={[
              styles.publishLabel,
              { color: canPublish && !isSubmitting ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            {isSubmitting ? 'Publishing…' : 'Publish'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  title: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.xxl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
  },
  input: {
    borderRadius: borderRadius.large,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
  },
  contentInput: {
    minHeight: 120,
    lineHeight: 22,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
  },
  iconButtonLabel: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.sm,
  },
  frameItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  frameIndex: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
    marginTop: spacing.sm,
  },
  frameInput: {
    flex: 1,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
  },
  mediaHintText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.md,
  },
  imagePickerLabel: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceMono_700Bold',
  },
  imagePreviewContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 240,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    borderTopWidth: 1,
  },
  removeImageLabel: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaLabel: {
    fontSize: fontSize.sm,
  },
  publishButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
  },
  publishLabel: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
  },
});
