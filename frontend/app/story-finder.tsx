import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Modal,
  Pressable,
  Animated,
  PanResponder,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UniverseBackground } from '../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { playClickSound } from '../utils/soundEffects';
import { MAX_STORY_CARDS } from '../constants/limits';

const { width, height } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = Math.min(height * 0.92, height - 60);
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

const STORY_TIPS: { icon: string; title: string; description: string }[] = [
  { icon: 'book', title: 'WHY IT MATTERS', description: "Finding your own story is extremely important in your short-form content journey because it's what allows you to create the most impactful content. Ask yourself: How has your ethos transformed your life? How has pursuing it changed you?" },
  { icon: 'heart', title: 'YOUR STORY', description: "Maybe you grew up watching your parents get divorced and struggled mentally for years. Maybe now, after a long journey, you've achieved some level of financial freedom. That is your story." },
  { icon: 'people', title: 'BUILD CONNECTIONS', description: "Sharing your story is one of the most powerful ways to build real connections with your audience." },
  { icon: 'flash', title: 'CONNECT WITH HUMANITY', description: "Talking like an expert isn't the goal. People don't connect with perfection—they connect with humanity. When you share relatable struggles and real pain, you stop being just a creator and start being someone they trust." },
  { icon: 'sparkles', title: 'THE POWER OF STORYTELLING', description: "This is the power of storytelling. People connect with who you are, not with your highlights." },
];

type RowKey = 'problem' | 'pursuit' | 'payoff' | 'your_story';

interface StoryRow {
  id: string;
  problem: string;
  pursuit: string;
  payoff: string;
  your_story: string;
}

export default function StoryFinderScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState<StoryRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SHEET_MAX_HEIGHT)).current;
  const panStartY = useRef(0);

  const closeTipsModal = useCallback(() => {
    playClickSound();
    Animated.timing(sheetAnim, {
      toValue: SHEET_MAX_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowTipModal(false));
  }, [sheetAnim]);

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
        onPanResponderGrant: (_, g) => {
          panStartY.current = g.moveY;
        },
        onPanResponderRelease: (_, g) => {
          const dy = g.moveY - panStartY.current;
          if (dy > 50) closeTipsModal();
        },
      }),
    [closeTipsModal]
  );

  useEffect(() => {
    if (!showTipModal) return;
    sheetAnim.setValue(SHEET_MAX_HEIGHT);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [showTipModal, sheetAnim]);

  const loadMessage = useCallback(async () => {
    try {
      if (!user?.id) return;
      const { data } = await supabase
        .from('creator_universe')
        .select('overarching_goal')
        .eq('user_id', user.id)
        .maybeSingle();
      setMessage(data?.overarching_goal ?? '');
    } catch (e) {
      console.error('Error loading message:', e);
    }
  }, [user?.id]);

  const loadRows = useCallback(async () => {
    try {
      if (!user?.id) return;
      const { data } = await supabase
        .from('story_finder')
        .select('rows')
        .eq('user_id', user.id)
        .maybeSingle();
      const raw = ((data?.rows ?? []) as StoryRow[]);
      setRows(raw.map((r) => ({
        id: r.id ?? Date.now().toString(),
        problem: r.problem ?? '',
        pursuit: r.pursuit ?? '',
        payoff: r.payoff ?? '',
        your_story: r.your_story ?? '',
      })));
    } catch (e) {
      console.error('Error loading story finder:', e);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadMessage();
      loadRows();
    }, [loadMessage, loadRows])
  );

  const saveRows = async (next: StoryRow[]) => {
    try {
      if (!user?.id) return;
      await supabase
        .from('story_finder')
        .upsert(
          { user_id: user.id, rows: next, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
    } catch (e) {
      console.error('Error saving story finder:', e);
    }
  };

  const updateCell = (rowIndex: number, key: RowKey, value: string) => {
    const next = [...rows];
    const row = next[rowIndex];
    if (!row) return;
    next[rowIndex] = { ...row, [key]: value };
    setRows(next);
    saveRows(next);
  };

  const addCard = () => {
    if (rows.length >= MAX_STORY_CARDS) {
      Alert.alert('Limit reached', `You can create up to ${MAX_STORY_CARDS} story cards. Delete one to add a new one.`);
      return;
    }
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
          <TouchableOpacity
            onPress={() => {
              playClickSound();
              setShowTipModal(true);
            }}
            style={styles.helpButton}
          >
            <Ionicons name="help-circle-outline" size={28} color="#FFD700" />
          </TouchableOpacity>
        </View>

        <Modal visible={showTipModal} transparent animationType="none">
          <View style={styles.tipsSheetOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeTipsModal}>
              <BlurView
                intensity={Platform.OS === 'ios' ? 60 : 80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            </Pressable>
            <Animated.View
              style={[
                styles.tipsSheet,
                {
                  height: SHEET_MAX_HEIGHT,
                  paddingBottom: insets.bottom,
                  transform: [{ translateY: sheetAnim }],
                },
              ]}
            >
              <View {...sheetPanResponder.panHandlers} style={styles.tipsSheetHandle}>
                <View style={styles.tipsSheetHandleBar} />
              </View>
              <ScrollView
                style={styles.tipsScroll}
                contentContainerStyle={[styles.tipsScrollContent, { paddingBottom: 24 + 60 }]}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.tipsCard}>
                  <Text style={styles.tipsTitle}>STORY FINDER TIP</Text>
                  <Text style={styles.tipsSubtitle}>FINDING YOUR STORY</Text>
                  {STORY_TIPS.map((tip, idx) => (
                    <View key={idx} style={styles.tipRow}>
                      <View style={styles.tipIconWrap}>
                        <Ionicons name={tip.icon as any} size={20} color="#FFD700" />
                      </View>
                      <View style={styles.tipTextWrap}>
                        <Text style={styles.tipTitle}>{tip.title}</Text>
                        <Text style={styles.tipDesc}>{tip.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.tipsCloseWrap}>
                <TouchableOpacity style={styles.tipsCloseButton} onPress={closeTipsModal} activeOpacity={0.85}>
                  <Text style={styles.tipsCloseText}>CLOSE TIPS</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <Text style={styles.messageLabel}>THE CENTRAL MESSAGE</Text>
          <View style={styles.messageBox}>
            <Text style={styles.messagePlaceholder}>
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
                            value={row[s.key] ?? ''}
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
                          value={row[STORY_SECTION.key] ?? ''}
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

          <TouchableOpacity
            style={[styles.addCardButton, rows.length >= MAX_STORY_CARDS && styles.addCardButtonDisabled]}
            onPress={addCard}
            disabled={rows.length >= MAX_STORY_CARDS}
          >
            <Ionicons name="add" size={24} color="rgba(255, 255, 255, 0.85)" />
            <Text style={styles.addCardText}>Add new story card</Text>
          </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8, zIndex: 1 },
  helpButton: { padding: 8, zIndex: 1, marginLeft: 'auto' },
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
  addCardButtonDisabled: {
    opacity: 0.5,
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
  tipsSheetOverlay: {
    flex: 1,
    width: '100%',
  },
  tipsSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 14, 28, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    overflow: 'hidden',
  },
  tipsSheetHandle: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsSheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  tipsScroll: { flex: 1 },
  tipsScrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  tipsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 6,
  },
  tipsSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1,
    marginBottom: 20,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tipTextWrap: { flex: 1 },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tipDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tipsCloseWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  tipsCloseButton: {
    backgroundColor: 'rgba(40, 35, 55, 0.95)',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1,
  },
});
