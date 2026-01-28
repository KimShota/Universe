import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { UniverseBackground } from '../components/UniverseBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { playClickSound } from '../utils/soundEffects';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const CARD_PADDING = 20;
const CARD_WIDTH = width - CARD_PADDING * 2;

const SECTIONS = [
  { key: 'problem' as const, label: 'PROBLEM', placeholder: 'Struggle, pain, or tension...', icon: 'warning' as const },
  { key: 'pursuit' as const, label: 'PURSUIT', placeholder: 'Actions, decisions, mindset shifts...', icon: 'walk' as const },
  { key: 'payoff' as const, label: 'PAYOFF', placeholder: 'Outcome, lesson, transformation...', icon: 'sparkles' as const },
];

const STORY_SECTION = {
  key: 'your_story' as const,
  label: 'STORY',
  placeholder: 'Write the overall story that encompasses problem, pursuit, and payoff...',
  icon: 'book' as const,
};

type RowKey = 'problem' | 'pursuit' | 'payoff' | 'your_story';

interface StoryRow {
  id: string;
  problem: string;
  pursuit: string;
  payoff: string;
  your_story: string;
}

export default function StoryFinderScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState<StoryRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadMessage = useCallback(async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const res = await fetch(`${BACKEND_URL}/api/creator-universe`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(data.overarching_goal ?? '');
      }
    } catch (e) {
      console.error('Error loading message:', e);
    }
  }, []);

  const loadRows = useCallback(async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const res = await fetch(`${BACKEND_URL}/api/story-finder`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const raw = (data.rows ?? []) as StoryRow[];
        setRows(raw.map((r) => ({
          id: r.id,
          problem: r.problem ?? '',
          pursuit: r.pursuit ?? '',
          payoff: r.payoff ?? '',
          your_story: r.your_story ?? '',
        })));
      }
    } catch (e) {
      console.error('Error loading story finder:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMessage();
      loadRows();
    }, [loadMessage, loadRows])
  );

  const saveRows = async (next: StoryRow[]) => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      await fetch(`${BACKEND_URL}/api/story-finder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ rows: next }),
      });
    } catch (e) {
      console.error('Error saving story finder:', e);
    }
  };

  const updateCell = (rowIndex: number, key: RowKey, value: string) => {
    const next = [...rows];
    if (!next[rowIndex]) return;
    (next[rowIndex] as Record<string, string>)[key] = value;
    setRows(next);
    saveRows(next);
  };

  const addCard = () => {
    playClickSound();
    const newRow: StoryRow = {
      id: Date.now().toString(),
      problem: '',
      pursuit: '',
      payoff: '',
      your_story: '',
    };
    const next = [...rows, newRow];
    setRows(next);
    saveRows(next);
    setCurrentIndex(next.length - 1);
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: (next.length - 1) * (CARD_WIDTH + CARD_PADDING),
        animated: true,
      });
    }, 100);
  };

  const removeCard = (index: number) => {
    playClickSound();
    const next = rows.filter((_, i) => i !== index);
    setRows(next);
    saveRows(next);
    setCurrentIndex(Math.min(currentIndex, Math.max(0, next.length - 1)));
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_WIDTH + CARD_PADDING));
    if (index >= 0 && index < rows.length) setCurrentIndex(index);
  };

  const hasCards = rows.length > 0;

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              playClickSound();
              router.back();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Story Finder</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.messageLabel}>THE CENTRAL MESSAGE</Text>
          <View style={styles.messageBox}>
            <Text
              style={styles.messagePlaceholder}
              numberOfLines={2}
            >
              {message || 'One message. Many stories. Total alignment.'}
            </Text>
          </View>

          {hasCards ? (
            <>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                onMomentumScrollEnd={onScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsContent}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + CARD_PADDING}
                snapToAlignment="start"
              >
                {rows.map((row, idx) => (
                  <View key={row.id} style={styles.cardPage}>
                    <View style={styles.storyCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardTitleRow}>
                          <View style={styles.bullet} />
                          <Text style={styles.cardTitle}>
                            Story Card {String(idx + 1).padStart(2, '0')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeCard(idx)}
                          style={styles.deleteCardBtn}
                        >
                          <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                      </View>

                      {SECTIONS.map((s) => (
                        <View key={s.key} style={styles.section}>
                          <View style={styles.sectionHeader}>
                            <Ionicons name={s.icon} size={16} color="#FFD700" />
                            <Text style={styles.sectionLabel}>{s.label}</Text>
                          </View>
                          <TextInput
                            style={styles.sectionInput}
                            value={(row as Record<string, string>)[s.key] ?? ''}
                            onChangeText={(v) => updateCell(idx, s.key, v)}
                            placeholder={s.placeholder}
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            multiline
                          />
                        </View>
                      ))}

                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name={STORY_SECTION.icon} size={16} color="#FFD700" />
                          <Text style={styles.sectionLabel}>{STORY_SECTION.label}</Text>
                        </View>
                        <TextInput
                          style={[styles.sectionInput, styles.storyInput]}
                          value={(row as Record<string, string>)[STORY_SECTION.key] ?? ''}
                          onChangeText={(v) => updateCell(idx, STORY_SECTION.key, v)}
                          placeholder={STORY_SECTION.placeholder}
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          multiline
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.dotsRow}>
                {rows.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === currentIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="rgba(255, 215, 0, 0.4)" />
              <Text style={styles.emptyText}>No story cards yet</Text>
              <Text style={styles.emptySubtext}>Add your first card to start</Text>
            </View>
          )}

          <TouchableOpacity style={styles.addCardButton} onPress={addCard}>
            <Ionicons name="add" size={24} color="rgba(255, 255, 255, 0.85)" />
            <Text style={styles.addCardText}>Add new story card</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8, zIndex: 1 },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 40,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  messageBox: {
    backgroundColor: 'rgba(80, 60, 120, 0.35)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(150, 120, 200, 0.4)',
  },
  messagePlaceholder: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  cardsContent: {
    paddingRight: CARD_PADDING,
    paddingBottom: 8,
  },
  cardPage: {
    width: CARD_WIDTH + CARD_PADDING,
    paddingRight: CARD_PADDING,
  },
  storyCard: {
    backgroundColor: 'rgba(60, 45, 90, 0.5)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  deleteCardBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  sectionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    minHeight: 48,
    textAlignVertical: 'top',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  storyInput: {
    minHeight: 100,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 20,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(60, 45, 90, 0.5)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    borderStyle: 'dashed',
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
});
