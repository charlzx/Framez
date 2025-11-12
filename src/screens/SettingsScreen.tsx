import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSettingsStore } from '../store/settingsStore';
import { spacing, fontSize, borderRadius } from '../constants/spacing';
import { clearImageCache, getCacheSize, formatBytes } from '../utils/imageCache';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);
  const { signOut, isLoaded } = useAuth();
  const expoConfig = Constants.expoConfig ?? (Constants as any).manifest;
  const appVersion: string = (expoConfig?.version as string | undefined) ?? '0.0.0';
  const versionLabel = `v${appVersion}`;
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  useEffect(() => {
    loadCacheSize();
  }, []);

  const loadCacheSize = async () => {
    setIsLoadingCache(true);
    try {
      const size = await getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.error('Failed to load cache size:', error);
    } finally {
      setIsLoadingCache(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Image Cache',
      'This will remove all cached images. They will be re-downloaded when needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearImageCache();
              Alert.alert('Success', 'Image cache cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear image cache. Please try again.');
              console.error('Failed to clear cache:', error);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    if (!isLoaded) {
      Alert.alert('Please wait', 'We are still finalizing your session.');
      return;
    }

    Alert.alert('Log out of Framez?', 'You will need to sign in again to access your frames.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          signOut().catch(() =>
            Alert.alert('Unable to log out', 'Please try again in a moment.')
          );
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.header, { color: colors.foreground }]}>Settings</Text>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Appearance</Text>
          <View style={styles.row}>
            <Ionicons name="moon" size={20} color={colors.foreground} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Dark theme</Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>Switch between light and dark mode.</Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={() => toggleTheme()}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={themeMode === 'dark' ? colors.primaryForeground : colors.card}
            />
          </View>
        </View>

        {/* <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Storage</Text>
          <Pressable 
            style={styles.row}
            onPress={handleClearCache}
            disabled={isLoadingCache}
          >
            <Ionicons name="trash-outline" size={20} color={colors.foreground} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Clear image cache</Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                {isLoadingCache ? 'Loading...' : 'Remove cached images to free up space'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View> */}

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About Framez</Text>
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={20} color={colors.foreground} />
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>App version</Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{versionLabel}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
          <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Log out of Framez on this device.</Text>
          <Pressable
            style={[styles.logoutButton, { backgroundColor: colors.destructive }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutLabel, { color: colors.destructiveForeground }]}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.xxl,
    marginTop: spacing.lg,
  },
  section: {
    borderWidth: 1,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowContent: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
  },
  rowSubtitle: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  helperText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  logoutButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
  },
  logoutLabel: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: fontSize.md,
  },
});
