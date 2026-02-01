import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { UniverseBackground } from '../components/UniverseBackground';
import { useRouter } from 'expo-router';
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
          <Text style={styles.title}>What to Post</Text>
          <Text style={styles.subtitle}>Plan and diversify your content</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {WHAT_TO_POST_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => {
                playClickSound();
                router.push(`/what-to-post/${option.id}`);
              }}
              activeOpacity={0.85}
            >
              <View style={styles.optionIconWrap}>
                <Ionicons name={option.icon as any} size={24} color="#FFD700" />
              </View>
              <Text style={styles.optionCardTitle}>{option.title}</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="rgba(255, 215, 0, 0.5)"
                style={styles.optionChevron}
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionCardTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionChevron: {
    marginLeft: 8,
  },
});
