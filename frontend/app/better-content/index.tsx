import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { UniverseBackground } from '../../components/UniverseBackground';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../../utils/soundEffects';

const BETTER_CONTENT_OPTIONS = [
  { id: 'use-hooks', title: 'Use Hooks' },
  { id: 'study-creators-7x7', title: 'Study Creators Objectively (7×7)' },
  { id: 'understanding-your-audience', title: 'Understanding Your Audience' },
  { id: 'analyzing-comments', title: 'Analyzing Comments' },
];

export default function BetterContentScreen() {
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
          <Text style={styles.starCharacter}>⭐</Text>
          <Text style={styles.title}>How to Make Better Content</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.buttonsContainer}
          showsVerticalScrollIndicator={false}
        >
          {BETTER_CONTENT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionButton}
              onPress={() => {
                playClickSound();
                router.push(`/better-content/${option.id}`);
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
  starCharacter: {
    fontSize: 48,
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
