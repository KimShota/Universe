import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { UniverseBackground } from '../../components/UniverseBackground';
import { CONTENT_TIPS } from '../../constants/content';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../../utils/soundEffects';

const TIP_ICONS: Record<string, string> = {
  'what-to-post': 'layers-outline',
  'how-to-script': 'document-text-outline',
  'how-to-edit': 'videocam-outline',
  'better-content': 'trending-up-outline',
  'how-to-create-biography': 'person-outline',
};

export default function ContentTipsScreen() {
  const router = useRouter();

  const handleTipPress = (tipId: string) => {
    playClickSound();
    if (tipId === 'what-to-post') router.push('/what-to-post');
    else if (tipId === 'better-content') router.push('/better-content');
    else if (tipId === 'how-to-script') router.push('/how-to-script');
    else if (tipId === 'how-to-edit') router.push('/how-to-edit');
    else if (tipId === 'how-to-create-biography') router.push('/how-to-create-biography');
    else router.push(`/tip/${tipId}`);
  };

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              playClickSound();
              router.push('/(tabs)/main');
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.title}>Content Tips</Text>
          <Text style={styles.subtitle}>Learn how to create content that resonates</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {CONTENT_TIPS.map((tip) => (
            <TouchableOpacity
              key={tip.id}
              style={styles.tipCard}
              onPress={() => handleTipPress(tip.id)}
              activeOpacity={0.85}
            >
              <View style={styles.tipIconWrap}>
                <Ionicons
                  name={(TIP_ICONS[tip.id] || 'bulb-outline') as any}
                  size={24}
                  color="#FFD700"
                />
              </View>
              <Text style={styles.tipCardTitle}>{tip.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(255, 215, 0, 0.5)" style={styles.tipChevron} />
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
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  tipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tipCardTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  tipChevron: {
    marginLeft: 8,
  },
});