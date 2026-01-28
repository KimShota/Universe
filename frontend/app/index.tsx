import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { UniverseBackground } from '../components/UniverseBackground';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DONE_KEY = 'onboarding:done';

export default function LoginScreen() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

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
    return null; // Will redirect
  }

  return (
    <UniverseBackground>
      <View style={styles.container}>
        {/* Logo/Title Area */}
        <View style={styles.header}>
          <Text style={styles.title}>🌌 Universe</Text>
          <Text style={styles.subtitle}>Your Content Creation Journey</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>✨ Overcome Fear</Text>
            <Text style={styles.featureText}>Get support when you're struggling</Text>
          </View>
          
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>🚀 Stay Consistent</Text>
            <Text style={styles.featureText}>Track your posting streak</Text>
          </View>
          
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>🎯 Stay Motivated</Text>
            <Text style={styles.featureText}>Earn coins and level up</Text>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={login}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Join thousands of creators on their journey
        </Text>
      </View>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    width: '100%',
    gap: 24,
  },
  featureContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  loginButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e27',
  },
  helperText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.6,
    textAlign: 'center',
  },
});