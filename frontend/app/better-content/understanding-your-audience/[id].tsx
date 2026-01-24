import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { UniverseBackground } from '../../../components/UniverseBackground';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../../../utils/soundEffects';

function flowBulletMatch(line: string): boolean {
  const t = line.trim();
  return t.startsWith('•') || t.startsWith('–');
}

function flowBulletText(line: string): string {
  const t = line.trim();
  if (t.startsWith('•') || t.startsWith('–')) return t.slice(1).trim();
  return t;
}

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

// 3-screen flow for "What 'understanding your audience' actually means"
const WHAT_IT_MEANS_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'Screen 1 — Why Most Creators Get This Wrong',
    shortTitle: 'Why Most Creators Get This Wrong',
    icon: 'warning-outline',
    content: `Views don't fail. Targeting does.

Core truth:

Most creators think audience problems are about:

• Hooks
• Editing
• Algorithms

But the real issue is this:

They're talking to everyone, so no one feels spoken to.

Universe principle:

If your audience doesn't feel personally addressed,
they scroll — even if your content is "good."`,
    takeaway:
      "Understanding your audience = knowing exactly whose pain you're solving.",
  },
  {
    id: 2,
    title: "Screen 2 — The Only Question That Matters",
    shortTitle: "The Only Question That Matters",
    icon: 'help-circle-outline',
    content: `Who is this helping right now?

Teach this clearly:

Every piece of content should answer one question:

"Who is this for — and what are they struggling with today?"

Not:

• Who could like this
• Who might watch this

But:

• Who needs this now

Universe reframe:

You don't grow by being impressive.
You grow by being relevant.`,
    takeaway:
      "You don't grow by being impressive. You grow by being relevant.",
  },
  {
    id: 3,
    title: 'Screen 3 — Audience ≠ Followers',
    shortTitle: 'Audience ≠ Followers',
    icon: 'people-outline',
    content: `Followers are numbers. Audience is people.

Explain the difference:

• Followers = who clicked "follow"
• Audience = who feels understood

This is why:

• Some creators monetize with 5k followers
• Others can't monetize with 1M

Key insight from your knowledge:

You can have millions of the wrong followers
and still fail.

Universe rule:

The goal is not reach.
The goal is resonance.`,
    takeaway: 'The goal is not reach. The goal is resonance.',
  },
];

// 5-screen flow for "How to understand your audience" (Screens 4–8)
const HOW_TO_UNDERSTAND_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 4,
    title: "Screen 4 — Start With Demographics (But Don't Stop There)",
    shortTitle: "Start With Demographics (But Don't Stop There)",
    icon: 'stats-chart-outline',
    content: `Demographics are the surface.

Demographics tell you:

• Age range
• Location
• Gender split
• Profession

But here's the warning:

Demographics tell you who they are.
They do not tell you why they care.

Universe insight:

Demographics help with clarity.
Psychographics drive connection.`,
    takeaway:
      'Demographics help with clarity. Psychographics drive connection.',
  },
  {
    id: 5,
    title: 'Screen 5 — Psychographics: Where Real Growth Happens',
    shortTitle: 'Psychographics: Where Real Growth Happens',
    icon: 'heart-outline',
    content: `Psychographics = emotions, not data.

Psychographics answer:

• What do they struggle with?
• What frustrates them?
• What do they secretly want?
• What are they afraid to admit?

From your knowledge:

People don't follow for information.
They follow for relief, clarity, and hope.

Universe line:

If you can describe their struggle better than they can,
they trust you.`,
    takeaway:
      'If you can describe their struggle better than they can, they trust you.',
  },
  {
    id: 6,
    title: 'Screen 6 — The "Most Liked Comment" Rule',
    shortTitle: 'The "Most Liked Comment" Rule',
    icon: 'thumbs-up-outline',
    content: `Your audience is already telling you.

Teach this clearly (very important):

• The comment with the most likes
• Is usually the real pain point
• Because many people silently agree with it

How to use this in Universe:

• Look at your comments
• Find the one with the most likes
• Turn that into your next post

Universe rule:

Don't guess pain.
Confirm it.`,
    takeaway: "Don't guess pain. Confirm it.",
  },
  {
    id: 7,
    title: "Screen 7 — The Younger-You Principle",
    shortTitle: 'The Younger-You Principle',
    icon: 'time-outline',
    content: `If you're lost, target yourself.

Explain simply:

If you don't know who to target:

Target the version of you
2–3 years ago.

Why this works:

• You know their struggles
• You know their desires
• You know what actually helped

From your knowledge:

This removes:

• Overthinking
• Imposter syndrome
• "Who am I to teach this?"

Universe anchor:

You're not teaching from superiority.
You're teaching from experience.`,
    takeaway:
      "You're not teaching from superiority. You're teaching from experience.",
  },
  {
    id: 8,
    title: 'Screen 8 — Pain Comes Before Expertise',
    shortTitle: 'Pain Comes Before Expertise',
    icon: 'hand-left-outline',
    content: `People connect through pain, not highlights.

Teach this strongly:

If you only share:

• Wins
• Success
• Flexes

People don't relate.

But when you share:

• Struggle
• Confusion
• Doubt

People feel seen.

Universe reminder:

One universal truth:

Everyone struggles.

Key rule:

Never talk down.
Always talk alongside.`,
    takeaway: 'Never talk down. Always talk alongside.',
  },
];

const UNDERSTANDING_AUDIENCE_CONTENT: { [key: string]: string } = {};

export default function UnderstandingAudienceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [whatItMeansStep, setWhatItMeansStep] = useState(1);
  const [howToUnderstandStep, setHowToUnderstandStep] = useState(1);

  // 3-screen flow for "What 'understanding your audience' actually means"
  if (id === 'what-it-means') {
    const currentScreen = WHAT_IT_MEANS_FLOW_SCREENS[whatItMeansStep - 1];
    const isLastScreen = whatItMeansStep === WHAT_IT_MEANS_FLOW_SCREENS.length;

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
            <View style={styles.progressContainer}>
              {WHAT_IT_MEANS_FLOW_SCREENS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index + 1 <= whatItMeansStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.flowContainer}>
            <ScrollView
              style={styles.flowScrollView}
              contentContainerStyle={styles.flowContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.screenPill}>
                <Text style={styles.screenPillText}>
                  {whatItMeansStep} / {WHAT_IT_MEANS_FLOW_SCREENS.length}
                </Text>
              </View>
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
                {currentScreen.takeaway ? (
                  <View style={styles.takeawayBox}>
                    <Ionicons
                      name="bulb-outline"
                      size={18}
                      color="#FFD700"
                    />
                    <Text style={styles.takeawayText}>
                      {currentScreen.takeaway}
                    </Text>
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
                    setWhatItMeansStep(whatItMeansStep + 1);
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

  // 5-screen flow for "How to understand your audience"
  if (id === 'how-to-understand') {
    const currentScreen =
      HOW_TO_UNDERSTAND_FLOW_SCREENS[howToUnderstandStep - 1];
    const isLastScreen =
      howToUnderstandStep === HOW_TO_UNDERSTAND_FLOW_SCREENS.length;

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
            <View style={styles.progressContainer}>
              {HOW_TO_UNDERSTAND_FLOW_SCREENS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index + 1 <= howToUnderstandStep &&
                      styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.flowContainer}>
            <ScrollView
              style={styles.flowScrollView}
              contentContainerStyle={styles.flowContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.screenPill}>
                <Text style={styles.screenPillText}>
                  {howToUnderstandStep} / {HOW_TO_UNDERSTAND_FLOW_SCREENS.length}
                </Text>
              </View>
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
                {currentScreen.takeaway ? (
                  <View style={styles.takeawayBox}>
                    <Ionicons
                      name="bulb-outline"
                      size={18}
                      color="#FFD700"
                    />
                    <Text style={styles.takeawayText}>
                      {currentScreen.takeaway}
                    </Text>
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
                    setHowToUnderstandStep(howToUnderstandStep + 1);
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

  const content =
    UNDERSTANDING_AUDIENCE_CONTENT[id || ''] || 'Content not found.';
  const option = UNDERSTANDING_AUDIENCE_OPTIONS.find((opt) => opt.id === id);

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
              {option?.title || 'Understanding Your Audience'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
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
                    <Text
                      key={`bold-${index}-${keyIndex++}`}
                      style={styles.boldText}
                    >
                      {boldMatch[1]}
                    </Text>
                  );
                  remaining = remaining.substring(
                    (boldMatch.index ?? 0) + boldMatch[0].length
                  );
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
  // Flow (same design as Use Hooks / Think Before Script)
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  flowBackButton: { padding: 8, zIndex: 1 },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  progressDotActive: {
    backgroundColor: '#FFD700',
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
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
  screenPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  screenPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
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
