import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { UniverseBackground } from '../../components/UniverseBackground';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../../utils/soundEffects';

// New SOS issues matching the requirements
const SOS_OPTIONS = [
  {
    id: 'reactions',
    title: "I'm scared of what other people will think",
  },
  {
    id: 'hate',
    title: 'Hate comments hurt',
  },
  {
    id: 'stuck',
    title: 'Nothing seems to work',
  },
  {
    id: 'tired',
    title: "I have no energy to post",
  },
];

export default function SOSScreen() {
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
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={28} color="#FFD700" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.question}>How are you feeling?</Text>
          
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.buttonsContainer}
            showsVerticalScrollIndicator={false}
          >
            {SOS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.sosButton}
                onPress={() => {
                  playClickSound();
                  router.push(`/sos/${option.id}`);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sosButtonText}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    zIndex: 1,
  },
  helpButton: {
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  question: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 36,
  },
  scrollView: {
    flex: 1,
  },
  buttonsContainer: {
    paddingBottom: 40,
    gap: 16,
  },
  sosButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 26,
  },
});