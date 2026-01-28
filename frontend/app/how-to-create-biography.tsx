import React, { useState } from 'react';
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

function flowBulletMatch(line: string): boolean {
  const t = line.trim();
  return t.startsWith('•') || t.startsWith('–');
}

function flowBulletText(line: string): string {
  const t = line.trim();
  if (t.startsWith('•') || t.startsWith('–')) return t.slice(1).trim();
  return t;
}

const BIO_FLOW_SCREENS: Array<{
  id: number;
  shortTitle: string;
  icon: string;
  content: string;
}> = [
  {
    id: 1,
    shortTitle: 'The Perfect Bio',
    icon: 'document-text-outline',
    content: `The first line of your bio should tell new viewers how you can help them.

The second line should tell them why they should trust you.

The third line should contain your email address so brands or collaborators can reach you.

The fourth line should be a call to action to an easy next step like:

• Lead magnet
• Low ticket product
• Book a call page`,
  },
  {
    id: 2,
    shortTitle: 'One Link Only',
    icon: 'link-outline',
    content: `Remove Linktree and opt for a single link.

Why?

• Reduces decision fatigue
• One clear next step
• Stronger conversion

Point your bio link to one destination — your lead magnet, product, or booking page.`,
  },
  {
    id: 3,
    shortTitle: 'Profile Photo',
    icon: 'camera-outline',
    content: `Your profile photo should:

• Clearly show your face
• Be direct to camera
• Be well lit

Viewers connect with people. A clear, confident photo builds trust.`,
  },
];

export default function HowToCreateBiographyScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const currentScreen = BIO_FLOW_SCREENS[step - 1];
  const isLastScreen = step === BIO_FLOW_SCREENS.length;

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.flowHeader}>
          <TouchableOpacity
            onPress={() => {
              playClickSound();
              router.back();
            }}
            style={styles.flowBackButton}
          >
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.stepCounterWrap} pointerEvents="box-none">
            <Text style={styles.stepCounter}>
              {step} / {BIO_FLOW_SCREENS.length}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.flowContainer}>
          <ScrollView
            style={styles.flowScrollView}
            contentContainerStyle={styles.flowContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.flowCard}>
              <View style={styles.flowCardIconWrap}>
                <Ionicons
                  name={currentScreen.icon as any}
                  size={36}
                  color="#FFD700"
                />
              </View>
              <Text style={styles.flowScreenTitle}>
                {currentScreen.shortTitle}
              </Text>
              <View style={styles.flowCardBody}>
                {currentScreen.content.split('\n\n').map((block, blockIdx) => {
                  const lines = block.trim().split('\n');
                  return (
                    <View key={blockIdx} style={styles.flowBlock}>
                      {lines.map((line, lineIdx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        const isBullet = flowBulletMatch(line);
                        const text = isBullet
                          ? flowBulletText(line)
                          : trimmed;
                        return (
                          <View
                            key={lineIdx}
                            style={[
                              styles.flowLineRow,
                              isBullet && styles.flowBulletRow,
                            ]}
                          >
                            {isBullet && (
                              <View style={styles.flowBullet} />
                            )}
                            <Text
                              style={[
                                styles.flowBodyText,
                                isBullet && styles.flowBulletText,
                              ]}
                            >
                              {text}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.flowButtonContainer}>
            {isLastScreen ? (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => {
                  playClickSound();
                  router.back();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>Done</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => {
                  playClickSound();
                  setStep(step + 1);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#0a0e27"
                  style={styles.continueIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  flowBackButton: { padding: 8, zIndex: 1 },
  stepCounterWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerSpacer: { width: 40 },
  flowContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  flowScrollView: { flex: 1 },
  flowContent: { paddingBottom: 28 },
  flowCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    overflow: 'hidden',
  },
  flowCardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.45)',
  },
  flowScreenTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 28,
  },
  flowCardBody: { gap: 4 },
  flowBlock: { marginBottom: 4 },
  flowLineRow: { marginBottom: 12 },
  flowBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  flowBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    marginRight: 10,
    marginTop: 10,
  },
  flowBodyText: {
    fontSize: 17,
    lineHeight: 28,
    color: '#FFFFFF',
    flex: 1,
  },
  flowBulletText: { flex: 1 },
  flowButtonContainer: { width: '100%', alignItems: 'center' },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 220,
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e27',
  },
  continueIcon: { marginLeft: 4 },
  doneButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    minWidth: 220,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
