import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { UniverseBackground } from '../../../components/UniverseBackground';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../../../utils/soundEffects';

const UNDERSTANDING_AUDIENCE_OPTIONS = [
  {
    id: 'what-it-means',
    title: 'What "understanding your audience" actually means',
  },
  {
    id: 'how-to-understand',
    title: 'How to understand your audience',
  },
];

export default function UnderstandingAudienceScreen() {
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
          <Text style={styles.title}>Understanding Your Audience</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.buttonsContainer}
          showsVerticalScrollIndicator={false}
        >
          {UNDERSTANDING_AUDIENCE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionButton}
              onPress={() => {
                playClickSound();
                router.push(
                  `/better-content/understanding-your-audience/${option.id}`
                );
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
