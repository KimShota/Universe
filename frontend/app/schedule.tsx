import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UniverseBackground } from '../components/UniverseBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { playClickSound } from '../utils/soundEffects';

const { width, height } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = Math.min(height * 0.92, height - 60);
const CARD_WIDTH = width - 40;
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const SAVE_DEBOUNCE_MS = 500;

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const SCHEDULE_TIPS_PAGE1: { icon: string; title: string; description: string }[] = [
  { icon: 'trending-down', title: 'LOW INTENSITY (5x per week)', description: "• B-roll with info in caption\n• B-roll with voiceover\n• Unscripted talking head\n• Trends" },
  { icon: 'flame', title: 'HIGH INTENSITY (2x per week)', description: "• Vlogs\n• Scripted talking head with multiple angles\n• Silent film storytelling" },
  { icon: 'checkmark-circle', title: 'STAY CONSISTENT', description: "Don't let the production level stop you from posting consistently. It is good and strategically important to post low intensity content." },
];

const SCHEDULE_TIPS_PAGE2: { icon: string; title: string; description: string }[] = [
  { icon: 'flash', title: 'DAY 1 — BUILD TRUST', description: "Start the week with a high effort post. Your story, a real struggle, the shift you made, and the lesson you learned. This is the post that makes people believe you." },
  { icon: 'people', title: 'DAY 2 — RELATABILITY', description: "Low effort content. Share behind the scenes, a day in the life, something real and unpolished. This is how you make your content feel human." },
  { icon: 'school', title: 'DAY 3 — AUTHORITY', description: "Medium effort. Teach one thing you actually know. One technique, one decision, one key takeaway. This positions you as someone worth listening to." },
  { icon: 'radio', title: 'DAY 4 — REACH', description: "Low effort. Use a trending format like b-roll with text or split screen with your message. The format does the work; your insight builds credibility." },
  { icon: 'layers', title: 'DAY 5 — VALUE', description: "Medium effort. Break something down—a three step system, a common mistake, or a mini framework. This is the value that keeps people following you." },
  { icon: 'heart', title: 'DAY 6 — CONSISTENCY', description: "Lowest effort. A reflection, gratitude, or answering a common question. Helps you stay consistent even on lowest energy days." },
  { icon: 'business', title: 'DAY 7 — DEPTH', description: "High effort. A longer reel, mini lesson, or short vlog. This is how you turn followers into a real community." },
  { icon: 'calendar', title: 'FEWER DAYS', description: "• 6 days a week: remove Day 6\n• 5 days: remove Day 2\n• 4 days: remove Day 3" },
];
const DAY_ABBREV: Record<string, string> = { Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN' };

const FORMAT_OPTIONS: { id: string; label: string; icon: string }[] = [
  { id: 'Silent Film Storytelling', label: 'Silent Film Storytelling', icon: 'grid-outline' },
  { id: 'B-roll', label: 'B-roll', icon: 'film-outline' },
  { id: 'Talking Head', label: 'Talking Head', icon: 'person-outline' },
  { id: 'Split Screen', label: 'Split Screen', icon: 'albums-outline' },
  { id: 'Other', label: 'Other', icon: 'ellipsis-horizontal' },
];
const PRESET_FORMAT_IDS = FORMAT_OPTIONS.filter((o) => o.id !== 'Other').map((o) => o.id);

interface ScheduleData {
  [day: string]: { idea: string; format: string };
}

function getWeekDates(): { date: Date; dayName: (typeof DAY_NAMES)[number] }[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + monOffset);
  return DAY_NAMES.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: d, dayName: name };
  });
}

function formatDateShort(d: Date): string {
  return d.getDate().toString();
}

function formatDateLong(d: Date): string {
  const months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function relativeTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [schedule, setSchedule] = useState<ScheduleData>(() =>
    Object.fromEntries(DAY_NAMES.map((d) => [d, { idea: '', format: '' }]))
  );
  const [selectedDay, setSelectedDay] = useState<(typeof DAY_NAMES)[number]>('Monday');
  const [lastModified, setLastModified] = useState<number>(() => Date.now());
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipPage, setTipPage] = useState(1);
  const [, setLastSaved] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());
  const hasLoadedRef = useRef(false);
  const cardsScrollRef = useRef<ScrollView>(null);
  const tipsPagesScrollRef = useRef<ScrollView>(null);
  const sheetAnim = useRef(new Animated.Value(SHEET_MAX_HEIGHT)).current;
  const panStartY = useRef(0);

  const closeTipsModal = useCallback(() => {
    playClickSound();
    Animated.timing(sheetAnim, {
      toValue: SHEET_MAX_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowTipModal(false);
      setTipPage(1);
    });
  }, [sheetAnim]);

  const scrollToTipsPage = (page: 1 | 2) => {
    playClickSound();
    setTipPage(page);
    tipsPagesScrollRef.current?.scrollTo({ x: (page - 1) * width, animated: true });
  };

  const handleTipsPageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const page = Math.round(x / width) + 1;
    if (page >= 1 && page <= 2 && page !== tipPage) setTipPage(page);
  };

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

  const weekDates = useMemo(getWeekDates, []);

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

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const loadSchedule = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/schedule`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        const scheduleData = data.schedule;
        if (!scheduleData) return;
        if (scheduleData.idea && scheduleData.format) {
          const next: ScheduleData = {};
          DAY_NAMES.forEach((d) => {
            next[d] = {
              idea: scheduleData.idea[d] || '',
              format: scheduleData.format[d] || '',
            };
          });
          setSchedule(next);
        } else {
          setSchedule(scheduleData);
        }
        hasLoadedRef.current = true;
      }
    } catch (e) {
      console.error('Error loading schedule:', e);
    }
  };

  const saveSchedule = async (override?: ScheduleData) => {
    const payload = override ?? schedule;
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const res = await fetch(`${BACKEND_URL}/api/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ schedule: payload }),
      });
      if (res.ok) {
        setLastSaved(Date.now());
      }
    } catch (e) {
      console.error('Error saving schedule:', e);
    }
  };

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const t = setTimeout(() => saveSchedule(schedule), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [schedule]);

  const updateIdea = (day: string, value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], idea: value },
    }));
    setLastModified(Date.now());
  };

  const updateFormat = (day: string, value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], format: value },
    }));
    setLastModified(Date.now());
  };

  const scrollToDay = (index: number) => {
    const day = DAY_NAMES[index];
    setSelectedDay(day);
    cardsScrollRef.current?.scrollTo({ x: index * CARD_WIDTH, animated: true });
  };

  const handleCardsScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / CARD_WIDTH);
    const i = Math.max(0, Math.min(index, DAY_NAMES.length - 1));
    if (DAY_NAMES[i] !== selectedDay) setSelectedDay(DAY_NAMES[i]);
  };

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
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Schedule</Text>
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
                ref={tipsPagesScrollRef}
                horizontal
                pagingEnabled
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleTipsPageScroll}
                onScrollEndDrag={handleTipsPageScroll}
                style={styles.tipsScroll}
              >
                {[SCHEDULE_TIPS_PAGE1, SCHEDULE_TIPS_PAGE2].map((tips, pageIdx) => (
                  <View key={pageIdx} style={[styles.tipsPageWrap, { width }]}>
                    <ScrollView
                      style={styles.tipsPageScroll}
                      contentContainerStyle={[styles.tipsScrollContent, { paddingBottom: 24 + 60 }]}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.tipsCard}>
                        <Text style={styles.tipsTitle}>SCHEDULE TIP</Text>
                        <Text style={styles.tipsSubtitle}>{pageIdx === 0 ? 'LOW INTENSITY' : 'DAY-BY-DAY'}</Text>
                        {tips.map((tip, idx) => (
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
                  </View>
                ))}
              </ScrollView>
              <View style={styles.tipsPaginationWrap}>
                <View style={styles.tipPagination}>
                  <TouchableOpacity
                    onPress={() => scrollToTipsPage(1)}
                    style={[styles.tipPageDot, tipPage === 1 && styles.tipPageDotActive]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  />
                  <TouchableOpacity
                    onPress={() => scrollToTipsPage(2)}
                    style={[styles.tipPageDot, tipPage === 2 && styles.tipPageDotActive]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  />
                </View>
              </View>
              <View style={styles.tipsCloseWrap}>
                <TouchableOpacity style={styles.tipsCloseButton} onPress={closeTipsModal} activeOpacity={0.85}>
                  <Text style={styles.tipsCloseText}>CLOSE TIPS</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
          >
            {weekDates.map(({ date, dayName }, idx) => {
              const isSelected = dayName === selectedDay;
              return (
                <TouchableOpacity
                  key={dayName}
                  style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                  onPress={() => {
                    playClickSound();
                    scrollToDay(idx);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateChipDay, isSelected && styles.dateChipDaySelected]}>
                    {DAY_ABBREV[dayName]}
                  </Text>
                  <Text style={[styles.dateChipNum, isSelected && styles.dateChipNumSelected]}>
                    {formatDateShort(date)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            ref={cardsScrollRef}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleCardsScrollEnd}
            onScrollEndDrag={handleCardsScrollEnd}
            contentContainerStyle={styles.cardsScrollContent}
            style={styles.cardsScroll}
          >
            {weekDates.map(({ date, dayName }) => {
              const data = schedule[dayName];
              const fmt = data?.format ?? '';
              const showOtherInput = fmt === 'Other' || (fmt.length > 0 && PRESET_FORMAT_IDS.indexOf(fmt) === -1);
              return (
                <View key={dayName} style={[styles.card, styles.cardPage]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.dayIcon}>
                      <Ionicons name="sparkles" size={18} color="#FFD700" />
                    </View>
                    <View style={styles.dayTextWrap}>
                      <Text style={styles.dayName}>{dayName}</Text>
                      <Text style={styles.dayDate}>{formatDateLong(date)}</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionLabel}>CONTENT IDEA</Text>
                  <View style={styles.ideaBox}>
                    <TextInput
                      style={styles.ideaInput}
                      value={data?.idea ?? ''}
                      onChangeText={(v) => updateIdea(dayName, v)}
                      placeholder="e.g. The Midnight Library Chronicles: Chapter 4"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      multiline
                    />
                    <Ionicons name="pencil" size={16} color="rgba(255, 255, 255, 0.4)" style={styles.ideaPencil} />
                  </View>

                  <Text style={styles.sectionLabel}>PREFERRED FORMAT</Text>
                  <View style={styles.formatStack}>
                    {FORMAT_OPTIONS.map((opt) => {
                      const isOtherSelected = fmt === 'Other' || (fmt.length > 0 && PRESET_FORMAT_IDS.indexOf(fmt) === -1);
                      const isSelected = opt.id === 'Other' ? isOtherSelected : fmt === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.formatChip, isSelected && styles.formatChipSelected]}
                          onPress={() => {
                            playClickSound();
                            updateFormat(dayName, opt.id);
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={opt.icon as any}
                            size={20}
                            color={isSelected ? '#FFD700' : 'rgba(255,255,255,0.85)'}
                          />
                          <Text style={[styles.formatChipText, isSelected && styles.formatChipTextSelected]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {showOtherInput && (
                    <TextInput
                      style={styles.otherFormatInput}
                      value={fmt === 'Other' ? '' : fmt}
                      onChangeText={(v) => updateFormat(dayName, v.trim() ? v : 'Other')}
                      placeholder="Write your own format..."
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      autoCapitalize="words"
                    />
                  )}

                  <View style={styles.statusRow}>
                    <View style={styles.statusLeft}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Draft saved locally</Text>
                    </View>
                    <Text style={styles.statusRight}>
                      Modified {relativeTime(now - lastModified)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
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
    paddingVertical: 14,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
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
  helpButton: { padding: 8, zIndex: 1, marginLeft: 'auto' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  dateStrip: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    paddingVertical: 4,
  },
  dateChip: {
    minWidth: 64,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dateChipSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  dateChipDaySelected: { color: '#FFD700' },
  dateChipNum: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  dateChipNumSelected: { color: '#FFD700' },
  cardsScroll: { width: CARD_WIDTH, marginHorizontal: 0 },
  cardsScrollContent: { flexDirection: 'row' },
  cardPage: { width: CARD_WIDTH },
  card: {
    backgroundColor: 'rgba(60, 45, 90, 0.5)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dayIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(80, 60, 50, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dayTextWrap: {},
  dayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  dayDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  ideaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  ideaInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    paddingVertical: 4,
    maxHeight: 80,
  },
  ideaPencil: {
    marginLeft: 8,
  },
  formatStack: { gap: 10 },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  formatChipSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  formatChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formatChipTextSelected: { color: '#FFD700' },
  otherFormatInput: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  statusRight: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
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
  tipsPageWrap: { flex: 1 },
  tipsPageScroll: { flex: 1 },
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
  tipsPaginationWrap: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  tipPageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  tipPageDotActive: {
    backgroundColor: '#FFD700',
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
