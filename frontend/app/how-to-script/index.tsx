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

const HOW_TO_SCRIPT_OPTIONS = [
  {
    id: 'think-before-script',
    title: 'How to think before you script',
    icon: 'bulb-outline',
  },
  {
    id: 'universe-scripting-system',
    title: 'How to use the universe scripting system',
    icon: 'document-text-outline',
  },
];

export default function HowToScriptScreen() {
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
          <Text style={styles.title}>How to Script</Text>
          <Text style={styles.subtitle}>Craft scripts that capture and keep attention</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {HOW_TO_SCRIPT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => {
                playClickSound();
                router.push(`/how-to-script/${option.id}`);
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
