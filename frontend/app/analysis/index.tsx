import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { UniverseBackground } from '../../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { playClickSound } from '../../utils/soundEffects';
import { MAX_ANALYSIS_CREATORS } from '../../constants/limits';

type Creator = { id: string; name: string; created_at?: string };

export default function AnalysisCreatorsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState('');
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});

  const loadCreators = useCallback(async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('analysis_creators')
        .select('id, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (!error && data) setCreators(data as Creator[]);
    } catch (e) {
      console.error('Error loading creators:', e);
    }
  }, [user?.id]);

  const loadEntryCounts = useCallback(async () => {
    try {
      if (!user?.id || creators.length === 0) return;
      const { data } = await supabase
        .from('analysis_entries')
        .select('creator_id')
        .eq('user_id', user.id);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: { creator_id: string }) => {
        counts[r.creator_id] = (counts[r.creator_id] || 0) + 1;
      });
      setEntryCounts(counts);
    } catch (e) {
      console.error('Error loading entry counts:', e);
    }
  }, [user?.id, creators.length]);

  useEffect(() => {
    loadCreators();
  }, [loadCreators]);

  useEffect(() => {
    loadEntryCounts();
  }, [loadEntryCounts]);

  const handleAddCreator = async () => {
    const name = (newCreatorName || 'New creator').trim();
    if (!name) return;
    if (creators.length >= MAX_ANALYSIS_CREATORS) {
      Alert.alert('Limit reached', `You can create up to ${MAX_ANALYSIS_CREATORS} creators.`);
      return;
    }
    playClickSound();
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('analysis_creators')
        .insert({ user_id: user.id, name })
        .select('id')
        .single();
      if (error) throw error;
      setShowAddModal(false);
      setNewCreatorName('');
      await loadCreators();
    } catch (e) {
      console.error('Error adding creator:', e);
      Alert.alert('Error', 'Could not create creator.');
    }
  };

  const openAddModal = () => {
    playClickSound();
    setNewCreatorName('');
    setShowAddModal(true);
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
            <Text style={styles.title}>Analysis</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              playClickSound();
              router.push('/analysis/patterns');
            }}
            style={styles.patternsButton}
          >
            <Ionicons name="grid-outline" size={22} color="#FFD700" />
            <Text style={styles.patternsButtonText}>Patterns</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Content creators to analyze</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.listContent}>
          {creators.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.creatorCard}
              onPress={() => {
                playClickSound();
                router.push(`/analysis/${c.id}`);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.creatorCardIcon}>
                <Ionicons name="person" size={24} color="#FFD700" />
              </View>
              <View style={styles.creatorCardText}>
                <Text style={styles.creatorName}>{c.name}</Text>
                <Text style={styles.creatorCount}>
                  {entryCounts[c.id] ?? 0} analysis {entryCounts[c.id] === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.addButtonWrap}>
          <TouchableOpacity
            style={[styles.addButton, creators.length >= MAX_ANALYSIS_CREATORS && styles.addButtonDisabled]}
            onPress={openAddModal}
            disabled={creators.length >= MAX_ANALYSIS_CREATORS}
          >
            <Ionicons name="add" size={28} color="#FFD700" />
            <Text style={styles.addButtonText}>Add creator</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={showAddModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>New content creator</Text>
            <TextInput
              style={styles.modalInput}
              value={newCreatorName}
              onChangeText={setNewCreatorName}
              placeholder="Creator name (e.g. @username)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddCreator}>
                <Text style={styles.modalSaveText}>Create</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  backButton: { padding: 8 },
  titleContainer: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#FFD700' },
  patternsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  patternsButtonText: { fontSize: 13, fontWeight: '600', color: '#FFD700' },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scroll: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 100 },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  creatorCardIcon: { marginRight: 14 },
  creatorCardText: { flex: 1 },
  creatorName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  creatorCount: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  addButtonWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#FFD700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: 'rgba(28,28,40,0.98)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFD700', marginBottom: 16 },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  modalSave: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'rgba(255,215,0,0.25)', borderRadius: 12 },
  modalSaveText: { color: '#FFD700', fontWeight: '600', fontSize: 16 },
});
