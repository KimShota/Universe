import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { UniverseBackground } from '../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { playClickSound } from '../utils/soundEffects';

const STORAGE_KEY = (userId: string) => `ethos_brainstorm:${userId}`;

const FIELDS = [
  { key: 'audienceImpact' as const, label: 'What do you want your audience to learn, feel, or achieve by following you?', placeholder: 'Your answer...' },
  { key: 'personalExperiences' as const, label: 'What personal experiences shaped your core belief about life?', placeholder: 'Your answer...' },
  { key: 'whatOthersSay' as const, label: 'What do your friends or family say about you?', placeholder: 'Your answer...' },
  { key: 'yourEthos' as const, label: 'Your Ethos:', placeholder: 'Summarize your message to the world...' },
] as const;

type EthosData = Record<(typeof FIELDS)[number]['key'], string>;

const defaultData: EthosData = {
  audienceImpact: '',
  personalExperiences: '',
  whatOthersSay: '',
  yourEthos: '',
};

export default function EthosBrainstormScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<EthosData>(defaultData);

  const load = useCallback(async () => {
    try {
      const key = user?.id ? STORAGE_KEY(user.id) : 'ethos_brainstorm:guest';
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<EthosData>;
        setData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error('Error loading ethos brainstorm:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (next: EthosData) => {
    const key = user?.id ? STORAGE_KEY(user.id) : 'ethos_brainstorm:guest';
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }, [user?.id]);

  const update = (key: keyof EthosData, value: string) => {
    const next = { ...data, [key]: value };
    setData(next);
    save(next);
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
          <Text style={styles.title}>Your Ethos Brainstorm</Text>
          <View style={styles.headerSpacer} />
        </View>
        <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.intro}>
              Answer these questions to clarify your message. Your answers can feed into &quot;Your Ethos&quot; in Creator Universe.
            </Text>
            {FIELDS.map(({ key, label, placeholder }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={[styles.input, key === 'yourEthos' && styles.inputEthos]}
                  value={data[key]}
                  onChangeText={(v) => update(key, v)}
                  placeholder={placeholder}
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            ))}
            <TouchableOpacity
              style={styles.backToUniverse}
              onPress={() => {
                playClickSound();
                router.back();
              }}
            >
              <Ionicons name="compass-outline" size={20} color="#FFD700" />
              <Text style={styles.backToUniverseText}>Back to Creator Universe</Text>
            </TouchableOpacity>
            <View style={styles.footer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  intro: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    marginBottom: 24,
  },
  field: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 215, 0, 0.95)',
    marginBottom: 8,
    lineHeight: 20,
  },
  input: {
    minHeight: 88,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    fontSize: 14,
    color: '#fff',
  },
  inputEthos: {
    minHeight: 100,
  },
  backToUniverse: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  backToUniverseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
  },
  footer: { height: 24 },
});
