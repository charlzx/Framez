import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize, borderRadius } from '../constants/spacing';

type EditProfileModalProps = {
  visible: boolean;
  onClose: () => void;
  initialDisplayName: string;
  initialUsername: string;
  initialDescription: string;
  initialAvatarUrl: string;
  onSave: (payload: { displayName: string; description: string; avatarUrl: string }) => void;
  onAttemptUsernameChange: (value: string) => { success: boolean; message?: string };
};

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  initialDisplayName,
  initialUsername,
  initialDescription,
  initialAvatarUrl,
  onSave,
  onAttemptUsernameChange,
}) => {
  const colors = useThemeColors();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [description, setDescription] = useState(initialDescription);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'error'>('idle');

  const normalize = (value: string) => value.trim().toLowerCase();

  useEffect(() => {
    if (visible) {
      setDisplayName(initialDisplayName);
      setUsername(initialUsername);
      setDescription(initialDescription);
      setAvatarUrl(initialAvatarUrl);
      setUsernameMessage(null);
      setUsernameStatus('idle');
    }
  }, [initialAvatarUrl, initialDescription, initialDisplayName, initialUsername, visible]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameMessage(null);
    setUsernameStatus('idle');
  };

  const handleSave = () => {
    const trimmedDisplayName = displayName.trim() || initialDisplayName;
    const trimmedDescription = description.trim();
    const trimmedAvatarUrl = avatarUrl.trim() || initialAvatarUrl;
    const normalizedInitial = normalize(initialUsername);
    const sanitizedUsername = normalize(username);
    const hasUsernameChanged = sanitizedUsername !== normalizedInitial;

    if (hasUsernameChanged) {
      const result = onAttemptUsernameChange(sanitizedUsername);
      if (!result.success) {
        setUsernameStatus('error');
        setUsernameMessage(result.message ?? 'Unable to update username.');
        return;
      }
    }

    setUsername(sanitizedUsername);

    onSave({
      displayName: trimmedDisplayName,
      description: trimmedDescription,
      avatarUrl: trimmedAvatarUrl,
    });

    setUsernameMessage(null);
    setUsernameStatus('idle');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}> 
          <Text style={[styles.title, { color: colors.foreground }]}>Edit profile</Text>
          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Display name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How should we call you?"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground }]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Username</Text>
              <TextInput
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="Choose a username"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground }]}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
              {usernameMessage ? (
                <Text
                  style={[
                    styles.statusMessage,
                    {
                      color:
                        usernameStatus === 'error'
                          ? colors.destructive
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {usernameMessage}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Share a short bio"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, styles.multilineInput, { backgroundColor: colors.background, color: colors.foreground }]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Avatar URL</Text>
              <TextInput
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                placeholder="https://"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={onClose}
            >
              <Text style={[styles.actionLabel, { color: colors.secondaryForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.actionLabel, { color: colors.primaryForeground }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  title: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.xl,
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceMono_700Bold',
  },
  statusMessage: {
    fontSize: fontSize.sm,
    fontFamily: 'SpaceMono_700Bold',
  },
  input: {
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  multilineInput: {
    minHeight: 96,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
  },
  actionLabel: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
  },
});

export default EditProfileModal;
