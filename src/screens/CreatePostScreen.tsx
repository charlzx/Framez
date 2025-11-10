import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSettingsStore } from '../store/settingsStore';
import { spacing, fontSize, borderRadius } from '../constants/spacing';

export default function CreatePostScreen() {
  const colors = useThemeColors();
  const createPost = useSettingsStore((state) => state.createPost);
  const posts = useSettingsStore((state) => state.posts);

  const [content, setContent] = useState('');
  const [frameInputs, setFrameInputs] = useState<string[]>(['']);

  const canPublish = useMemo(() => content.trim().length > 0, [content]);

  const handleAddFrameStep = () => {
    setFrameInputs((prev) => [...prev, '']);
  };

  const handleUpdateFrameStep = (index: number, value: string) => {
    setFrameInputs((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handlePublish = () => {
    if (!canPublish) {
      Alert.alert('Add some text', 'Frames need at least a short thought.');
      return;
    }

    const frames = frameInputs
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    try {
      createPost({ content, frames });
      setContent('');
      setFrameInputs(['']);
      Alert.alert('Published', 'Your frame is live in the feed.', [
        { text: 'View frame', onPress: () => undefined },
      ]);
    } catch (error) {
      Alert.alert('Unable to publish', (error as Error).message);
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

        <View style={styles.mediaHint}>
          <Ionicons name="image-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.mediaHintText, { color: colors.mutedForeground }]}>
            Media uploads arrive soon. For now, craft crisp text frames.
          </Text>
        </View>
      </ScrollView>
      <View style={[styles.toolbar, { borderTopColor: colors.border, backgroundColor: colors.card }]}
      >
        <View style={styles.metaInfo}>
          <Ionicons name="layers-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{posts.length} frames in your feed</Text>
        </View>
        <Pressable
          style={[styles.publishButton, { backgroundColor: canPublish ? colors.primary : colors.border }]}
          onPress={handlePublish}
          disabled={!canPublish}
        >
          <Text style={[styles.publishLabel, { color: canPublish ? colors.primaryForeground : colors.mutedForeground }]}>Publish</Text>
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
  mediaHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mediaHintText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
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
