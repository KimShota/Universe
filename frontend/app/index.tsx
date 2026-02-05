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
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { UniverseBackground } from '../components/UniverseBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DONE_KEY = 'onboarding:done';

const APP_ICON = require('../Media/bear-waving.png');

type EmailMode = 'signin' | 'signup';

export default function LoginScreen() {
  const { user, loading, login, loginWithEmail, signUpWithEmail } = useAuth();
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
          </View>

          <View style={styles.ctaWrap}>
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
                  {emailMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.orDivider}>or continue with</Text>
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
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconImage: {
    width: 112,
    height: 112,
    marginBottom: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  ctaWrap: {
    width: '100%',
    alignItems: 'center',
  },
  emailForm: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(60, 45, 90, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emailSubmitButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 12,
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
    marginTop: 4,
    marginBottom: 20,
    paddingVertical: 6,
  },
  signUpLinkText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  orDivider: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
    marginBottom: 14,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 28,
    width: '100%',
    maxWidth: 320,
    gap: 12,
    marginBottom: 12,
  },
  googleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 14, 39, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0a0e27',
  },
  helperText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 4,
  },
});
