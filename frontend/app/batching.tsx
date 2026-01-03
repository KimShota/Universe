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
import { useRouter } from 'expo-router';
import { UniverseBackground } from '../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function BatchingScreen() {
  const router = useRouter();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [showScriptDetail, setShowScriptDetail] = useState(false);

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
    setSelectedScriptId(newScript.id);
    setShowScriptDetail(true);
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
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/batching/scripts/${scriptId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      
      if (response.ok) {
        // リストから削除
        setScripts(scripts.filter(script => script.id !== scriptId));
        // 削除されたスクリプトが選択されていた場合、詳細ビューを閉じる
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
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={28} color="#FFD700" />
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
                    onPress={() => handleScriptPress(script.id)}
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
                    onPress={() => handleDeleteScript(script.id)}
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

  // Script Detail View
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
              {currentScript.title || currentScript.date || 'Script Strategy'}
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
              value={currentScript.title || ''}
              onChangeText={(text) => handleUpdateField('title', text)}
              placeholder="Enter script title..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
            />
          </View>

          {/* Mission */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Mission</Text>
            <TextInput
              style={styles.input}
              value={currentScript.mission}
              onChangeText={(text) => handleUpdateField('mission', text)}
              placeholder="Enter your mission..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
            />
          </View>

          {/* Footage Needed */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Footage Needed</Text>
            <TextInput
              style={styles.input}
              value={currentScript.footageNeeded}
              onChangeText={(text) => handleUpdateField('footageNeeded', text)}
              placeholder="What footage do you need?"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
            />
          </View>

          {/* Text Visual */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Text Visual</Text>
            <TextInput
              style={styles.input}
              value={currentScript.textVisual}
              onChangeText={(text) => handleUpdateField('textVisual', text)}
              placeholder="Enter text for visuals..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
            />
          </View>

          {/* Audio */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Audio</Text>
            <TextInput
              style={styles.input}
              value={currentScript.audio}
              onChangeText={(text) => handleUpdateField('audio', text)}
              placeholder="Audio requirements..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
            />
          </View>

          {/* Caption */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Caption</Text>
            <TextInput
              style={styles.input}
              value={currentScript.caption}
              onChangeText={(text) => handleUpdateField('caption', text)}
              placeholder="Write your caption..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
            />
          </View>

          {/* Call to Action */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Call to Action</Text>
            <TextInput
              style={styles.input}
              value={currentScript.callToAction}
              onChangeText={(text) => handleUpdateField('callToAction', text)}
              placeholder="What action should viewers take?"
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

