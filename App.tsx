import { useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { Text, TextInput } from 'react-native';
import { useFonts, SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';
import { useThemeColors } from './src/hooks/useThemeColors';
import { useSettingsStore } from './src/store/settingsStore';
import { PostsHydrator } from './src/providers/PostsHydrator';
import { UsersHydrator } from './src/providers/UsersHydrator';
import { CurrentUserHydrator } from './src/providers/CurrentUserHydrator';
import { PostPreferencesHydrator } from './src/providers/PostPreferencesHydrator';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL!;

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Initialize Convex client
const convex = new ConvexReactClient(CONVEX_URL);

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });
  const themeMode = useSettingsStore((state) => state.themeMode);
  const colors = useThemeColors();

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: themeMode === 'dark',
      colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.foreground,
        border: colors.border,
        notification: colors.primary,
      },
    }),
    [colors, themeMode]
  );

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    const TextWithDefaults = Text as typeof Text & { defaultProps?: any };
    const TextInputWithDefaults = TextInput as typeof TextInput & { defaultProps?: any };

    TextWithDefaults.defaultProps = TextWithDefaults.defaultProps || {};
    TextWithDefaults.defaultProps.style = {
      ...(TextWithDefaults.defaultProps.style || {}),
      fontFamily: 'SpaceMono_400Regular',
    };

    TextInputWithDefaults.defaultProps = TextInputWithDefaults.defaultProps || {};
    TextInputWithDefaults.defaultProps.style = {
      ...(TextInputWithDefaults.defaultProps.style || {}),
      fontFamily: 'SpaceMono_400Regular',
    };

    SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ConvexProvider client={convex}>
        <NavigationContainer theme={navigationTheme}>
          <SignedIn>
            <CurrentUserHydrator />
            <UsersHydrator />
            <PostsHydrator />
            <PostPreferencesHydrator />
            <AppNavigator />
          </SignedIn>
          <SignedOut>
            <AuthNavigator />
          </SignedOut>
          <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
        </NavigationContainer>
      </ConvexProvider>
    </ClerkProvider>
  );
}
