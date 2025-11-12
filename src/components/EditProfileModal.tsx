import React, { useEffect, useState, useCallback } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize, borderRadius } from '../constants/spacing';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { optimizeImage, validateImage, generateThumbnail } from '../utils/imageOptimization';

type EditProfileModalProps = {
  visible: boolean;
  onClose: () => void;
  initialDisplayName: string;
  initialUsername: string;
  initialDescription: string;
  initialAvatarUrl: string;
  currentClerkId: string;
  onSave: (payload: {
    displayName: string;
    description: string;
    avatarStorageId?: Id<"_storage">;
    username: string;
  }) => Promise<{ success: boolean; message?: string }>;
};

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  initialDisplayName,
  initialUsername,
  initialDescription,
  initialAvatarUrl,
  currentClerkId,
  onSave,
}) => {
  const colors = useThemeColors();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [description, setDescription] = useState(initialDescription);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'error'>('idle');
  const [isUploading, setIsUploading] = useState(false);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [debouncedUsername, setDebouncedUsername] = useState(initialUsername);
  
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  // Check username availability with debouncing
  const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hasUsernameChanged = normalizedUsername !== initialUsername.toLowerCase();
  
  const usernameAvailability = useQuery(
    api.users.isUsernameAvailable,
    hasUsernameChanged && normalizedUsername.length >= 3
      ? { username: normalizedUsername, currentClerkId }
      : 'skip'
  );

  // Update debounced username after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  // Update username validation status based on query result
  useEffect(() => {
    if (!hasUsernameChanged || normalizedUsername.length < 3) {
      setUsernameStatus('idle');
      setUsernameMessage(null);
      return;
    }

    if (usernameAvailability === undefined) {
      setUsernameStatus('checking');
      setUsernameMessage('Checking availability...');
      return;
    }

    if (usernameAvailability.available) {
      setUsernameStatus('available');
      setUsernameMessage('✓ Username is available');
    } else {
      setUsernameStatus('error');
      setUsernameMessage(usernameAvailability.message || 'Username is not available');
    }
  }, [usernameAvailability, hasUsernameChanged, normalizedUsername]);

  const normalize = (value: string) => value.trim().toLowerCase();

  useEffect(() => {
    if (visible) {
      setDisplayName(initialDisplayName);
      setUsername(initialUsername);
      setDescription(initialDescription);
      setAvatarUrl(initialAvatarUrl);
      setNewAvatarUri(null);
      setUsernameMessage(null);
      setUsernameStatus('idle');
      setIsUploading(false);
    }
  }, [initialAvatarUrl, initialDescription, initialDisplayName, initialUsername, visible]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameMessage(null);
    setUsernameStatus('idle');
  };

  // Handle picking an image from the device
  const handlePickImage = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile image.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1, // Get full quality, we'll optimize it ourselves
      });

      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;

        // Validate image
        const validation = await validateImage(selectedUri);
        if (!validation.isValid) {
          Alert.alert('Invalid Image', validation.error || 'Please select a valid image.');
          return;
        }

        // Show loading indicator
        setIsOptimizingImage(true);

        try {
          // Optimize avatar (smaller size for profiles)
          const optimized = await optimizeImage(selectedUri, {
            maxWidth: 512,
            maxHeight: 512,
            quality: 0.85,
            format: 'jpeg',
          });

          setNewAvatarUri(optimized.uri);

          // Log optimization stats
          if (optimized.compressionRatio && optimized.compressionRatio > 10) {
            console.log(
              `✅ Avatar optimized by ${optimized.compressionRatio.toFixed(1)}%`,
              `(${optimized.originalSize}KB → ${optimized.optimizedSize}KB)`
            );
          }
        } catch (error) {
          Alert.alert('Optimization Failed', 'Failed to optimize image. Please try another image.');
          console.error(error);
        } finally {
          setIsOptimizingImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setIsOptimizingImage(false);
    }
  };

  const handleSave = async () => {
    // Block save if username validation is in progress or failed
    if (usernameStatus === 'checking') {
      Alert.alert('Please wait', 'Still checking username availability...');
      return;
    }

    if (usernameStatus === 'error') {
      Alert.alert('Invalid Username', usernameMessage || 'Please choose a different username.');
      return;
    }

    setIsUploading(true);
    try {
      const trimmedDisplayName = displayName.trim() || initialDisplayName;
      const trimmedDescription = description.trim();
      const sanitizedUsername = normalizedUsername || initialUsername;

      // Upload new avatar if selected
      let avatarStorageId: Id<"_storage"> | undefined;
      if (newAvatarUri) {
        try {
          const uploadUrl = await generateUploadUrl();
          const response = await fetch(newAvatarUri);
          const blob = await response.blob();
          
          const uploadResult = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': blob.type },
            body: blob,
          });

          if (!uploadResult.ok) {
            throw new Error('Failed to upload image');
          }

          const { storageId } = await uploadResult.json();
          avatarStorageId = storageId;
        } catch (error) {
          console.error('Error uploading avatar:', error);
          Alert.alert('Upload Error', 'Failed to upload profile image. Please try again.');
          setIsUploading(false);
          return;
        }
      }

      const result = await onSave({
        displayName: trimmedDisplayName,
        description: trimmedDescription,
        avatarStorageId,
        username: sanitizedUsername,
      });

      if (!result.success) {
        if (result.message) {
          Alert.alert('Unable to update profile', result.message);
        }
        setIsUploading(false);
        return;
      }

      setUsernameMessage(null);
      setUsernameStatus('idle');
      setIsUploading(false);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      setIsUploading(false);
    }
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
                maxLength={30}
              />
              {usernameMessage ? (
                <Text
                  style={[
                    styles.statusMessage,
                    {
                      color:
                        usernameStatus === 'error'
                          ? colors.destructive
                          : usernameStatus === 'available'
                          ? colors.success
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
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Profile Image</Text>
              {isOptimizingImage ? (
                <View style={styles.avatarOptimizing}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.optimizingText, { color: colors.mutedForeground }]}>
                    Optimizing...
                  </Text>
                </View>
              ) : (newAvatarUri || avatarUrl) ? (
                <Image
                  source={{ uri: newAvatarUri || avatarUrl }}
                  style={styles.avatarPreview}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : null}
              <Pressable
                style={[styles.imagePicker, { backgroundColor: colors.secondary }]}
                onPress={handlePickImage}
                disabled={isOptimizingImage}
              >
                <Text style={[styles.imagePickerText, { color: colors.secondaryForeground }]}>
                  {newAvatarUri || avatarUrl ? 'Change Image' : 'Upload Image'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={onClose}
              disabled={isUploading}
            >
              <Text style={[styles.actionLabel, { color: colors.secondaryForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.actionLabel, { color: colors.primaryForeground }]}>Save</Text>
              )}
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
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  avatarOptimizing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  optimizingText: {
    fontSize: fontSize.xs,
    fontFamily: 'SpaceMono_700Bold',
    marginTop: spacing.xs,
  },
  imagePicker: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceMono_700Bold',
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
