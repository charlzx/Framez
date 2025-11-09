import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { colors } from '../../constants/colors';
import { spacing, fontSize, borderRadius } from '../../constants/spacing';
import { validateEmail } from '../../utils/validation';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive: oAuthSetActive } = await startOAuthFlow();

      if (createdSessionId) {
        await oAuthSetActive!({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('OAuth error:', JSON.stringify(err, null, 2));
      Alert.alert('Sign In Error', 'Failed to sign in with Google');
    }
  };

  const handleLogin = async () => {
    if (!isLoaded) return;

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      Alert.alert('Invalid Password', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: email,
        password,
      });

      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Login failed';
      Alert.alert('Login Error', errorMessage);
      console.error('Login error:', JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.flex}>
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.wrapper}>
            <View style={styles.header}>
              <Text style={styles.logo}>Framez</Text>
              <Text style={styles.tagline}>
                Back in the frame?
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.googleButton, loading && styles.disabledButton]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleLogo}
                resizeMode="contain"
                accessible
                accessibilityLabel="Google logo"
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with email</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>

              <View style={styles.forgotRow}>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.linkText}>Create one</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
  },
  wrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  logo: {
    fontSize: fontSize.xxxl,
    color: colors.primary,
    fontFamily: 'SpaceMono_700Bold',
  },
  tagline: {
    fontSize: fontSize.lg,
    color: colors.mutedForeground,
    lineHeight: 24,
    fontFamily: 'SpaceMono_400Regular',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: fontSize.lg,
    color: colors.foreground,
    fontFamily: 'SpaceMono_700Bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    fontFamily: 'SpaceMono_700Bold',
    letterSpacing: 1.5,
  },
  form: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  forgotRow: {
    alignItems: 'flex-start',
  },
  forgotText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontFamily: 'SpaceMono_400Regular',
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontFamily: 'SpaceMono_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.foreground,
    fontFamily: 'SpaceMono_400Regular',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontSize: fontSize.lg,
    fontFamily: 'SpaceMono_700Bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: fontSize.md,
    color: colors.mutedForeground,
    fontFamily: 'SpaceMono_400Regular',
  },
  linkText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontFamily: 'SpaceMono_700Bold',
  },
});
