import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UniverseBackground } from '../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { playClickSound } from '../utils/soundEffects';

export interface EffectiveFormat {
  id: string;
  format_name: string;
  format_description: string;
  effective_for: string;
  notes: string;
  created_at?: string;
}

const cardShadow = {
  shadowColor: '#FFD700',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 4,
};

export default function EffectiveFormatsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [formats, setFormats] = useState<EffectiveFormat[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftEffectiveFor, setDraftEffectiveFor] = useState('');
  const [draftNotes, setDraftNotes] = useState('');

  const loadFormats = useCallback(async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('effective_formats')
        .select('id, format_name, format_description, effective_for, notes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFormats((data ?? []) as EffectiveFormat[]);
    } catch (e) {
      console.error('Error loading effective formats:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  const openAdd = () => {
    playClickSound();
    setEditingId(null);
    setDraftName('');
    setDraftDescription('');
    setDraftEffectiveFor('');
    setDraftNotes('');
    setShowModal(true);
  };

  const openEdit = (item: EffectiveFormat) => {
    playClickSound();
    setEditingId(item.id);
    setDraftName(item.format_name);
    setDraftDescription(item.format_description ?? '');
    setDraftEffectiveFor(item.effective_for ?? '');
    setDraftNotes(item.notes ?? '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const saveFormat = async () => {
    const name = draftName.trim();
    const effectiveFor = draftEffectiveFor.trim();
    if (!name || !effectiveFor) {
      Alert.alert('Required', 'Format name and "Effective for" are required.');
      return;
    }
    try {
      if (!user?.id) return;
      if (editingId) {
        await supabase
          .from('effective_formats')
          .update({
            format_name: name,
            format_description: draftDescription.trim(),
            effective_for: effectiveFor,
            notes: draftNotes.trim(),
          })
          .eq('id', editingId)
          .eq('user_id', user.id);
      } else {
        await supabase.from('effective_formats').insert({
          user_id: user.id,
          format_name: name,
          format_description: draftDescription.trim(),
          effective_for: effectiveFor,
          notes: draftNotes.trim(),
        });
      }
      playClickSound();
      closeModal();
      loadFormats();
    } catch (e) {
      console.error('Error saving format:', e);
      Alert.alert('Error', 'Could not save. Try again.');
    }
  };

  const deleteFormat = (item: EffectiveFormat) => {
    playClickSound();
    Alert.alert(
      'Delete format',
      `Remove "${item.format_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) return;
              await supabase
                .from('effective_formats')
                .delete()
                .eq('id', item.id)
                .eq('user_id', user.id);
              loadFormats();
            } catch (e) {
              console.error('Error deleting format:', e);
            }
          },
        },
      ]
    );
  };

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { playClickSound(); router.back(); }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Effective Formats</Text>
          </View>
        </View>
        <View style={styles.subtitleWrap}>
          <Text style={styles.subtitle}>
            Store formats you found from analysis and note which content they work for.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, formats.length === 0 && styles.scrollContentEmpty]}
          showsVerticalScrollIndicator={false}
        >
          {formats.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="layers-outline" size={56} color="#FFD700" />
              </View>
              <Text style={styles.emptyTitle}>No formats yet</Text>
              <Text style={styles.emptyText}>
                Save formats from your analysis here.{'\n\n'}You'll know exactly what they are and which content they work for.
              </Text>
              <Text style={styles.emptyHint}>Tap the button below to add your first format.</Text>
            </View>
          )}
          {formats.map((item) => (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity style={styles.cardContent} onPress={() => openEdit(item)} activeOpacity={0.8}>
                <Text style={styles.cardTitle}>{item.format_name}</Text>
                <View style={styles.cardEffectiveRow}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#FFE066" style={styles.cardEffectiveIcon} />
                  <Text style={styles.cardEffectiveFor}>{item.effective_for || '—'}</Text>
                </View>
                {item.format_description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.format_description}</Text>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteFormat(item)}>
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.addContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.addButton} onPress={openAdd} activeOpacity={0.85}>
            <Ionicons name="add" size={26} color="#0a0e27" />
            <Text style={styles.addButtonText}>Add format</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showModal} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.modalOverlayWrap}>
            <Pressable style={styles.modalOverlay} onPress={closeModal} />
            <View style={styles.modalBoxWrap}>
              <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? 'Edit format' : 'Add format'}</Text>
                <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
                  <Ionicons name="close" size={24} color="#FFD700" />
                </TouchableOpacity>
              </View>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKav}>
                <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <Text style={[styles.fieldLabel, styles.fieldLabelFirst]}>Format name *</Text>
                  <TextInput
                    style={styles.input}
                    value={draftName}
                    onChangeText={setDraftName}
                    placeholder="e.g. Talking head + B-roll cutaways"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                  <Text style={styles.fieldLabel}>Effective for (which content) *</Text>
                  <TextInput
                    style={styles.input}
                    value={draftEffectiveFor}
                    onChangeText={setDraftEffectiveFor}
                    placeholder="e.g. Educational how-to, Product tips"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                  <Text style={styles.fieldLabel}>Format description (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    value={draftDescription}
                    onChangeText={setDraftDescription}
                    placeholder="What the format is: structure, length, hooks..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                  />
                  <Text style={styles.fieldLabel}>Notes (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    value={draftNotes}
                    onChangeText={setDraftNotes}
                    placeholder="Source reel, creator, or reminders"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                  />
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={saveFormat}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitleWrap: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 14 },
  scrollContentEmpty: { flexGrow: 1 },
  emptyCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    marginTop: 8,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    ...cardShadow,
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
  },
  cardEffectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardEffectiveIcon: {
    marginRight: 6,
  },
  cardEffectiveFor: {
    fontSize: 14,
    color: '#FFE066',
    flex: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  deleteBtn: {
    padding: 10,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 28,
    minWidth: 200,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0a0e27',
  },
  modalOverlayWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  modalBoxWrap: {
    width: '100%',
    maxWidth: 400,
    height: '85%',
    maxHeight: '85%',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  modalBox: {
    flex: 1,
    backgroundColor: '#1c1830',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 19, fontWeight: '700', color: '#FFD700' },
  modalClose: { padding: 4 },
  modalKav: { flex: 1, minHeight: 0 },
  modalScroll: { flex: 1, minHeight: 0 },
  modalScrollContent: { paddingBottom: 28, flexGrow: 1 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 215, 0, 0.95)',
    marginBottom: 8,
    marginTop: 18,
  },
  fieldLabelFirst: {
    marginTop: 0,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelButtonText: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' },
  saveButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#0a0e27' },
});
