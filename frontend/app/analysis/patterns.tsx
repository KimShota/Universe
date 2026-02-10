import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { UniverseBackground } from '../../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { playClickSound } from '../../utils/soundEffects';

const { width } = Dimensions.get('window');
const FORMAT_OPTIONS = ['Silent film / B-roll', 'Split Screen', 'Talking head', 'Other'];
const FORMAT_COLORS: Record<string, string> = {
  'Silent film / B-roll': '#6366f1',
  'Split Screen': '#22c55e',
  'Talking head': '#f59e0b',
  'Other': '#94a3b8',
};

type Creator = { id: string; name: string };
type EntryRow = { entry_id: string; creator_id: string; data: Record<string, unknown> };
type NormalizedEntry = { id: string; creator_id: string; format: string; duration: string; audio: string };

function parseDurationToSeconds(s: string): number {
  if (!s || !s.trim()) return 0;
  const num = parseInt(s.replace(/\D/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function durationBucket(sec: number): string {
  if (sec <= 0) return '—';
  if (sec < 30) return '<30s';
  if (sec <= 60) return '30–60s';
  return '>60s';
}

export default function AnalysisPatternsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [entries, setEntries] = useState<NormalizedEntry[]>([]);
  const [formatCounts, setFormatCounts] = useState<Record<string, number>>({});
  const [durationBuckets, setDurationBuckets] = useState<Record<string, number>>({});
  const [topAudio, setTopAudio] = useState<string[]>([]);
  const [heatmapRows, setHeatmapRows] = useState<{ creator: Creator; cells: NormalizedEntry[] }[]>([]);
  const [insightText, setInsightText] = useState('');
  const [savingInsight, setSavingInsight] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (!user?.id) return;
      const [creatorsRes, entriesRes, insightRes] = await Promise.all([
        supabase.from('analysis_creators').select('id, name').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('analysis_entries').select('entry_id, creator_id, data').eq('user_id', user.id),
        supabase.from('analysis_pattern_insight').select('insight_text').eq('user_id', user.id).maybeSingle(),
      ]);
      const creatorsList = (creatorsRes.data || []) as Creator[];
      const rows = (entriesRes.data || []) as EntryRow[];
      const normalized: NormalizedEntry[] = rows.map((r) => ({
        id: r.entry_id,
        creator_id: r.creator_id,
        format: (r.data?.format as string) || '',
        duration: (r.data?.duration as string) || '',
        audio: (r.data?.audio as string) || '',
      }));
      setCreators(creatorsList);
      setEntries(normalized);

      const formatCount: Record<string, number> = {};
      FORMAT_OPTIONS.forEach((f) => (formatCount[f] = 0));
      normalized.forEach((e) => {
        const key = FORMAT_OPTIONS.includes(e.format) ? e.format : 'Other';
        formatCount[key] = (formatCount[key] || 0) + 1;
      });
      setFormatCounts(formatCount);

      const durBuckets: Record<string, number> = { '—': 0, '<30s': 0, '30–60s': 0, '>60s': 0 };
      normalized.forEach((e) => {
        const sec = parseDurationToSeconds(e.duration);
        const label = durationBucket(sec);
        durBuckets[label] = (durBuckets[label] || 0) + 1;
      });
      setDurationBuckets(durBuckets);

      const audioCount: Record<string, number> = {};
      normalized.forEach((e) => {
        (e.audio || '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
          .forEach((a) => {
            audioCount[a] = (audioCount[a] || 0) + 1;
          });
      });
      const top = Object.entries(audioCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => k);
      setTopAudio(top);

      const creatorMap = new Map(creatorsList.map((c) => [c.id, c]));
      const byCreator = new Map<string, NormalizedEntry[]>();
      normalized.forEach((e) => {
        const list = byCreator.get(e.creator_id) || [];
        list.push(e);
        byCreator.set(e.creator_id, list);
      });
      const heatmap: { creator: Creator; cells: NormalizedEntry[] }[] = creatorsList
        .slice(0, 7)
        .map((creator) => ({
          creator,
          cells: (byCreator.get(creator.id) || []).slice(0, 7),
        }));
      setHeatmapRows(heatmap);

      const insightRow = insightRes.data as { insight_text: string } | null;
      setInsightText(insightRow?.insight_text ?? '');
    } catch (e) {
      console.error('Error loading pattern data:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const saveInsight = useCallback(async (text: string) => {
    if (!user?.id) return;
    setSavingInsight(true);
    try {
      await supabase.from('analysis_pattern_insight').upsert(
        { user_id: user.id, insight_text: text, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    } catch (e) {
      console.error('Error saving pattern insight:', e);
    } finally {
      setSavingInsight(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const maxFormatCount = Math.max(1, ...Object.values(formatCounts));
  const maxDurCount = Math.max(1, ...Object.values(durationBuckets));

  if (loading) {
    return (
      <UniverseBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { playClickSound(); router.back(); }} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Patterns</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading analyses…</Text>
          </View>
        </SafeAreaView>
      </UniverseBackground>
    );
  }

  const total = entries.length;
  const mostCommonFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0];
  const avgDurationSec = total > 0
    ? entries.reduce((s, e) => s + parseDurationToSeconds(e.duration), 0) / total
    : 0;
  const avgDurationStr = avgDurationSec >= 60 ? `${Math.round(avgDurationSec / 60)}m` : `${Math.round(avgDurationSec)}s`;

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { playClickSound(); router.back(); }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Patterns</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionLabel}>Across {total} video{total !== 1 ? 's' : ''}</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              Most common format: <Text style={styles.summaryHighlight}>{mostCommonFormat?.[0] || '—'}</Text>
              {mostCommonFormat?.[1] ? ` (${mostCommonFormat[1]})` : ''}
            </Text>
            <Text style={styles.summaryText}>Avg duration: <Text style={styles.summaryHighlight}>{avgDurationStr}</Text></Text>
            {topAudio.length > 0 && (
              <Text style={styles.summaryText}>Top audio: <Text style={styles.summaryHighlight}>{topAudio.join(', ')}</Text></Text>
            )}
          </View>

          <Text style={styles.sectionLabel}>Format distribution</Text>
          <View style={styles.chartCard}>
            {FORMAT_OPTIONS.map((format) => {
              const count = formatCounts[format] ?? 0;
              const pct = maxFormatCount ? (count / maxFormatCount) * 100 : 0;
              return (
                <View key={format} style={styles.barRow}>
                  <Text style={styles.barLabel} numberOfLines={1}>{format}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${pct}%`, backgroundColor: FORMAT_COLORS[format] || FORMAT_COLORS['Other'] },
                      ]}
                    />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Duration</Text>
          <View style={styles.chartCard}>
            {['<30s', '30–60s', '>60s'].map((label) => {
              const count = durationBuckets[label] ?? 0;
              const pct = maxDurCount ? (count / maxDurCount) * 100 : 0;
              return (
                <View key={label} style={styles.barRow}>
                  <Text style={styles.barLabel}>{label}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: '#8b5cf6' }]} />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Format by creator (7×7)</Text>
          <View style={styles.heatmapCard}>
            <View style={styles.heatmapGrid}>
              {heatmapRows.map((row, ri) => (
                <View key={row.creator.id} style={styles.heatmapRow}>
                  <Text style={styles.heatmapRowLabel} numberOfLines={1}>{row.creator.name}</Text>
                  <View style={styles.heatmapCells}>
                    {[0, 1, 2, 3, 4, 5, 6].map((ci) => {
                      const cell = row.cells[ci];
                      const format = cell?.format && FORMAT_OPTIONS.includes(cell.format) ? cell.format : 'Other';
                      const color = FORMAT_COLORS[format] || FORMAT_COLORS['Other'];
                      return (
                        <View
                          key={ci}
                          style={[styles.heatmapCell, { backgroundColor: cell ? color : 'rgba(255,255,255,0.06)' }]}
                        />
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.legend}>
              {FORMAT_OPTIONS.map((f) => (
                <View key={f} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: FORMAT_COLORS[f] || FORMAT_COLORS['Other'] }]} />
                  <Text style={styles.legendText} numberOfLines={1}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Your pattern finding</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightQuestion}>What common pattern did you find across {total} video{total !== 1 ? 's' : ''}?</Text>
            <TextInput
              style={styles.insightInput}
              placeholder="Write your answer here…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={insightText}
              onChangeText={setInsightText}
              onBlur={() => saveInsight(insightText)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!savingInsight}
            />
            {savingInsight && <Text style={styles.insightSaving}>Saving…</Text>}
          </View>

          <View style={styles.footer} />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { padding: 8 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFD700', textAlign: 'center' },
  headerSpacer: { width: 44 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 215, 0, 0.9)',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    gap: 8,
  },
  summaryText: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  summaryHighlight: { color: '#FFD700', fontWeight: '600' },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    gap: 12,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 100, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  barTrack: { flex: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barCount: { width: 28, fontSize: 12, color: '#FFD700', textAlign: 'right' },
  heatmapCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  heatmapGrid: { gap: 8 },
  heatmapRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heatmapRowLabel: { width: 72, fontSize: 10, color: 'rgba(255,255,255,0.8)', numberOfLines: 1 },
  heatmapCells: { flex: 1, flexDirection: 'row', gap: 4 },
  heatmapCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 4,
    maxWidth: 32,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', maxWidth: 90 },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    gap: 10,
  },
  insightQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  insightInput: {
    minHeight: 100,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    fontSize: 14,
    color: '#fff',
  },
  insightSaving: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  footer: { height: 24 },
});
