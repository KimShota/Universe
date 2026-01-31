import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { UniverseBackground } from '../../components/UniverseBackground';
import { useRouter } from 'expo-router';

const POLARBEAR = require('../../Media/polarbear1.png');
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../../utils/soundEffects';

const HOW_TO_EDIT_OPTIONS = [
  { id: 'tools-and-softwares', title: 'Tools and Softwares' },
  { id: 'how-to-use-capcut', title: 'How to Use Capcut' },
  { id: 'how-to-use-davinci-resolve', title: 'How to Use Davinci Resolve' },
  { id: 'how-to-optimize-filming', title: 'How to Optimize Filming' },
  { id: 'batch-editing-tips', title: 'Batch Editing Tips' },
];

export default function HowToEditScreen() {
  const router = useRouter();

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
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <Image source={POLARBEAR} style={styles.polarbearImage} resizeMode="contain" />
          <Text style={styles.title}>How to Edit & Film</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.buttonsContainer}
          showsVerticalScrollIndicator={false}
        >
          {HOW_TO_EDIT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionButton}
              onPress={() => {
                playClickSound();
                router.push(`/how-to-edit/${option.id}`);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.optionButtonText}>{option.title}</Text>
              <Ionicons
                name="chevron-forward"
                size={24}
                color="rgba(255, 255, 255, 0.5)"
              />
            </TouchableOpacity>
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
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 24,
    zIndex: 1,
  },
  polarbearImage: {
    width: 56,
    height: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '600',
    flex: 1,
  },
});
