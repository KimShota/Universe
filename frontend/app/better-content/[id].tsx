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

const BETTER_CONTENT_OPTIONS = [
  { id: 'use-hooks', title: 'Use Hooks' },
  { id: 'study-creators-7x7', title: 'Study Creators Objectively (7×7)' },
  { id: 'understanding-your-audience', title: 'Understanding Your Audience' },
  { id: 'analyzing-comments', title: 'Analyzing Comments' },
];

// 6-screen flow for "Use Hooks"
const USE_HOOKS_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'Screen 1 — What a Hook Actually Is',
    shortTitle: 'What a Hook Actually Is',
    icon: 'flash-outline',
    content: `A hook is anything in the first few seconds that stops someone from scrolling.

It doesn't have to be loud.
It has to be relevant.

A hook can be:

• Something you say (spoken line)
• Something you show (visual action)
• Something you write (on-screen text)
• Something you do (movement or contrast)`,
    takeaway: 'If the hook fails, the algorithm never gives the rest of your message a chance.',
  },
  {
    id: 2,
    title: 'Screen 2 — Why Hooks Matter (Algorithm Reality)',
    shortTitle: 'Why Hooks Matter',
    icon: 'analytics-outline',
    content: `The algorithm doesn't care how good your advice is.

It cares about retention.

That means:

• A great first 3 seconds buys attention
• A boring middle still kills the video
• Retention starts immediately, not later`,
    takeaway: "Hooks don't make content clickbait. They protect your ideas from being ignored.",
  },
  {
    id: 3,
    title: 'Screen 3 — What Strong Hooks Are Composed Of',
    shortTitle: 'What Strong Hooks Are Composed Of',
    icon: 'layers-outline',
    content: `High-performing hooks are rarely random.

They usually stack at least 3 of these elements:

• A timeframe ("3 years", "today", "in 30 days")
• A number or statistic
• A before → after transformation
• An open loop (something unresolved)`,
    takeaway: 'Stacking creates tension. Tension creates curiosity. Curiosity creates watch time.',
  },
  {
    id: 4,
    title: 'Screen 4 — Types of Hooks (How You Deliver It)',
    shortTitle: 'Types of Hooks',
    icon: 'megaphone-outline',
    content: `Hooks can be delivered in different ways.

Spoken hooks
Call out pain or belief
"If you think you're not ___ enough for ___…"

Text hooks
Clarify relevance instantly
"I wasted 3 years doing this."

Visual hooks
Pattern interrupt
Unusual angles, split screens, movement

Audio hooks
Rising sound → signals transformation
Silence → creates tension`,
    takeaway: 'The strongest hooks stack multiple types at once.',
  },
  {
    id: 5,
    title: 'Screen 5 — Open Loops & Rehooks (Keeping Attention)',
    shortTitle: 'Open Loops & Rehooks',
    icon: 'infinite-outline',
    content: `An open loop promises value without revealing it yet.

You never say "Wait until the end." You imply it.

Examples:
"This changed everything for me."
"I didn't expect this outcome."

Great videos also use rehooks:
• Asking a question
• Switching scenes
• Introducing contrast`,
    takeaway: 'Attention has a time limit. Something must pivot every ~5 seconds.',
  },
  {
    id: 6,
    title: 'Screen 6 — High-Converting Hook Formats',
    shortTitle: 'High-Converting Hook Formats',
    icon: 'film-outline',
    content: `Some formats naturally hold attention better.

Silent film storytelling
• Visual pain
• Text explains struggle
• Timestamp hints payoff
• Rising music signals transformation

Split-screen contrast
• One problem
• Two perspectives
• Line-by-line contrast

Action-based hooks
• Doing something while talking
• Two things happening in parallel`,
    takeaway: "If traditional talking-head isn't working, change the format, not the message.",
  },
];

// 13-screen flow for "Study Creators Objectively (7×7)"
const STUDY_CREATORS_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'Screen 1 — Why Studying Creators Is Non-Negotiable',
    shortTitle: 'Why Studying Creators Is Non-Negotiable',
    icon: 'school-outline',
    content: `Great content is not random.

Creators who grow:

• Don't "wing it"
• Don't rely on inspiration
• Don't guess what works

They study what already works
and then layer their own story on top.`,
    takeaway: 'Posting without studying formats = cooking without recipes.',
  },
  {
    id: 2,
    title: 'Screen 2 — What "Studying Objectively" Actually Means',
    shortTitle: 'What "Studying Objectively" Actually Means',
    icon: 'search-outline',
    content: `Studying objectively means:

• You are not judging the message
• You are not copying the creator
• You are not chasing virality

You are analyzing:

• Structure
• Timing
• Pacing
• Visual decisions`,
    takeaway: "You're learning the blueprint, not the personality.",
  },
  {
    id: 3,
    title: 'Screen 3 — The Biggest Mistake Creators Make',
    shortTitle: 'The Biggest Mistake Creators Make',
    icon: 'warning-outline',
    content: `Most creators do this:

❌ "I like this video, I'll recreate it."

This fails because:

• You don't know why it worked
• You copy surface-level details
• You miss the mechanics`,
    takeaway: 'The goal is not replication. The goal is understanding.',
  },
  {
    id: 4,
    title: 'Screen 4 — The 7×7 Framework (The Core System)',
    shortTitle: 'The 7×7 Framework',
    icon: 'grid-outline',
    content: `Here's the system:

• Pick 7 creators you're inspired by
• For each creator, select 7 top-performing videos
• That's 49 videos total.

Why this works:

• Patterns don't show up in 1 video
• Patterns show up in many videos`,
    takeaway: 'This turns intuition into data.',
  },
  {
    id: 5,
    title: 'Screen 5 — What to Record for EACH Video',
    shortTitle: 'What to Record for EACH Video',
    icon: 'list-outline',
    content: `For every video, log these:

• Duration (seconds)
• Hook (spoken / text / visual / audio)
• Story arc (pain → pursuit → payoff)
• Cadence (fast / slow / pivots)
• Sound choice (music, silence, voiceover)
• Text length (short, medium, dense)`,
    takeaway: "You're breaking the video into parts instead of consuming it emotionally.",
  },
  {
    id: 6,
    title: 'Screen 6 — The 5 Core Format Features',
    shortTitle: 'The 5 Core Format Features',
    icon: 'layers-outline',
    content: `Every format can be reduced to:

Hook
– What stops the scroll?

Visuals & Edit
– Static or dynamic?
– Scene changes?

Cadence
– How often does something change?

Audio
– Music? Silence? Voiceover?

Story Arc
– Is there tension and payoff?`,
    takeaway: 'Formats are objective. Messages are personal.',
  },
  {
    id: 7,
    title: 'Screen 7 — How to Spot Winning Patterns',
    shortTitle: 'How to Spot Winning Patterns',
    icon: 'bulb-outline',
    content: `After analyzing ~49 videos, patterns appear.

You'll start noticing:

• Similar hook styles
• Similar pacing intervals
• Similar text density
• Similar emotional flow

This is where creators think:

"Oh… THIS is why it works."`,
    takeaway: 'This is the moment content stops feeling random.',
  },
  {
    id: 8,
    title: 'Screen 8 — Frankensteining Formats (Not Copying)',
    shortTitle: 'Frankensteining Formats (Not Copying)',
    icon: 'git-branch-outline',
    content: `Once patterns are clear:

• Take timing from Creator A
• Take pacing from Creator B
• Take visual structure from Creator C

Then:
👉 Layer your own story + message on top.`,
    takeaway: 'This is how trends are created, not followed.',
  },
  {
    id: 9,
    title: 'Screen 9 — Studying Outside Your Niche (Power Move)',
    shortTitle: 'Studying Outside Your Niche',
    icon: 'globe-outline',
    content: `If you only study creators in your niche:

• You recycle the same ideas
• You blend in

Instead:

• Study creators outside your niche
• Borrow structures, not topics

A fitness hook can work for business.
A vlog format can work for education.`,
    takeaway: 'Formats are universal.',
  },
  {
    id: 10,
    title: 'Screen 10 — Silent Film Case Study',
    shortTitle: 'Silent Film Case Study',
    icon: 'film-outline',
    content: `Example: Silent film storytelling

Common features:

• Visual pain first
• Text explains struggle
• Timestamp hints payoff
• Rising sound signals transformation

Even without speaking:

• Retention stays high
• Emotion drives attention`,
    takeaway: '👉 Format > personality.',
  },
  {
    id: 11,
    title: 'Screen 11 — Split-Screen Case Study',
    shortTitle: 'Split-Screen Case Study',
    icon: 'copy-outline',
    content: `Split-screen formats work because:

• One problem
• Two opposing perspectives
• Line-by-line contrast
• Scene changes reset attention`,
    takeaway: "If talking-head content isn't working, this format often revives performance.",
  },
  {
    id: 12,
    title: 'Screen 12 — How Universe Helps You Study',
    shortTitle: 'How Universe Helps You Study',
    icon: 'folder-outline',
    content: `Inside Universe, this becomes:

• Creator analysis table
• Saved formats
• Labels (Silent, Voiceover, Split, Trend)
• Personal format database`,
    takeaway: "You're not scrolling anymore. You're building assets.",
  },
  {
    id: 13,
    title: 'Screen 13 — The Mental Shift (Most Important)',
    shortTitle: 'The Mental Shift (Most Important)',
    icon: 'heart-outline',
    content: `Creators fail because they think:

"I'm bad at content."

Reality:

You just haven't studied it properly.

Once you understand formats:

• Confidence increases
• Posting becomes repeatable
• Creativity feels safe`,
    takeaway: 'Content becomes a skill, not a gamble.',
  },
];

const BETTER_CONTENT_CONTENT: { [key: string]: string } = {
  'study-creators-7x7': `**Study Creators Objectively (7×7)**

The **7×7 method** helps you learn from other creators without copying — you extract principles, not content.

**How It Works:**
- Pick **7 creators** in your niche (or adjacent)
- For each, answer **7 questions**:

1. What's their main hook style?
2. How do they structure the first 10 seconds?
3. What format do they use most? (talking head, B-roll, text, etc.)
4. What's their CTA? (follow, comment, save, link?)
5. When do they post? How often?
6. What emotional tone do they use?
7. What makes them *different* from others in the niche?

**Why 7×7?**
- **7 creators**: Enough variety to see patterns, not just one person's style
- **7 questions**: Forces you to think analytically, not just "I like this"

**Output:** A one-pager per creator. Look for **patterns** across them — those are the principles you can apply in your own voice.

**Remember:** Study objectively. Don't idolize or dismiss — extract what works.`,

};

// Single-screen flow for "Analyzing Comments"
const ANALYZING_COMMENTS_SCREEN = {
  shortTitle: 'The most-liked comment is the truth.',
  icon: 'chatbubble-ellipses-outline',
  content: `Don't read every comment.
Read the one with the most likes.

That comment represents the shared pain your audience is silently agreeing with.

Why this works:

• Likes = agreement
• Agreement = unmet need
• Unmet need = your next content idea

How to use this (3 steps):

• Open your comments
• Find the comment with the most likes
• Create your next post solving that exact problem

Important reminder:

The real pain isn't always what people post —
it's what many people agree with.`,
  takeaway:
    "When your audience tells you what hurts, your job is to listen — not guess.",
};

function flowBulletMatch(line: string): boolean {
  const t = line.trim();
  return t.startsWith('•') || t.startsWith('–');
}

function flowBulletText(line: string): string {
  const t = line.trim();
  if (t.startsWith('•') || t.startsWith('–')) return t.slice(1).trim();
  return t;
}

export default function BetterContentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [useHooksStep, setUseHooksStep] = useState(1);
  const [studyCreatorsStep, setStudyCreatorsStep] = useState(1);

  // 6-screen flow for "Use Hooks"
  if (id === 'use-hooks') {
    const currentScreen = USE_HOOKS_FLOW_SCREENS[useHooksStep - 1];
    const isLastScreen = useHooksStep === 6;

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
                {useHooksStep} / {USE_HOOKS_FLOW_SCREENS.length}
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
                    setUseHooksStep(useHooksStep + 1);
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

  // 13-screen flow for "Study Creators Objectively (7×7)"
  if (id === 'study-creators-7x7') {
    const currentScreen = STUDY_CREATORS_FLOW_SCREENS[studyCreatorsStep - 1];
    const isLastScreen = studyCreatorsStep === 13;

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
                {studyCreatorsStep} / {STUDY_CREATORS_FLOW_SCREENS.length}
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
                    setStudyCreatorsStep(studyCreatorsStep + 1);
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

  // Single-screen flow for "Analyzing Comments"
  if (id === 'analyzing-comments') {
    const currentScreen = ANALYZING_COMMENTS_SCREEN;

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
              </View>
            </ScrollView>

            <View style={styles.flowButtonContainer}>
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
            </View>
          </View>
        </SafeAreaView>
      </UniverseBackground>
    );
  }

  const content = BETTER_CONTENT_CONTENT[id || ''] || 'Content not found.';
  const option = BETTER_CONTENT_OPTIONS.find((opt) => opt.id === id);

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
              {option?.title || 'Better Content'}
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
                  if (beforeBold) {
                    parts.push(beforeBold);
                  }
                  parts.push(
                    <Text key={`bold-${index}-${keyIndex++}`} style={styles.boldText}>
                      {boldMatch[1]}
                    </Text>
                  );
                  remaining = remaining.substring(
                    (boldMatch.index || 0) + boldMatch[0].length
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
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  flowBackButton: {
    padding: 8,
    zIndex: 1,
  },
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
  headerSpacer: {
    width: 40,
  },
  flowContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  flowScrollView: {
    flex: 1,
  },
  flowContent: {
    paddingBottom: 24,
  },
  flowCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    overflow: 'hidden',
  },
  flowCardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  flowScreenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 26,
  },
  flowCardBody: {
    gap: 4,
  },
  flowBlock: {
    marginBottom: 4,
  },
  flowLineRow: {
    marginBottom: 10,
  },
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
    fontSize: 16,
    lineHeight: 26,
    color: 'rgba(255, 255, 255, 0.92)',
    flex: 1,
  },
  flowBulletText: {
    flex: 1,
  },
  takeawayBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  takeawayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
    lineHeight: 22,
    flex: 1,
  },
  flowButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
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
  continueIcon: {
    marginLeft: 4,
  },
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
  titleContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
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
  boldText: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  emptyLine: {
    height: 12,
  },
});
