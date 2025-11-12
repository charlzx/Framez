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
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, fontSize, borderRadius } from '../../constants/spacing';
import {
  validateEmail,
  validatePassword,
  validateName,
  getPasswordStrength,
} from '../../utils/validation';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen({ navigation }: any) {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordStrength = getPasswordStrength(password);

  const strengthColorMap: Record<'weak' | 'medium' | 'strong', string> = {
    weak: colors.destructive,
    medium: colors.warning,
    strong: colors.success,
  };

  const strengthWidthMap: Record<'weak' | 'medium' | 'strong', `${number}%`> = {
    weak: '33%',
    medium: '66%',
    strong: '100%',
  };

  const handleGoogleSignUp = async () => {
    try {
      const { createdSessionId, setActive: oAuthSetActive } = await startOAuthFlow();

      if (createdSessionId) {
        await oAuthSetActive!({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('OAuth error:', JSON.stringify(err, null, 2));
      Alert.alert('Sign Up Error', 'Failed to sign up with Google');
    }
  };

  const handleSignUp = async () => {
    if (!isLoaded) return;

    // Validate inputs before attempting signup
    if (!validateName(name)) {
      Alert.alert('Invalid Name', 'Please enter your full name.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Log input for debugging
      console.log('Attempting sign up with:', { email, name });

      // Create the sign up with Clerk
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
      });

      console.log('✅ Sign up created successfully');
      console.log('Sign up result status:', result.status);
      console.log('Sign up result keys:', Object.keys(result));
      console.log('Created session ID:', result.createdSessionId);

      // Check if email verification is required
      if (result.status === 'missing_requirements') {
        console.log('Email verification required');
        // Prepare email verification
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        
        // Show alert that verification email was sent
        Alert.alert(
          'Verify your email',
          'We sent you a verification code. Please check your email and enter the code.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to a verification screen or show input for code
                // For now, we'll show a prompt
                navigation.navigate('Login');
              },
            },
          ]
        );
      } else if (result.createdSessionId) {
        // If session was created directly, activate it
        console.log('Attempting to activate session:', result.createdSessionId);
        try {
          await setActive({ session: result.createdSessionId });
          console.log('✅ Session activated successfully');
        } catch (activationErr: any) {
          console.error('❌ Session activation failed:', activationErr);
          console.error('Activation error details:', JSON.stringify(activationErr, null, 2));
          throw activationErr; // Re-throw to be caught by outer catch
        }
      } else {
        // Handle other statuses
        console.warn('Unexpected sign up status:', result.status);
        Alert.alert(
          'Sign Up Incomplete',
          'Please check your email to complete the registration process.'
        );
      }
    } catch (err: any) {
      // Comprehensive error logging
      console.error('=== SIGN UP ERROR START ===');
      console.error('Error type:', typeof err);
      console.error('Error constructor:', err?.constructor?.name);
      console.error('Error message:', err?.message);
      console.error('Error string:', String(err));
      console.error('Error JSON:', JSON.stringify(err, null, 2));
      console.error('Error keys:', err ? Object.keys(err) : 'no keys');
      console.error('Error errors array:', err?.errors);
      console.error('SignUp status after error:', signUp?.status);
      console.error('SignUp unverified fields:', signUp?.unverifiedFields);
      console.error('=== SIGN UP ERROR END ===');
      
      // Extract error details from Clerk error structure
      let errorMessage = 'Sign up failed. Please try again.';
      let foundError = false;
      
      // Try multiple ways to extract the error
      if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const firstError = err.errors[0];
        foundError = true;
        
        // Check for specific error codes
        if (firstError.code === 'form_password_pwned') {
          errorMessage = 'This password has been found in a data breach and cannot be used. Please choose a different password.';
        } else if (firstError.code === 'form_identifier_exists') {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (firstError.code === 'form_password_length_too_short') {
          errorMessage = 'Password is too short. Please use at least 8 characters.';
        } else if (firstError.code === 'form_param_format_invalid') {
          errorMessage = firstError.longMessage || firstError.message || 'Invalid input format.';
        } else {
          errorMessage = firstError.longMessage || firstError.message || errorMessage;
        }
      } else if (err?.message) {
        foundError = true;
        errorMessage = err.message;
      } else if (err?.toString && typeof err.toString === 'function') {
        const errStr = err.toString();
        if (errStr !== '[object Object]') {
          foundError = true;
          errorMessage = errStr;
        }
      }
      
      Alert.alert('Sign Up Error', errorMessage);
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
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>
                Wanna become part of the frame?
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.googleButton, loading && styles.disabledButton]}
              onPress={handleGoogleSignUp}
              disabled={loading}
            >
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleLogo}
                resizeMode="contain"
                accessible
                accessibilityLabel="Google logo"
              />
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with email</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sara Lens"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                  autoCapitalize="words"
                />
              </View>

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
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.mutedForeground}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {password.length > 0 && (
                <View style={styles.passwordStrength}>
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: strengthWidthMap[passwordStrength.strength],
                          backgroundColor: strengthColorMap[passwordStrength.strength],
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.strengthText,
                      { color: strengthColorMap[passwordStrength.strength] },
                    ]}
                  >
                    {passwordStrength.message}
                  </Text>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Re-enter your password"
                    placeholderTextColor={colors.mutedForeground}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.primaryButtonText}>Create account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already a member?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Sign in</Text>
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
    paddingHorizontal: spacing.lg,
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
  title: {
    fontSize: fontSize.xxxl,
    color: colors.primary,
    fontFamily: 'SpaceMono_700Bold',
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.mutedForeground,
    lineHeight: 24,
    fontFamily: 'SpaceMono_400Regular',
    maxWidth: 360,
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
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: 48,
    fontSize: fontSize.md,
    color: colors.foreground,
    fontFamily: 'SpaceMono_400Regular',
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  passwordStrength: {
    gap: spacing.xs,
  },
  strengthTrack: {
    width: '100%',
    height: 6,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.muted,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: borderRadius.medium,
  },
  strengthText: {
    fontSize: fontSize.sm,
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
