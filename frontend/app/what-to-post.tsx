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
import { UniverseBackground } from '../components/UniverseBackground';
import { useRouter } from 'expo-router';

const POLARBEAR = require('../Media/polarbear1.png');
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../utils/soundEffects';

const WHAT_TO_POST_OPTIONS = [
  {
    id: 'define-your-creator-universe',
    title: 'Define Your Creator Universe',
    icon: 'create-outline',
  },
  {
    id: 'use-your-creator-universe',
    title: 'Use Your Creator Universe',
    icon: 'telescope-outline',
  },
  {
    id: 'what-types-of-content',
    title: 'What Types of Content to Post',
    icon: 'list-outline',
  },
  {
    id: 'repurpose-one-video-seven-ways',
    title: 'How to Repurpose One Video to Create 7 Different Videos',
    icon: 'copy-outline',
  },
];

export default function WhatToPostScreen() {
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
          <Text style={styles.title}>What to Post</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {WHAT_TO_POST_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionButton}
              onPress={() => {
                playClickSound();
                router.push(`/what-to-post/${option.id}`);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name={option.icon as any} size={28} color="#FFD700" />
              <Text style={styles.optionButtonText}>{option.title}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
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
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 24,
    zIndex: 1,
  },
  polarbearImage: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
});
