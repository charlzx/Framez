import React from 'react';
import { Modal, View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize } from '../constants/spacing';
import { useThemeColors } from '../hooks/useThemeColors';

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onHide?: () => void;
  onDelete?: () => void;
  canHide: boolean;
  canDelete: boolean;
}

const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
  visible,
  onClose,
  onHide,
  onDelete,
  canHide,
  canDelete,
}) => {
  const colors = useThemeColors();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close post options"
        />
        <View style={[styles.sheetContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Frame options</Text>
          {canHide && onHide ? (
            <Pressable
              style={styles.optionRow}
              accessibilityRole="button"
              onPress={() => {
                onClose();
                // Small delay to let modal close before action
                setTimeout(() => {
                  onHide();
                }, 100);
              }}
            >
              <Ionicons name="eye-off-outline" size={20} color={colors.mutedForeground} />
              <View style={styles.optionLabelWrapper}>
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>Hide this frame</Text>
                <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>See fewer updates like this</Text>
              </View>
            </Pressable>
          ) : null}
          {canDelete && onDelete ? (
            <Pressable
              style={styles.optionRow}
              accessibilityRole="button"
              onPress={() => {
                onClose();
                // Small delay to let modal close before showing alert
                setTimeout(() => {
                  onDelete();
                }, 100);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              <View style={styles.optionLabelWrapper}>
                <Text style={[styles.optionLabel, { color: colors.destructive }]}>Delete frame</Text>
                <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>Remove this frame for everyone</Text>
              </View>
            </Pressable>
          ) : null}
          <Pressable style={styles.cancelRow} accessibilityRole="button" onPress={onClose}>
            <Text style={[styles.cancelLabel, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheetContainer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  sheetTitle: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceMono_700Bold',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionLabelWrapper: {
    flex: 1,
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceMono_700Bold',
  },
  optionDescription: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  cancelRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  cancelLabel: {
    fontSize: fontSize.md,
    fontFamily: 'SpaceMono_700Bold',
  },
});

export default PostOptionsModal;
