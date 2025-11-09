import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useSignIn } from '@clerk/clerk-expo';
import { colors } from '../../constants/colors';
import { spacing, fontSize, borderRadius } from '../../constants/spacing';
import { validateEmail, validatePassword } from '../../utils/validation';

const enum Step {
  REQUEST = 'request',
  VERIFY = 'verify',
  SUCCESS = 'success',
}

export default function ForgotPasswordScreen({ navigation }: any) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>(Step.REQUEST);

  const handleSendResetEmail = async () => {
    if (!isLoaded) return;

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setStep(Step.VERIFY);
      Alert.alert('Email Sent', 'Check your inbox for a 6-digit verification code.');
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Unable to send reset email';
      Alert.alert('Request Failed', errorMessage);
      console.error('Password reset request error:', JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isLoaded) return;

    if (!code) {
      Alert.alert('Missing Code', 'Enter the verification code sent to your email.');
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });

      if (attempt.status !== 'needs_new_password') {
        throw new Error('Unexpected status during password reset.');
      }

      const reset = await signIn.resetPassword({ password: newPassword });

      if (reset.status === 'complete') {
        await setActive({ session: reset.createdSessionId });
        setStep(Step.SUCCESS);
      } else {
        throw new Error('Password reset not completed.');
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Unable to reset password';
      Alert.alert('Reset Failed', errorMessage);
      console.error('Password reset error:', JSON.stringify(err, null, 2));
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
              <Text style={styles.title}>
                {step === Step.SUCCESS ? 'Password updated' : 'Reset your password'}
              </Text>
              <Text style={styles.subtitle}>
                {step === Step.REQUEST && 'Enter the email associated with your account. We will send a one-time code to reset your password.'}
                {step === Step.VERIFY && 'Enter the 6-digit code we sent to your email and choose a new password.'}
                {step === Step.SUCCESS && 'You are signed in with your new password.'}
              </Text>
            </View>

            {step === Step.REQUEST && (
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

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleSendResetEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.primaryForeground} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send reset email</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === Step.VERIFY && (
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>Verification code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit code"
                    placeholderTextColor={colors.mutedForeground}
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    editable={!loading}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>New password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.mutedForeground}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.primaryForeground} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Update password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === Step.SUCCESS && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.replace('Login')}
              >
                <Text style={styles.secondaryButtonText}>Return to login</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
              <Text style={styles.backLinkText}>Back to sign in</Text>
            </TouchableOpacity>
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
    gap: spacing.xxl,
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
  secondaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.secondaryForeground,
    fontSize: fontSize.lg,
    fontFamily: 'SpaceMono_700Bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontFamily: 'SpaceMono_400Regular',
  },
});
