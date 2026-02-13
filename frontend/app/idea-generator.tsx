import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { UniverseBackground } from '../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../utils/soundEffects';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { canUseAiFeature, recordAiFeatureUsed, AI_FEATURE_KEYS } from '../utils/aiUsageLimit';

export default function IdeaGeneratorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateIdeas = useCallback(async () => {
    setError(null);
    setIdeas([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Not signed in.');
        return;
      }
      const userId = user?.id ?? session?.user?.id ?? '';
      const allowed = await canUseAiFeature(AI_FEATURE_KEYS.idea_generator, userId);
      if (!allowed) {
        Alert.alert(
          'Limit reached',
          'You can only use Idea Generator once per day. Try again tomorrow.'
        );
        return;
      }
      setLoading(true);
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
      if (!url || !anonKey) {
        setError('Supabase URL or anon key not configured.');
        return;
      }
      const res = await fetch(`${url}/functions/v1/generate-ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ access_token: session.access_token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data as { error?: string };
        setError(err?.error ?? `Request failed (${res.status})`);
        return;
      }
      const list = (data as { ideas?: string[] }).ideas;
      setIdeas(Array.isArray(list) ? list : []);
      await recordAiFeatureUsed(AI_FEATURE_KEYS.idea_generator, userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate ideas.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const copyAll = useCallback(async () => {
    playClickSound();
    const text = ideas.map((s, i) => `${i + 1}. ${s}`).join('\n');
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'All 60 ideas copied to clipboard.');
  }, [ideas]);

  const needsUniverse = error?.includes('Creator Universe') ?? false;

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              playClickSound();
              router.back();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.title}>Idea Generator</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
        >
          <Text style={styles.subtitle}>
            Generate 60 short-form content ideas using your Creator Universe: one struggle + one topic from your pillars + one desire per idea.
          </Text>

          {!loading && ideas.length === 0 && !error && (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateIdeas}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={22} color="#1a1a24" />
              <Text style={styles.generateButtonText}>Generate 60 ideas</Text>
            </TouchableOpacity>
          )}

          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Generating ideas…</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              {needsUniverse && (
                <TouchableOpacity
                  style={styles.universeLink}
                  onPress={() => {
                    playClickSound();
                    router.replace('/(tabs)/creator-universe');
                  }}
                >
                  <Text style={styles.universeLinkText}>Open Creator Universe</Text>
                  <Ionicons name="open-outline" size={18} color="#FFD700" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.retryButton} onPress={generateIdeas}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {ideas.length > 0 && (
            <>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>{ideas.length} ideas</Text>
                <TouchableOpacity style={styles.copyButton} onPress={copyAll}>
                  <Ionicons name="copy-outline" size={20} color="#FFD700" />
                  <Text style={styles.copyButtonText}>Copy all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.list}>
                {ideas.map((idea, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.listNum}>{i + 1}.</Text>
                    <Text style={styles.listText}>{idea}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.generateAgain}
                onPress={generateIdeas}
                disabled={loading}
              >
                <Text style={styles.generateAgainText}>Generate again</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  backButton: { padding: 8, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFD700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: 24,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
  },
  generateButtonText: { fontSize: 17, fontWeight: '700', color: '#1a1a24' },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  errorBox: {
    backgroundColor: 'rgba(220, 80, 80, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 80, 80, 0.4)',
  },
  errorText: { fontSize: 15, color: 'rgba(255,255,255,0.95)', marginBottom: 12 },
  universeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  universeLinkText: { fontSize: 15, fontWeight: '600', color: '#FFD700' },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 8,
  },
  retryButtonText: { fontSize: 14, fontWeight: '600', color: '#FFD700' },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: { fontSize: 18, fontWeight: '700', color: '#FFD700' },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 8,
  },
  copyButtonText: { fontSize: 14, fontWeight: '600', color: '#FFD700' },
  list: { marginBottom: 24 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  listNum: { fontSize: 14, fontWeight: '700', color: 'rgba(255,215,0,0.9)', minWidth: 28 },
  listText: { flex: 1, fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },
  generateAgain: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 10,
  },
  generateAgainText: { fontSize: 15, fontWeight: '600', color: '#FFD700' },
});
