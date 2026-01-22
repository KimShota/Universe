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
  audio: string;
  notes: string;
  date?: string;
}

const FORMAT_OPTIONS = ['Silent film / B-roll', 'Split Screen', 'Talking head', 'Other'];
const FIELD_LABELS = ['Reel Link', 'Views', 'Hook', 'Format', 'Duration', 'Audio', 'Notes'];

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
          setEntries(data.entries);
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
      audio: '',
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

  const handleUpdateField = (field: keyof AnalysisEntry, value: string) => {
    if (!selectedEntryId) return;
    
    const updatedEntries = entries.map(entry => {
      if (entry.id === selectedEntryId) {
        return { ...entry, [field]: value };
      }
      return entry;
    });
    setEntries(updatedEntries);
    
    const updatedEntry = updatedEntries.find(e => e.id === selectedEntryId);
    if (updatedEntry) {
      saveEntry(updatedEntry);
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
    audio: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  };

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
              <Ionicons name="arrow-back" size={28} color="#FFD700" />
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

  // Entry Detail View - Vertical Table
  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackToList}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {currentEntry.title || currentEntry.reelLink || currentEntry.date || 'Analysis'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Title */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={currentEntry.title || ''}
              onChangeText={(text) => handleUpdateField('title', text)}
              placeholder="Enter analysis title..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
            />
          </View>

          {/* Reel Link */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Reel Link</Text>
            <TextInput
              style={styles.input}
              value={currentEntry.reelLink}
              onChangeText={(text) => handleUpdateField('reelLink', text)}
              placeholder="https://www.instagram.com/reel/..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
            />
          </View>

          {/* Views */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Views</Text>
            <TextInput
              style={styles.input}
              value={currentEntry.views}
              onChangeText={(text) => handleUpdateField('views', text)}
              placeholder="21M"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              keyboardType="default"
            />
          </View>

          {/* Hook */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Hook</Text>
            <TextInput
              style={styles.input}
              value={currentEntry.hook}
              onChangeText={(text) => handleUpdateField('hook', text)}
              placeholder="Visual hook: ..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
            />
          </View>

          {/* Format */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Format</Text>
            <View style={styles.formatContainer}>
              {FORMAT_OPTIONS.map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.formatOption,
                    currentEntry.format === format && styles.formatOptionSelected,
                    format === 'Silent film / B-roll' && currentEntry.format === format && styles.formatOrange,
                    format === 'Split Screen' && currentEntry.format === format && styles.formatPurple,
                    format === 'Talking head' && currentEntry.format === format && styles.formatYellow,
                  ]}
                  onPress={() => handleUpdateField('format', format)}
                >
                  <Text
                    style={[
                      styles.formatText,
                      currentEntry.format === format && styles.formatTextSelected,
                    ]}
                  >
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Duration</Text>
            <TextInput
              style={styles.input}
              value={currentEntry.duration}
              onChangeText={(text) => handleUpdateField('duration', text)}
              placeholder="45s"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              keyboardType="default"
            />
          </View>

          {/* Audio */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Audio</Text>
            <TextInput
              style={styles.input}
              value={currentEntry.audio}
              onChangeText={(text) => handleUpdateField('audio', text)}
              placeholder="skyfall"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
            />
          </View>

          {/* Notes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.input}
              value={currentEntry.notes}
              onChangeText={(text) => handleUpdateField('notes', text)}
              placeholder="Notes..."
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  backButton: {
    padding: 8,
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
    fontWeight: '600',
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  entryBoxContainer: {
    width: '100%',
  },
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
  entryBoxContent: {
    flex: 1,
  },
  entryBoxTextContainer: {
    flex: 1,
  },
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
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    textAlignVertical: 'top',
  },
  formatContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formatOptionSelected: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  formatOrange: {
    backgroundColor: 'rgba(255, 165, 0, 0.3)',
  },
  formatPurple: {
    backgroundColor: 'rgba(147, 51, 234, 0.3)',
  },
  formatYellow: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  formatText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  formatTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
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
});
