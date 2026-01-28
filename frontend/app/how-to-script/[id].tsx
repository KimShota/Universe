import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { UniverseBackground } from '../../components/UniverseBackground';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../../utils/soundEffects';

function flowBulletMatch(line: string): boolean {
  const t = line.trim();
  return t.startsWith('•') || t.startsWith('–');
}

function flowBulletText(line: string): string {
  const t = line.trim();
  if (t.startsWith('•') || t.startsWith('–')) return t.slice(1).trim();
  return t;
}

const HOW_TO_SCRIPT_OPTIONS = [
  { id: 'think-before-script', title: 'How to think before you script', icon: 'bulb-outline' },
  { id: 'universe-scripting-system', title: 'How to use the universe scripting system', icon: 'document-text-outline' },
];

// 3-screen flow for "How to think before you script"
const THINK_BEFORE_SCRIPT_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'Screen 1 — What a Script Actually Is',
    shortTitle: 'What a Script Actually Is',
    icon: 'document-text-outline',
    content: `A script is not words. It's retention.

A good script is a retention plan, not a paragraph.

Teach this:

• The algorithm does not reward good openings alone
• It rewards continuous attention
• If any part gets boring → distribution dies

Universe Insight:

"Your script's job is to earn the next second, over and over."`,
    takeaway: 'Hook = entry. Script = why they stay.',
  },
  {
    id: 2,
    title: 'Screen 2 — How the Algorithm Reads Your Script',
    shortTitle: 'How the Algorithm Reads Your Script',
    icon: 'analytics-outline',
    content: `The algorithm reads behavior, not effort.

The algorithm watches:

• Did they stop scrolling?
• Did they stay?
• Did they rewatch?

Even with a strong first 3 seconds,
if the middle is boring → the video fails.

Retention checkpoints:

• 0–3s: curiosity
• 3–7s: pain recognition
• 7–15s: tension
• 15–25s: solution forming
• End: loop or rewatch trigger`,
  },
  {
    id: 3,
    title: 'Screen 3 — The Universal Script Flow',
    shortTitle: 'The Universal Script Flow',
    icon: 'git-branch-outline',
    content: `The only script flow you need.

• Hook → curiosity gap
• Agitate → make the pain felt
• Rehook → question / scene change
• Context → "here's what's happening"
• Build solution → clarity, not fluff
• Early end → force rewatch`,
    takeaway: 'Never end after the solution peaks. End at peak engagement.',
  },
];

// 6-screen flow for "How to use the universe scripting system" (Screens 4–9)
const UNIVERSE_SCRIPTING_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 4,
    title: 'Screen 4 — Mission (Your North Star)',
    shortTitle: 'Mission (Your North Star)',
    icon: 'compass-outline',
    content: `Matches field: Mission

What Mission actually means:

NOT "what the video is about"

BUT "what change should happen in the viewer"

Teach them to write Mission like this:

"After watching this, the viewer should ____."

Good Mission examples:

• "Stop overthinking posting"
• "Believe they can start without being an expert"
• "Understand why niching down is hurting them"

Bad Mission example:

• "Talk about content creation"`,
    takeaway: 'No mission = random content.',
  },
  {
    id: 5,
    title: 'Screen 5 — Footage Needed (Visual Proof)',
    shortTitle: 'Footage Needed (Visual Proof)',
    icon: 'videocam-outline',
    content: `Matches field: Footage Needed

Teach this clearly:

Footage is not decoration.
Footage is evidence.

Prompt users to think:

What must the viewer see to believe me?

Examples:

• Walking alone → struggle
• Working late → pursuit
• Calm moment → payoff`,
    takeaway: "If you can't explain why a shot exists, remove it.",
  },
  {
    id: 6,
    title: 'Screen 6 — Text Visual (What the Eyes Follow)',
    shortTitle: 'Text Visual (What the Eyes Follow)',
    icon: 'text-outline',
    content: `Matches field: Text Visual

What text should do:

• Carry meaning even without sound
• Guide attention, not summarize

Rules from your knowledge:

• One idea per screen
• Every line must be readable in <1 second

Text should either:

• Agitate pain
• Open a loop
• Signal transformation

Examples:

• "I thought I was bad at content…"
• "This changed everything."
• "Nobody tells beginners this."`,
  },
  {
    id: 7,
    title: 'Screen 7 — Audio (Emotion Driver)',
    shortTitle: 'Audio (Emotion Driver)',
    icon: 'musical-notes-outline',
    content: `Matches field: Audio

Teach this:

Audio controls emotion, not information.

Options users can choose from:

• Trending sound → reach
• Voiceover → authority
• Silence → tension
• Rising music → transformation`,
    takeaway: "Music should signal what's about to happen, not explain it.",
  },
  {
    id: 8,
    title: 'Screen 8 — Caption (Depth Lives Here)',
    shortTitle: 'Caption (Depth Lives Here)',
    icon: 'chatbox-outline',
    content: `Matches field: Caption

Explain clearly:

• Video earns attention
• Caption earns trust

Caption structure you've implied:

• Expand the pain
• Add nuance you couldn't fit on screen
• Teach one clear insight
• Soft CTA at the end`,
    takeaway: "Don't repeat the video. Complete it.",
  },
  {
    id: 9,
    title: 'Screen 9 — Call to Action (One Clear Move)',
    shortTitle: 'Call to Action (One Clear Move)',
    icon: 'megaphone-outline',
    content: `Matches field: Call to Action

Teach this rule:

One video = one action

Good CTAs:

• "Comment 'PLAN'"
• "Save this"
• "Follow for part 2"

Bad CTA:

• Like + comment + follow + DM + link`,
    takeaway: 'Confused viewers don\'t convert.',
  },
];

const HOW_TO_SCRIPT_CONTENT: { [key: string]: string } = {};

export default function HowToScriptDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [thinkBeforeStep, setThinkBeforeStep] = useState(1);
  const [universeScriptingStep, setUniverseScriptingStep] = useState(1);

  // 3-screen flow for "How to think before you script"
  if (id === 'think-before-script') {
    const currentScreen = THINK_BEFORE_SCRIPT_FLOW_SCREENS[thinkBeforeStep - 1];
    const isLastScreen = thinkBeforeStep === 3;

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
                {thinkBeforeStep} / {THINK_BEFORE_SCRIPT_FLOW_SCREENS.length}
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
                <Text style={styles.flowScreenTitle}>{currentScreen.shortTitle}</Text>
                <View style={styles.flowCardBody}>
                  {currentScreen.content.split('\n\n').map((block, blockIdx) => {
                    const lines = block.trim().split('\n');
                    return (
                      <View key={blockIdx} style={styles.flowBlock}>
                        {lines.map((line, lineIdx) => {
                          const trimmed = line.trim();
                          if (!trimmed) return null;
                          const isBullet = flowBulletMatch(line);
                          const text = isBullet ? flowBulletText(line) : trimmed;
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
                {currentScreen.takeaway ? (
                  <View style={styles.takeawayBox}>
                    <Ionicons name="bulb-outline" size={18} color="#FFD700" />
                    <Text style={styles.takeawayText}>{currentScreen.takeaway}</Text>
                  </View>
                ) : null}
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
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    playClickSound();
                    setThinkBeforeStep(thinkBeforeStep + 1);
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

  // 6-screen flow for "How to use the universe scripting system"
  if (id === 'universe-scripting-system') {
    const currentScreen = UNIVERSE_SCRIPTING_FLOW_SCREENS[universeScriptingStep - 1];
    const isLastScreen = universeScriptingStep === UNIVERSE_SCRIPTING_FLOW_SCREENS.length;

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
                {universeScriptingStep} / {UNIVERSE_SCRIPTING_FLOW_SCREENS.length}
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
                <Text style={styles.flowScreenTitle}>{currentScreen.shortTitle}</Text>
                <View style={styles.flowCardBody}>
                  {currentScreen.content.split('\n\n').map((block, blockIdx) => {
                    const lines = block.trim().split('\n');
                    return (
                      <View key={blockIdx} style={styles.flowBlock}>
                        {lines.map((line, lineIdx) => {
                          const trimmed = line.trim();
                          if (!trimmed) return null;
                          const isBullet = flowBulletMatch(line);
                          const text = isBullet ? flowBulletText(line) : trimmed;
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
                {currentScreen.takeaway ? (
                  <View style={styles.takeawayBox}>
                    <Ionicons name="bulb-outline" size={18} color="#FFD700" />
                    <Text style={styles.takeawayText}>{currentScreen.takeaway}</Text>
                  </View>
                ) : null}
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
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    playClickSound();
                    setUniverseScriptingStep(universeScriptingStep + 1);
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

  const content = HOW_TO_SCRIPT_CONTENT[id || ''] || 'Content not found.';
  const option = HOW_TO_SCRIPT_OPTIONS.find((opt) => opt.id === id);

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
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {option?.title || 'How to Script'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.contentBox}>
            {content.split('\n').map((line, index) => {
              const parts: (string | JSX.Element)[] = [];
              let remaining = line;
              let keyIndex = 0;

              while (remaining.length > 0) {
                const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
                if (boldMatch) {
                  const beforeBold = remaining.substring(0, boldMatch.index);
                  if (beforeBold) parts.push(beforeBold);
                  parts.push(
                    <Text key={`bold-${index}-${keyIndex++}`} style={styles.boldText}>
                      {boldMatch[1]}
                    </Text>
                  );
                  remaining = remaining.substring((boldMatch.index ?? 0) + boldMatch[0].length);
                } else {
                  parts.push(remaining);
                  break;
                }
              }

              if (line.trim() === '') {
                return <View key={index} style={styles.emptyLine} />;
              }

              return (
                <Text key={index} style={styles.contentText}>
                  {parts}
                </Text>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  backButton: { padding: 8, zIndex: 1 },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
  },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  contentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  contentText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 12,
  },
  boldText: { fontWeight: 'bold', color: '#FFD700' },
  emptyLine: { height: 12 },
  // Flow (same design as Use Hooks / Define Universe)
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
  takeawayBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 215, 0, 0.35)',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  takeawayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    lineHeight: 24,
    flex: 1,
  },
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
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e27',
  },
});
