import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { UniverseBackground } from '../../components/UniverseBackground';
import { SOS_ISSUES } from '../../constants/content';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SOSScreen() {
  const router = useRouter();

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.starCharacter}>⭐</Text>
          <Text style={styles.title}>SOS</Text>
          <Text style={styles.subtitle}>What's troubling you?</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          {SOS_ISSUES.map((issue) => (
            <TouchableOpacity
              key={issue.id}
              style={styles.sosButton}
              onPress={() => router.push(`/sos/${issue.id}`)}
            >
              <Text style={styles.sosButtonText}>{issue.title}</Text>
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
    paddingTop: 16,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
  },
  starCharacter: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  sosButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});