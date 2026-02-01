import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { UniverseBackground } from '../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DONE_KEY = 'onboarding:done';

const APP_ICON = require('../Media/saturn.png');

const FEATURES = [
  { icon: 'sparkles' as const, title: 'Overcome Fear', desc: "Get support when you're struggling" },
  { icon: 'rocket' as const, title: 'Stay Consistent', desc: 'Track your posting streak' },
  { icon: 'trending-up' as const, title: 'Grow Strategically', desc: 'Use Universe System to grow your personal brand fast' },
];

export default function LoginScreen() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

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
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Image source={APP_ICON} style={styles.iconImage} resizeMode="contain" />
              </View>
            </View>
            <Text style={styles.title}>Universe</Text>
            <Text style={styles.subtitle}>Your Content Creation Journey</Text>
          </View>

          <View style={styles.content}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={f.icon} size={24} color="#FFD700" />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureText}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.ctaWrap}>
            <TouchableOpacity style={styles.loginButton} onPress={login} activeOpacity={0.85}>
              <View style={styles.googleBadge}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.loginButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>Join thousands of creators on their journey</Text>
            <View style={styles.pagination} />
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
    paddingTop: 40,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconOuter: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: 'rgba(60, 45, 90, 0.85)',
    padding: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(20, 55, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: 56,
    height: 56,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
  },
  content: {
    width: '100%',
    gap: 16,
    marginBottom: 28,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(60, 45, 90, 0.5)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  featureIconWrap: {
    marginRight: 16,
  },
  featureTextWrap: { flex: 1 },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  ctaWrap: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 30,
    width: '100%',
    maxWidth: 320,
    gap: 12,
    marginBottom: 14,
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
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    marginBottom: 24,
  },
  pagination: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
