import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { UniverseBackground } from '../components/UniverseBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DONE_KEY = 'onboarding:done';

const APP_ICON = require('../Media/bear-waving.png');

type EmailMode = 'signin' | 'signup';

export default function LoginScreen() {
  const { user, loading, login, loginWithApple, loginWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        const done = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
        if (done === '1') {
          router.replace('/(tabs)/main');
        } else {
          router.replace('/onboarding');
        }
      } catch {
        router.replace('/onboarding');
      }
    })();
  }, [user, loading]);

  if (loading) {
    return (
      <UniverseBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading Universe...</Text>
        </View>
      </UniverseBackground>
    );
  }

  if (user) {
    return (
      <UniverseBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading Universe...</Text>
        </View>
      </UniverseBackground>
    );
  }

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image source={APP_ICON} style={styles.iconImage} resizeMode="contain" />
            <Text style={styles.title}>Universe</Text>
            <Text style={styles.subtitle}>Your Content Creation Journey</Text>
            <View style={styles.headerLine} />
          </View>

          <View style={styles.ctaWrap}>
            <View style={styles.emailFormCard}>
            <View style={styles.emailForm}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={email}
                onChangeText={(t) => { setEmail(t); setAuthError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitting}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={password}
                onChangeText={(t) => { setPassword(t); setAuthError(null); }}
                secureTextEntry
                editable={!submitting}
              />
              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
              <TouchableOpacity
                style={[styles.emailSubmitButton, submitting && styles.emailSubmitDisabled]}
                onPress={async () => {
                  const e = email.trim();
                  const p = password;
                  if (!e || !p) {
                    setAuthError('Please enter email and password.');
                    return;
                  }
                  setSubmitting(true);
                  setAuthError(null);
                  const result = emailMode === 'signup'
                    ? await signUpWithEmail(e, p)
                    : await loginWithEmail(e, p);
                  setSubmitting(false);
                  if (result.error) {
                    setAuthError(result.error.message || 'Something went wrong.');
                    return;
                  }
                  if (emailMode === 'signup') {
                    Alert.alert(
                      'Check your email',
                      "We've sent you a confirmation link. Please check your inbox and click the link to activate your account."
                    );
                  }
                }}
                disabled={submitting}
              >
                <Text style={styles.emailSubmitText}>
                  {submitting ? 'Please wait...' : emailMode === 'signup' ? 'Sign up' : 'Sign in'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signUpLinkButton}
                onPress={() => {
                  setEmailMode(emailMode === 'signin' ? 'signup' : 'signin');
                  setAuthError(null);
                }}
                disabled={submitting}
              >
                <Text style={styles.signUpLinkText}>
                  {emailMode === 'signin' ? (
                    <>
                      <Text style={styles.signUpLinkLabel}>{"Don't have an account? "}</Text>
                      <Text style={styles.signUpLinkHighlight}>Sign up</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.signUpLinkLabel}>Already have an account? </Text>
                      <Text style={styles.signUpLinkHighlight}>Sign in</Text>
                    </>
                  )}
                </Text>
              </TouchableOpacity>
            </View>
            </View>
            <View style={styles.orDividerWrap}>
              <View style={styles.orDividerLine} />
              <Text style={styles.orDivider}>or continue with</Text>
              <View style={styles.orDividerLine} />
            </View>
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.appleButton} onPress={loginWithApple} activeOpacity={0.85}>
                <Ionicons name="logo-apple" size={22} color="#fff" />
                <Text style={styles.appleButtonText}>Sign in with Apple</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.loginButton} onPress={login} activeOpacity={0.85}>
              <View style={styles.googleBadge}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.loginButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>Join creators on their journey</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconImage: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 6,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  headerLine: {
    width: 48,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.35)',
    marginTop: 20,
  },
  ctaWrap: {
    width: '100%',
    alignItems: 'center',
    maxWidth: 340,
  },
  emailFormCard: {
    width: '100%',
    backgroundColor: 'rgba(40, 30, 60, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.12)',
  },
  emailForm: {
    width: '100%',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#fff',
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    color: '#ff6b6b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emailSubmitButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  emailSubmitDisabled: {
    opacity: 0.7,
  },
  emailSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0e27',
  },
  signUpLinkButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  signUpLinkText: {
    fontSize: 14,
  },
  signUpLinkLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signUpLinkHighlight: {
    color: '#FFD700',
    fontWeight: '600',
  },
  orDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginBottom: 18,
    gap: 12,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  orDivider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderWidth: 0,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    maxWidth: 320,
    gap: 10,
    marginBottom: 12,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.6)',
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    maxWidth: 320,
    gap: 12,
    marginBottom: 16,
  },
  googleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
  helperText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
  },
});
