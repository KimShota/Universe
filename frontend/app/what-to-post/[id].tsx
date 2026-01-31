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

// 12-screen flow for "Define Your Creator Universe"
const DEFINE_UNIVERSE_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'Screen 1 — What the Creator Universe Is',
    shortTitle: 'What the Creator Universe Is',
    icon: 'globe-outline',
    content: `The Creator Universe is your content identity system.

It exists to answer:

"What should I post without guessing?"

Instead of chasing niches or trends,
you create a universe people orbit.

Different posts.
One clear identity.`,
  },
  {
    id: 2,
    title: 'Screen 2 — Why Creators Feel Lost Without It',
    shortTitle: 'Why Creators Feel Lost Without It',
    icon: 'help-circle-outline',
    content: `Most creators struggle because:

• They copy too many people
• They jump between formats
• They don't know what they stand for

This causes:

• Inconsistent growth
• Audience confusion
• Burnout`,
    takeaway: 'Creator Universe gives your content a center of gravity.',
  },
  {
    id: 3,
    title: 'Screen 3 — The 3 Parts of Creator Universe',
    shortTitle: 'The 3 Parts of Creator Universe',
    icon: 'layers-outline',
    content: `Your Creator Universe has 3 components:

WHAT — your message (ethos)

WHO — your audience

UNIQUENESS — your pain, experience, skills`,
    takeaway: 'If one is missing, your content feels hollow.',
  },
  {
    id: 4,
    title: 'Screen 4 — WHAT: Your Message (Ethos)',
    shortTitle: 'WHAT: Your Message (Ethos)',
    icon: 'chatbubble-ellipses-outline',
    content: `Your message is what you believe, not what you post.

It's the idea that connects everything.

Examples:

"People deserve financial freedom to live fully."

"Learning shouldn't feel overwhelming."

Your topics can change.
Your message anchors them.`,
  },
  {
    id: 5,
    title: 'Screen 5 — Why You Don\'t Need to Niche Down',
    shortTitle: "Why You Don't Need to Niche Down",
    icon: 'expand-outline',
    content: `Traditional niches fail long-term because:

• You evolve as a human
• Your interests change
• Your audience changes

A message scales.
A niche traps.`,
    takeaway: 'Say it until it sticks: I am the niche.',
  },
  {
    id: 6,
    title: 'Screen 6 — WHO: Understanding Your Audience',
    shortTitle: 'WHO: Understanding Your Audience',
    icon: 'people-outline',
    content: `Follower count doesn't matter.
Understanding people does.

To serve your audience, know:

• Demographics (age, location, profession)
• Psychographics (struggles, desires, fears)

Psychographics matter more.`,
    takeaway: 'People follow creators who understand their inner dialogue.',
  },
  {
    id: 7,
    title: 'Screen 7 — The Younger You Principle',
    shortTitle: 'The Younger You Principle',
    icon: 'person-outline',
    content: `If you're unsure who to target:

Target you, 2–3 years ago.

Why this works:

• You lived their pain
• You know the transformation
• You speak with authenticity`,
    takeaway: 'This builds the right audience — not just views.',
  },
  {
    id: 8,
    title: 'Screen 8 — UNIQUENESS: Why People Care',
    shortTitle: 'UNIQUENESS: Why People Care',
    icon: 'star-outline',
    content: `Your uniqueness comes from three layers:

• Pain — what you struggled with
• Experience — what you lived through
• Skills — what people ask you for help with`,
    takeaway: 'Your strongest content comes from pain, not highlights.',
  },
  {
    id: 9,
    title: 'Screen 9 — Sharing Pain the Right Way',
    shortTitle: 'Sharing Pain the Right Way',
    icon: 'heart-outline',
    content: `You don't overshare.

You share:

• Reflected pain
• Lessons learned
• Growth you can teach

Don't:

• Trauma dump
• Attack others
• Flex constantly`,
    takeaway: "Pain becomes powerful when it's turned into service.",
  },
  {
    id: 10,
    title: 'Screen 10 — Your 4 Content Pillars',
    shortTitle: 'Your 4 Content Pillars',
    icon: 'grid-outline',
    content: `Your Creator Universe has 4 pillars:

• Skill — what you know or are learning
• Passion — what excites you
• Interest — what you're exploring
• Your Story — your journey`,
    takeaway: '⚠️ The story pillar is mandatory. That\'s where connection lives.',
  },
  {
    id: 11,
    title: 'Screen 11 — The 3P Story Framework',
    shortTitle: 'The 3P Story Framework',
    icon: 'git-branch-outline',
    content: `To tell your story clearly, use 3P:

• Problem — what hurt
• Pursuit — what you tried
• Payoff — what changed internally`,
    takeaway: 'Start with pain. That\'s where people connect.',
  },
  {
    id: 12,
    title: 'Screen 12 — 20-Minute Story Exercise',
    shortTitle: '20-Minute Story Exercise',
    icon: 'time-outline',
    content: `To unlock your story pillar:

• List major life struggles
• Note how they changed you
• Use AI to find patterns

Those patterns become:

• Your story themes
• Your most powerful content`,
  },
];

// 4-screen flow for "Use Your Creator Universe" (Screens 13–16)
const USE_UNIVERSE_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 13,
    title: 'Screen 13 — How Creator Universe Guides Posting',
    shortTitle: 'How Creator Universe Guides Posting',
    icon: 'compass-outline',
    content: `Before posting, ask:

• Which pillar is this?
• Which pain or desire does it serve?
• How does it reflect my message?

If it fits your universe → post.
If not → skip.`,
    takeaway: 'Clarity removes anxiety.',
  },
  {
    id: 14,
    title: 'Screen 14 — Journey POV vs Expert POV',
    shortTitle: 'Journey POV vs Expert POV',
    icon: 'swap-horizontal-outline',
    content: `You don't need to be an expert to post.

Journey POV
• Learning in public
• A few steps ahead
• Highly relatable

Expert POV
• Teaching from experience
• Clear authority`,
    takeaway: 'Most creators should start with Journey POV.',
  },
  {
    id: 15,
    title: 'Screen 15 — Why Story Is the Strongest Pillar',
    shortTitle: 'Why Story Is the Strongest Pillar',
    icon: 'book-outline',
    content: `Your story:

• Builds trust
• Makes you memorable
• Turns followers into community

People stop championing your tips
and start championing you.`,
    takeaway: "That's how brands are built.",
  },
  {
    id: 16,
    title: 'Screen 16 — Creator Universe Is Flexible',
    shortTitle: 'Creator Universe Is Flexible',
    icon: 'git-branch-outline',
    content: `Your universe is not fixed.

• Message can evolve
• Pillars can shift
• Story deepens

As long as the structure stays,
your audience feels continuity.`,
    takeaway: 'You never have to "start over."',
  },
];

// 7-screen flow for "What Types of Content to Post"
const WHAT_TYPES_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'The Strategic Mix',
    shortTitle: 'The Strategic Mix',
    icon: 'layers-outline',
    content: `Post at least 3 times per week. Here's the strategic mix that builds your community:

The Three Core Content Types:

1. Storytelling Content
How people connect with you authentically.

2. Value-Based Content
Where you teach insights based on your own experiences.

3. Reach Content
Content optimized for attracting new eyeballs.`,
    takeaway: 'Balance story, value, and reach.',
  },
  {
    id: 2,
    title: 'Storytelling Content',
    shortTitle: 'Storytelling Content',
    icon: 'book-outline',
    content: `This is how people connect with you authentically.

What Makes Good Storytelling:
• It doesn't have to be a massive transformation (0 to billionaire)
• It can be a simple mindset shift
• Examples: anxiety → peace, can't study → able to study
• Use Journey POV: treat yourself as a peer, not an expert
• You're a few steps ahead, not miles ahead

The 3P Framework:
• Problem: What struggle did you encounter?
• Pursuit: What actions did you take to overcome it?
• Payoff: What was the transformation and why was it meaningful?

Why It Works:
• People connect through struggle, not highlights
• When you lead with storytelling, you become approachable
• Your content feels human and people feel seen
• They stop championing just your tips and start championing YOU as a brand`,
    takeaway: 'Lead with story. People champion you, not just your tips.',
  },
  {
    id: 3,
    title: 'Value-Based Content',
    shortTitle: 'Value-Based Content',
    icon: 'bulb-outline',
    content: `This is where you teach insights based on your own experiences.

How to Know If It's Valuable:
Ask: Is this selfish or selfless content?
• Selfless: Thinking about the payoff for your audience
• Selfish: Only highlighting your genius (makes people feel looked down upon)

Types of Value Content:
• Teaching one thing you actually know
• One technique, one decision, one key takeaway
• Breaking something down (3-step system, common mistake, mini framework)
• Walk-through steps`,
    takeaway: 'Selfless content serves. Selfish content pushes away.',
  },
  {
    id: 4,
    title: 'Reach Content',
    shortTitle: 'Reach Content',
    icon: 'trending-up-outline',
    content: `You need content optimized for attracting new eyeballs.

How to Create Reach Content:
• Combine trending formats with your message
• Use proven formats that work on the algorithm
• Examples: B-roll with text, split screen, trending sounds
• The format does the work, your insight builds credibility`,
    takeaway: 'Format attracts. Your message converts.',
  },
  {
    id: 5,
    title: 'Weekly Schedule — Days 1–4',
    shortTitle: 'Weekly Schedule — Days 1–4',
    icon: 'calendar-outline',
    content: `Day 1: High Effort — Build Trust
• Your story, a real struggle, the shift you made, the lesson learned
• This makes people believe you

Day 2: Low Effort — Build Relatability
• Behind the scenes, day in the life, something real and unpolished
• This makes your content feel human

Day 3: Medium Effort — Build Authority
• Teach one thing you actually know
• One technique, one decision, one key takeaway
• Positions you as worth listening to

Day 4: Low Effort — Build Reach
• Trending format (B-roll with text, split screen)
• Pair it with your message
• Format does the work, your insight builds credibility`,
  },
  {
    id: 6,
    title: 'Weekly Schedule — Days 5–7 & If Posting Less',
    shortTitle: 'Days 5–7 & If Posting Less',
    icon: 'calendar-outline',
    content: `Day 5: Medium Effort — Build Value
• Break something down
• 3-step system, common mistake, mini framework
• This keeps people following you

Day 6: Lowest Effort — Stay Consistent
• Reflection, gratitude, answering a common question
• Helps you stay consistent on low-energy days

Day 7: High Effort — Build Depth
• Longer reel, mini lesson, short vlog
• Turns followers into a real community

If Posting Less:
• 6 days: Remove Day 6
• 5 days: Remove Day 2
• 4 days: Remove Day 3`,
  },
  {
    id: 7,
    title: 'The 80/20 Rule',
    shortTitle: 'The 80/20 Rule',
    icon: 'pie-chart-outline',
    content: `80% proven formats (what works)
20% experimentation (try new things)

Remember: Good content solves a real problem, is easy to understand, feels relevant and authentic, and aligns with a clear goal. Focus on selfless content that serves your audience.`,
    takeaway: 'Serve your audience. Experiment wisely.',
  },
];

// 7-screen flow for "How to Repurpose One Video to Create 7 Different Videos"
const REPURPOSE_VIDEO_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'Source',
    shortTitle: 'Source',
    icon: 'videocam-outline',
    content: `This is the vlog itself where you spent the most amount of time creating.

This is your main piece of content — the foundation for everything else.`,
    takeaway: 'One strong vlog becomes the source for 7 different videos.',
  },
  {
    id: 2,
    title: 'Green Screen',
    shortTitle: 'Green Screen',
    icon: 'easel-outline',
    content: `Take one clip, react to it, and explain exactly why you do what you do.

Use a green screen to overlay yourself on your own footage and add commentary or insights.`,
    takeaway: 'React to your own content — viewers love the meta perspective.',
  },
  {
    id: 3,
    title: 'Lessons',
    shortTitle: 'Lessons',
    icon: 'school-outline',
    content: `Take screenshots of your vlog and repurpose it for carousel where you're solving a very particular problem and giving key takeaways.

Transform moments into educational slide posts.`,
    takeaway: 'Carousels solve problems. Pull your best moments into lessons.',
  },
  {
    id: 4,
    title: 'The Caption',
    shortTitle: 'The Caption',
    icon: 'chatbubble-outline',
    content: `You take one b-roll from your vlog and repurpose to have one singular text on screen and then the value provided in the caption.

Minimal on-screen text. The caption does the teaching.`,
    takeaway: 'One clip + one line of text + value in caption = new post.',
  },
  {
    id: 5,
    title: 'The Storytelling',
    shortTitle: 'The Storytelling',
    icon: 'git-branch-outline',
    content: `Reorder the clips of your vlog, add a different message, and now you have a completely different piece of content.

Same footage. New narrative. New angle.`,
    takeaway: 'Reordering + new message = entirely new video.',
  },
  {
    id: 6,
    title: 'Split Screens',
    shortTitle: 'Split Screens',
    icon: 'grid-outline',
    content: `Contrast two perspectives on one idea and add some music.

Show before/after, either/or, or two sides of the same story.`,
    takeaway: 'Split screens create contrast. Add music for emotion.',
  },
  {
    id: 7,
    title: 'Story Frames',
    shortTitle: 'Story Frames',
    icon: 'images-outline',
    content: `Take screenshots of your vlog, add a quote, add a teaching framework or use it for behind the scenes moment.

Perfect for quotes, frameworks, or BTS content.`,
    takeaway: 'Screenshots + quote or framework = quick repurposed content.',
  },
];

const WHAT_TO_POST_CONTENT: { [key: string]: string } = {};

export default function WhatToPostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [defineUniverseStep, setDefineUniverseStep] = useState(1);
  const [useUniverseStep, setUseUniverseStep] = useState(1);
  const [whatTypesStep, setWhatTypesStep] = useState(1);
  const [repurposeVideoStep, setRepurposeVideoStep] = useState(1);

  // 12-screen flow for "Define Your Creator Universe"
  if (id === 'define-your-creator-universe') {
    const currentScreen = DEFINE_UNIVERSE_FLOW_SCREENS[defineUniverseStep - 1];
    const isLastScreen = defineUniverseStep === 12;

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
                {defineUniverseStep} / {DEFINE_UNIVERSE_FLOW_SCREENS.length}
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
                    setDefineUniverseStep(defineUniverseStep + 1);
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

  // 4-screen flow for "Use Your Creator Universe"
  if (id === 'use-your-creator-universe') {
    const currentScreen = USE_UNIVERSE_FLOW_SCREENS[useUniverseStep - 1];
    const isLastScreen = useUniverseStep === 4;

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
                {useUniverseStep} / {USE_UNIVERSE_FLOW_SCREENS.length}
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
                    setUseUniverseStep(useUniverseStep + 1);
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

  // 7-screen flow for "What Types of Content to Post"
  if (id === 'what-types-of-content') {
    const currentScreen = WHAT_TYPES_FLOW_SCREENS[whatTypesStep - 1];
    const isLastScreen = whatTypesStep === WHAT_TYPES_FLOW_SCREENS.length;

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
                {whatTypesStep} / {WHAT_TYPES_FLOW_SCREENS.length}
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
                    setWhatTypesStep(whatTypesStep + 1);
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

  // 7-screen flow for "How to Repurpose One Video to Create 7 Different Videos"
  if (id === 'repurpose-one-video-seven-ways') {
    const currentScreen = REPURPOSE_VIDEO_FLOW_SCREENS[repurposeVideoStep - 1];
    const isLastScreen =
      repurposeVideoStep === REPURPOSE_VIDEO_FLOW_SCREENS.length;

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
                {repurposeVideoStep} / {REPURPOSE_VIDEO_FLOW_SCREENS.length}
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
                    setRepurposeVideoStep(repurposeVideoStep + 1);
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

  const content = WHAT_TO_POST_CONTENT[id || ''] || 'Content not found.';
  const option = WHAT_TO_POST_OPTIONS.find((opt) => opt.id === id);

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
            <Text style={styles.title}>
              {option?.title || 'What to Post'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.contentBox}>
            {content.split('\n').map((line, index) => {
              // Handle bold text (**text**)
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
                  remaining = remaining.substring((boldMatch.index || 0) + boldMatch[0].length);
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  backButton: {
    padding: 8,
    zIndex: 1,
  },
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
  // Define Universe flow (same design as Use Hooks)
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
});
