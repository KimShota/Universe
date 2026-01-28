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
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { UniverseBackground } from '../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playClickSound } from '../utils/soundEffects';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Script {
  id: string;
  title?: string;
  mission: string;
  footageNeeded: string;
  textVisual: string;
  audio: string;
  caption: string;
  callToAction: string;
  date?: string;
}

const FIELDS: { key: keyof Script; label: string; icon: string; placeholder: string; multiline?: boolean }[] = [
  { key: 'title', label: 'TITLE', icon: 'create-outline', placeholder: 'Enter script title...' },
  { key: 'mission', label: 'MISSION', icon: 'rocket-outline', placeholder: 'What is the objective of this content?', multiline: true },
  { key: 'footageNeeded', label: 'FOOTAGE NEEDED', icon: 'videocam-outline', placeholder: 'Describe the B-roll and primary shots...', multiline: true },
  { key: 'textVisual', label: 'TEXT VISUAL', icon: 'document-text-outline', placeholder: 'On-screen text and graphics...', multiline: true },
  { key: 'audio', label: 'AUDIO', icon: 'mic-outline', placeholder: 'Voiceover, music, or SFX...', multiline: true },
  { key: 'caption', label: 'CAPTION', icon: 'chatbubble-outline', placeholder: 'Draft your social media caption...', multiline: true },
  { key: 'callToAction', label: 'CALL TO ACTION', icon: 'hand-left-outline', placeholder: 'What should viewers do next?', multiline: true },
];

export default function BatchingScreen() {
  const router = useRouter();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [showScriptDetail, setShowScriptDetail] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateDraft, setDateDraft] = useState('');

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/batching/scripts`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.scripts && data.scripts.length > 0) {
          setScripts(data.scripts);
        }
      }
    } catch (error) {
      console.error('Error loading scripts:', error);
    }
  };

  const saveScript = async (script: Script) => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      await fetch(`${BACKEND_URL}/api/batching/scripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ script }),
      });
    } catch (error) {
      console.error('Error saving script:', error);
    }
  };

  const handleAddNew = async () => {
    const newScript: Script = {
      id: Date.now().toString(),
      title: '',
      mission: '',
      footageNeeded: '',
      textVisual: '',
      audio: '',
      caption: '',
      callToAction: '',
      date: new Date().toISOString().split('T')[0],
    };
    const newScripts = [...scripts, newScript];
    setScripts(newScripts);
    await saveScript(newScript);
    // 自動リダイレクトを削除 - ユーザーが手動でスクリプトをタップするまでリストページに留まる
  };

  const handleScriptPress = (scriptId: string) => {
    setSelectedScriptId(scriptId);
    setShowScriptDetail(true);
  };

  const handleBackToList = () => {
    setShowScriptDetail(false);
    setSelectedScriptId(null);
    loadScripts(); // リストを更新
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!scriptId) return;
    playClickSound();
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/batching/scripts/${scriptId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        setScripts(scripts.filter(script => script.id !== scriptId));
        if (selectedScriptId === scriptId) {
          setShowScriptDetail(false);
          setSelectedScriptId(null);
        }
      } else {
        console.error('Error deleting script:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting script:', error);
    }
  };

  const showMoreMenu = () => {
    playClickSound();
    Alert.alert(
      'Script',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete script',
          style: 'destructive',
          onPress: () => {
            if (selectedScriptId) handleDeleteScript(selectedScriptId);
          },
        },
      ]
    );
  };

  const handleUpdateField = (field: keyof Script, value: string) => {
    if (!selectedScriptId) return;
    
    const updatedScripts = scripts.map(script => {
      if (script.id === selectedScriptId) {
        return { ...script, [field]: value };
      }
      return script;
    });
    setScripts(updatedScripts);
    
    const updatedScript = updatedScripts.find(s => s.id === selectedScriptId);
    if (updatedScript) {
      saveScript(updatedScript);
    }
  };

  const currentScript = scripts.find(s => s.id === selectedScriptId) || {
    id: '',
    title: '',
    mission: '',
    footageNeeded: '',
    textVisual: '',
    audio: '',
    caption: '',
    callToAction: '',
    date: new Date().toISOString().split('T')[0],
  };

  // Script List View
  if (!showScriptDetail) {
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
              style={styles.listBackButton}
            >
              <Ionicons name="arrow-back" size={22} color="#FFD700" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Batching</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.listContainer}
          >
            {scripts.map((script, index) => (
              <View
                key={script.id || `script-${index}`}
                style={styles.scriptBoxContainer}
              >
                <View style={styles.scriptBox}>
                  <TouchableOpacity
                    style={styles.scriptBoxContent}
                    onPress={() => {
                      playClickSound();
                      script.id && handleScriptPress(script.id);
                    }}
                    disabled={!script.id}
                    activeOpacity={0.7}
                  >
                    <View style={styles.scriptBoxTextContainer}>
                      <Text style={styles.scriptBoxTitle}>
                        {script.title || 'Untitled Script'}
                      </Text>
                      <Text style={styles.scriptBoxDate}>
                        {script.date || new Date().toISOString().split('T')[0]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      playClickSound();
                      script.id && handleDeleteScript(script.id);
                    }}
                    disabled={!script.id}
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
              onPress={() => {
                playClickSound();
                handleAddNew();
              }}
            >
              <Ionicons name="add" size={32} color="#FFD700" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </UniverseBackground>
    );
  }

  // Script Detail View – redesign per screenshot
  const displayDate = currentScript.date || new Date().toISOString().split('T')[0];

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => { playClickSound(); handleBackToList(); }} style={styles.detailBackButton}>
            <Ionicons name="arrow-back" size={22} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateBlock} onPress={() => { playClickSound(); setDateDraft(displayDate); setShowDateModal(true); }}>
            <Text style={styles.dateLabel}>PRODUCTION DATE</Text>
            <Text style={styles.dateValue}>{displayDate}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={showMoreMenu} style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#FFD700" />
          </TouchableOpacity>
        </View>

        <Modal visible={showDateModal} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowDateModal(false)}>
            <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Production date</Text>
              <TextInput
                style={styles.modalInput}
                value={dateDraft}
                onChangeText={setDateDraft}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoCapitalize="none"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDateModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSave}
                  onPress={() => {
                    playClickSound();
                    handleUpdateField('date', dateDraft.trim());
                    setShowDateModal(false);
                  }}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {FIELDS.map((f) => (
            <View key={f.key} style={styles.fieldBlock}>
              <View style={styles.fieldTitleRow}>
                <Ionicons name={f.icon as any} size={18} color="#FFD700" />
                <Text style={styles.fieldLabel}>{f.label}</Text>
              </View>
              <TextInput
                style={[styles.input, f.multiline && styles.inputMultiline]}
                value={(currentScript[f.key] as string) ?? ''}
                onChangeText={(t) => handleUpdateField(f.key, t)}
                placeholder={f.placeholder}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline={f.multiline}
              />
            </View>
          ))}
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
  listBackButton: {
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
  scriptBoxContainer: {
    width: '100%',
  },
  scriptBox: {
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
  scriptBoxContent: {
    flex: 1,
  },
  scriptBoxTextContainer: {
    flex: 1,
  },
  scriptBoxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  scriptBoxDate: {
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
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBlock: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.8,
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
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(60, 45, 90, 0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalSave: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0e27',
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
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  navButton: {
    padding: 4,
  },
  paginationText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
});

