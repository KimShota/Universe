import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { UniverseBackground } from '../components/UniverseBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { playClickSound } from '../utils/soundEffects';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
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
  const [schedule, setSchedule] = useState<ScheduleData>(() =>
    Object.fromEntries(DAY_NAMES.map((d) => [d, { idea: '', format: '' }]))
  );
  const [selectedDay, setSelectedDay] = useState<(typeof DAY_NAMES)[number]>('Monday');
  const [lastModified, setLastModified] = useState<number>(() => Date.now());
  const [, setLastSaved] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());

  const weekDates = useMemo(getWeekDates, []);

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
      }
    } catch (e) {
      console.error('Error loading schedule:', e);
    }
  };

  const saveSchedule = async () => {
    playClickSound();
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const res = await fetch(`${BACKEND_URL}/api/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ schedule }),
      });
      if (res.ok) {
        setLastSaved(Date.now());
      }
    } catch (e) {
      console.error('Error saving schedule:', e);
    }
  };

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

  const selectedEntry = weekDates.find((w) => w.dayName === selectedDay);
  const selectedData = schedule[selectedDay];

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
        </View>

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
            {weekDates.map(({ date, dayName }) => {
              const isSelected = dayName === selectedDay;
              return (
                <TouchableOpacity
                  key={dayName}
                  style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                  onPress={() => {
                    playClickSound();
                    setSelectedDay(dayName);
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

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.dayIcon}>
                <Ionicons name="sparkles" size={18} color="#FFD700" />
              </View>
              <View style={styles.dayTextWrap}>
                <Text style={styles.dayName}>{selectedDay}</Text>
                <Text style={styles.dayDate}>
                  {selectedEntry ? formatDateLong(selectedEntry.date) : ''}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>CONTENT IDEA</Text>
            <View style={styles.ideaBox}>
              <TextInput
                style={styles.ideaInput}
                value={selectedData?.idea ?? ''}
                onChangeText={(v) => updateIdea(selectedDay, v)}
                onBlur={() => saveSchedule()}
                placeholder="e.g. The Midnight Library Chronicles: Chapter 4"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
              />
              <Ionicons name="pencil" size={16} color="rgba(255, 255, 255, 0.4)" style={styles.ideaPencil} />
            </View>

            <Text style={styles.sectionLabel}>PREFERRED FORMAT</Text>
            <View style={styles.formatStack}>
              {FORMAT_OPTIONS.map((opt) => {
                const fmt = selectedData?.format ?? '';
                const isOtherSelected = fmt === 'Other' || (fmt.length > 0 && PRESET_FORMAT_IDS.indexOf(fmt) === -1);
                const isSelected = opt.id === 'Other' ? isOtherSelected : fmt === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.formatChip, isSelected && styles.formatChipSelected]}
                    onPress={() => {
                      playClickSound();
                      updateFormat(selectedDay, opt.id);
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
            {(() => {
              const fmt = selectedData?.format ?? '';
              const showOtherInput = fmt === 'Other' || (fmt.length > 0 && PRESET_FORMAT_IDS.indexOf(fmt) === -1);
              if (!showOtherInput) return null;
              return (
                <TextInput
                  style={styles.otherFormatInput}
                  value={fmt === 'Other' ? '' : fmt}
                  onChangeText={(v) => updateFormat(selectedDay, v.trim() ? v : 'Other')}
                  onBlur={() => saveSchedule()}
                  placeholder="Write your own format..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  autoCapitalize="words"
                />
              );
            })()}

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
});
