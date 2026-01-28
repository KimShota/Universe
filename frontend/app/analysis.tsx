import React, { useState, useEffect } from 'react';
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

interface AnalysisEntry {
  id: string;
  title?: string;
  reelLink: string;
  views: string;
  hook: string;
  format: string;
  duration: string;
  pacing: string;
  audio: string;
  storyArc: string;
  notes: string;
  date?: string;
}

const FORMAT_OPTIONS = ['Silent film / B-roll', 'Split Screen', 'Talking head', 'Other'];
const AUDIO_OPTIONS = ['Mix', 'Voice over', 'Trending sounds', 'Dialogue + BG music'];

function parseAudioSet(s: string): Set<string> {
  if (!s || !s.trim()) return new Set();
  return new Set(s.split(',').map((x) => x.trim()).filter(Boolean));
}

function serializeAudioSet(set: Set<string>): string {
  return Array.from(set).join(', ');
}

export default function AnalysisScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<AnalysisEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showEntryDetail, setShowEntryDetail] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/analysis/entries`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.entries && data.entries.length > 0) {
          const normalized = data.entries.map((e: AnalysisEntry) => ({
            ...e,
            storyArc: e.storyArc ?? '',
            pacing: e.pacing ?? '',
          }));
          setEntries(normalized);
        }
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const saveEntry = async (entry: AnalysisEntry) => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      await fetch(`${BACKEND_URL}/api/analysis/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ entry }),
      });
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const handleAddNew = async () => {
    playClickSound();
    const newEntry: AnalysisEntry = {
      id: Date.now().toString(),
      title: '',
      reelLink: '',
      views: '',
      hook: '',
      format: '',
      duration: '',
      pacing: '',
      audio: '',
      storyArc: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    };
    const newEntries = [...entries, newEntry];
    setEntries(newEntries);
    await saveEntry(newEntry);
  };

  const handleEntryPress = (entryId: string) => {
    playClickSound();
    setSelectedEntryId(entryId);
    setShowEntryDetail(true);
  };

  const handleBackToList = () => {
    playClickSound();
    setShowEntryDetail(false);
    setSelectedEntryId(null);
    loadEntries();
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!entryId) return;
    playClickSound();
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/analysis/entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      
      if (response.ok) {
        setEntries(entries.filter(entry => entry.id !== entryId));
        if (selectedEntryId === entryId) {
          setShowEntryDetail(false);
          setSelectedEntryId(null);
        }
      } else {
        console.error('Error deleting entry:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const currentEntry = entries.find(e => e.id === selectedEntryId) || {
    id: '',
    title: '',
    reelLink: '',
    views: '',
    hook: '',
    format: '',
    duration: '',
    pacing: '',
    audio: '',
    storyArc: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  };

  const handleUpdateField = (field: keyof AnalysisEntry, value: string) => {
    if (!selectedEntryId) return;
    const updatedEntries = entries.map(entry => {
      if (entry.id === selectedEntryId) return { ...entry, [field]: value };
      return entry;
    });
    setEntries(updatedEntries);
    const updatedEntry = updatedEntries.find(e => e.id === selectedEntryId);
    if (updatedEntry) saveEntry(updatedEntry);
  };

  const toggleAudio = (opt: string) => {
    const set = parseAudioSet(currentEntry.audio ?? '');
    if (set.has(opt)) set.delete(opt);
    else set.add(opt);
    handleUpdateField('audio', serializeAudioSet(set));
  };

  const audioSet = parseAudioSet(currentEntry.audio ?? '');

  // Entry List View
  if (!showEntryDetail) {
    return (
      <UniverseBackground>
        <SafeAreaView style={styles.container}>
          {/* Header */}
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
              <Text style={styles.title}>Analysis Library</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.listContainer}
          >
            {entries.map((entry, index) => (
              <View
                key={entry.id || `entry-${index}`}
                style={styles.entryBoxContainer}
              >
                <View style={styles.entryBox}>
                  <TouchableOpacity
                    style={styles.entryBoxContent}
                    onPress={() => {
                      entry.id && handleEntryPress(entry.id);
                    }}
                    disabled={!entry.id}
                    activeOpacity={0.7}
                  >
                    <View style={styles.entryBoxTextContainer}>
                      <Text style={styles.entryBoxTitle}>
                        {entry.title || entry.reelLink || 'Untitled Analysis'}
                      </Text>
                      <Text style={styles.entryBoxDate}>
                        {entry.date || new Date().toISOString().split('T')[0]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      entry.id && handleDeleteEntry(entry.id);
                    }}
                    disabled={!entry.id}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Add Button */}
          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddNew}
            >
              <Ionicons name="add" size={32} color="#FFD700" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </UniverseBackground>
    );
  }

  // Entry Detail View - Card layout per screenshot
  const displayDate = currentEntry.date || new Date().toISOString().split('T')[0];

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{displayDate}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* METADATA */}
          <View style={styles.card}>
            <View style={styles.sectionTitle}>
              <View style={styles.sectionIcon}>
                <Ionicons name="information-circle" size={18} color="#FFD700" />
              </View>
              <Text style={styles.sectionLabel}>METADATA</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>TITLE</Text>
              <TextInput
                style={styles.input}
                value={currentEntry.title || ''}
                onChangeText={(t) => handleUpdateField('title', t)}
                placeholder="Enter analysis title..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.field, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>VIEWS</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.inputFlex}
                    value={currentEntry.views}
                    onChangeText={(t) => handleUpdateField('views', t)}
                    placeholder="21M"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  />
                  <Ionicons name="eye-outline" size={18} color="rgba(255,255,255,0.5)" />
                </View>
              </View>
              <View style={[styles.field, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>DURATION</Text>
                <TextInput
                  style={styles.input}
                  value={currentEntry.duration}
                  onChangeText={(t) => handleUpdateField('duration', t)}
                  placeholder="45s"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>REEL LINK</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="link" size={18} color="#FFD700" style={styles.inputIconLeft} />
                <TextInput
                  style={styles.inputFlex}
                  value={currentEntry.reelLink}
                  onChangeText={(t) => handleUpdateField('reelLink', t)}
                  placeholder="https://www.instagram.com/reel/."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                />
              </View>
            </View>
          </View>

          {/* CONTENT HOOK */}
          <View style={styles.card}>
            <View style={styles.sectionTitle}>
              <View style={styles.sectionIcon}>
                <Ionicons name="sparkles" size={18} color="#FFD700" />
              </View>
              <Text style={styles.sectionLabel}>CONTENT HOOK</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>THE HOOK</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={currentEntry.hook}
                onChangeText={(t) => handleUpdateField('hook', t)}
                placeholder="Describe the visual hook..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>FORMAT</Text>
              <View style={styles.chipRow}>
                {FORMAT_OPTIONS.map((opt) => {
                  const sel = currentEntry.format === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() => { playClickSound(); handleUpdateField('format', opt); }}
                    >
                      <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* AUDIO & PACING */}
          <View style={styles.card}>
            <View style={styles.sectionTitle}>
              <View style={styles.sectionIcon}>
                <Ionicons name="musical-notes" size={18} color="#FFD700" />
              </View>
              <Text style={styles.sectionLabel}>AUDIO & PACING</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>AUDIO COMPONENTS</Text>
              <View style={styles.chipRow}>
                {AUDIO_OPTIONS.map((opt) => {
                  const sel = audioSet.has(opt);
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() => { playClickSound(); toggleAudio(opt); }}
                    >
                      <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>PACING NOTES</Text>
              <TextInput
                style={styles.input}
                value={currentEntry.pacing ?? ''}
                onChangeText={(t) => handleUpdateField('pacing', t)}
                placeholder="Pacing slow in scenes where there is"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>STORY ARC</Text>
              <TextInput
                style={styles.input}
                value={currentEntry.storyArc ?? ''}
                onChangeText={(t) => handleUpdateField('storyArc', t)}
                placeholder="Problem → pursuit → payoff..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
          </View>

          {/* ADDITIONAL NOTES */}
          <View style={styles.card}>
            <View style={styles.sectionTitle}>
              <View style={styles.sectionIcon}>
                <Ionicons name="list" size={18} color="#FFD700" />
              </View>
              <Text style={styles.sectionLabel}>ADDITIONAL NOTES</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={currentEntry.notes}
              onChangeText={(t) => handleUpdateField('notes', t)}
              placeholder="Extra observations..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
            />
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
  scrollView: { flex: 1 },
  listContainer: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  entryBoxContainer: { width: '100%' },
  entryBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryBoxContent: { flex: 1 },
  entryBoxTextContainer: { flex: 1 },
  entryBoxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  entryBoxDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  deleteButton: {
    padding: 10,
    marginLeft: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  addButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 3,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(60, 45, 90, 0.5)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1,
  },
  field: {
    marginBottom: 16,
  },
  fieldHalf: { flex: 1 },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputFlex: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    padding: 0,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputIconLeft: {
    marginRight: 10,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(60, 45, 90, 0.8)',
  },
  chipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
