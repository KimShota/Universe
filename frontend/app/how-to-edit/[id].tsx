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

const HOW_TO_EDIT_OPTIONS = [
  { id: 'tools-and-softwares', title: 'Tools and Softwares' },
  { id: 'how-to-use-capcut', title: 'How to Use Capcut' },
  { id: 'how-to-use-davinci-resolve', title: 'How to Use Davinci Resolve' },
  { id: 'how-to-optimize-filming', title: 'How to Optimize Filming' },
  { id: 'batch-editing-tips', title: 'Batch Editing Tips' },
];

// 10-screen flow for "How to Use Capcut"
const HOW_TO_USE_CAPCUT_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'Screen 1 — Step 1: Start a Project',
    shortTitle: 'Step 1: Start a Project',
    icon: 'add-circle-outline',
    content: `Create a new project

• Open CapCut
• Tap "New Project"
• Select your videos or photos

Universe tip:

Start with one main clip.
Simple projects are easier to finish and post.`,
    takeaway:
      'Start with one main clip. Simple projects are easier to finish and post.',
  },
  {
    id: 2,
    title: 'Screen 2 — Step 2: Arrange Your Clips',
    shortTitle: 'Step 2: Arrange Your Clips',
    icon: 'git-branch-outline',
    content: `Build the flow first

Before adding effects:

• Trim unnecessary parts
• Remove long pauses
• Keep only moments that move the story forward

Ask yourself:

"Does this moment earn attention?"

If not — cut it.`,
  },
  {
    id: 3,
    title: 'Screen 3 — Step 3: Edit for Retention',
    shortTitle: 'Step 3: Edit for Retention',
    icon: 'time-outline',
    content: `Attention is always running out

Good retention editing means:

• Cutting boring moments
• Switching scenes every few seconds
• Zooming or reframing to reset attention

Universe rule:

If nothing changes visually or emotionally, people scroll.`,
    takeaway:
      'If nothing changes visually or emotionally, people scroll.',
  },
  {
    id: 4,
    title: 'Screen 4 — Add Text',
    shortTitle: 'Add Text',
    icon: 'text-outline',
    content: `Text guides the viewer

Use text to:

• Highlight pain points
• Emphasize key ideas
• Help viewers follow without sound

Best practices:

• One idea per screen
• Large, readable text
• Short and clear phrases`,
  },
  {
    id: 5,
    title: 'Screen 5 — Auto Captions (Must Use)',
    shortTitle: 'Auto Captions (Must Use)',
    icon: 'chatbubbles-outline',
    content: `Captions increase watch time

Many viewers watch with sound off.

CapCut can:

• Auto-generate captions
• Sync them to speech
• Save you time

Always review captions before exporting.`,
    takeaway: 'Always review captions before exporting.',
  },
  {
    id: 6,
    title: 'Screen 6 — Music & Audio',
    shortTitle: 'Music & Audio',
    icon: 'musical-notes-outline',
    content: `Audio supports emotion

Use music to:

• Set the mood
• Build tension
• Support transformation

Tips:

• Lower music under voice
• Avoid overpowering the message
• Use rising music near the payoff`,
  },
  {
    id: 7,
    title: 'Screen 7 — Transitions & Effects',
    shortTitle: 'Transitions & Effects',
    icon: 'layers-outline',
    content: `Use effects with intention

Transitions help when:

• Changing scenes
• Showing progression
• Resetting attention

Avoid:

• Overusing flashy effects
• Distracting visuals

Effects should serve the message, not replace it.`,
    takeaway: 'Effects should serve the message, not replace it.',
  },
  {
    id: 8,
    title: 'Screen 8 — AI Tools (Use Wisely)',
    shortTitle: 'AI Tools (Use Wisely)',
    icon: 'sparkles-outline',
    content: `AI saves time, not thinking

CapCut AI can help with:

• Auto captions
• Background removal
• Long video → short clips
• Text-to-speech

Universe reminder:

AI helps execution.
You decide the message.`,
    takeaway: 'AI helps execution. You decide the message.',
  },
  {
    id: 9,
    title: 'Screen 9 — Repurpose Content',
    shortTitle: 'Repurpose Content',
    icon: 'copy-outline',
    content: `One idea, many posts

CapCut can:

• Analyze long videos
• Extract key moments
• Turn them into short clips

Repurposing helps you post consistently without burnout.`,
    takeaway:
      'Repurposing helps you post consistently without burnout.',
  },
  {
    id: 10,
    title: 'Screen 10 — Export Your Video',
    shortTitle: 'Export Your Video',
    icon: 'download-outline',
    content: `Finish strong

Before exporting:

• Watch the full video once
• Check captions
• Check audio balance

Export settings:

• Vertical (9:16)
• High quality
• Social-media ready`,
  },
];

// 2-screen flow for "Tools and Softwares"
const TOOLS_AND_SOFTWARES_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: '🎥 Filming Equipment (What You Need to Start)',
    shortTitle: 'Filming Equipment (What You Need to Start)',
    icon: 'videocam-outline',
    content: `Your phone is enough.

You do not need:

• Expensive cameras
• Studio lighting
• Professional microphones

Many creators with millions of followers reached their first major milestones using only a phone.

What actually matters:

• Clear framing
• Stable shots
• Speaking clearly

Optional upgrade (recommended):

Tripod

• Stabilizes your phone
• Makes filming easier and faster
• Helps with talking-head and storytelling videos`,
  },
  {
    id: 2,
    title: '✂️ Editing Software (What to Edit With)',
    shortTitle: 'Editing Software (What to Edit With)',
    icon: 'cut-outline',
    content: `Choose tools based on your level.

You don't need complicated software to grow —
just the right tool for your stage.

Beginner-friendly:

CapCut

• Easy to learn
• Fast edits
• Perfect for Reels & TikTok

Intermediate / Advanced:

DaVinci Resolve

• More control
• Professional-level editing
• Best for complex or long-form videos

Platform-native editing (recommended):

Instagram Editor

• Instagram tends to promote creators who use its own tools
• Great for quick trims, text, and music`,
  },
];

// 3-screen flow for "How to Optimize Filming"
const HOW_TO_OPTIMIZE_FILMING_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'Framing',
    shortTitle: 'Framing',
    icon: 'scan-outline',
    content: `Danger vs Safe Zones

• Make sure everything important avoids the danger zone
• Put text and graphics in the safe zone

Additional tips:

• Film in 4K gives you flexibility when editing
• Have enough headspace for text!`,
    takeaway:
      'Keep key elements in the safe zone. Film in 4K and leave headspace for text.',
  },
  {
    id: 2,
    title: 'Lighting',
    shortTitle: 'Lighting',
    icon: 'sunny-outline',
    content: `Good lighting:

• Light facing you
• Minimal shadows
• Clear expressions
• Engaging

Bad lighting:

• Harsh shadows
• Uneven skin tones
• Dark areas
• Hard to focus on you

Natural lighting or a ring light gives your video a more professional look.

Natural light:

• Face a window
• Light should hit you from the front
• Creates a soft, natural look

Ring light:

• Place it at eye level
• Keep it directly in front of you
• Avoid harsh brightness

Good equipment:

• LED panel
• Portable light`,
    takeaway:
      'Face your light source. Natural light or a ring light at eye level creates a professional look.',
  },
  {
    id: 3,
    title: 'Audio',
    shortTitle: 'Audio',
    icon: 'mic-outline',
    content: `Keep your audio volume consistent & reduce background noise.

If speaking to the camera or doing a voiceover, make sure your backing audio isn't overpowering.

Good equipment:

• DJI mic mini
• RODE Wireless GO`,
    takeaway:
      "Keep volume consistent. Don't let backing audio overpower your voice.",
  },
];

// 3-screen flow for "Batch Editing Tips"
const BATCH_EDITING_TIPS_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'Create Reusable Templates',
    shortTitle: 'Create Reusable Templates',
    icon: 'copy-outline',
    content: `Templates are the biggest hack for editing at speed.

You can use pre-made templates, or create your own.

You can also create templates for:
• Caption styles
• Save your favorite sound effects
• And more`,
    takeaway: 'Templates = speed. Build once, use many times.',
  },
  {
    id: 2,
    title: 'Use Auto-Captions',
    shortTitle: 'Use Auto-Captions',
    icon: 'chatbubbles-outline',
    content: `Creating captions manually from scratch is the biggest time-waster when editing.

Use auto-caption tools built into editing apps and lightly clean them up.`,
    takeaway: 'Auto-captions + light cleanup. Never type from scratch.',
  },
  {
    id: 3,
    title: "Don't Aim for Perfection",
    shortTitle: "Don't Aim for Perfection",
    icon: 'timer-outline',
    content: `Perfection kills speed.

Set a time limit on the edit to stop yourself overthinking and letting perfectionism stop you from finishing the content.

Time limits to try:

• 1 hour: script 3 videos
• 1 hour: film 3 videos
• 1 hour: edit 3 videos`,
    takeaway: 'Set limits. Done is better than perfect.',
  },
];

const HOW_TO_EDIT_CONTENT: { [key: string]: string } = {};

// 12-screen flow for "How to Use Davinci Resolve"
const HOW_TO_USE_DAVINCI_RESOLVE_FLOW_SCREENS: Array<{
  id: number;
  title: string;
  shortTitle: string;
  icon: string;
  content: string;
  takeaway?: string;
}> = [
  {
    id: 1,
    title: 'Screen 1 — Open & Create a New Project',
    shortTitle: 'Open & Create a New Project',
    icon: 'add-circle-outline',
    content: `Start Your Resolve Project

• Open DaVinci Resolve on your computer.
• In the Project Manager, click New Project.
• Give your project a name and confirm.

This sets up your workspace for editing.`,
  },
  {
    id: 2,
    title: 'Screen 2 — Set Basic Project Settings',
    shortTitle: 'Set Basic Project Settings',
    icon: 'settings-outline',
    content: `Match Your Timeline to Your Footage

Before importing clips:

• Click the gear icon (bottom right).
• Set Timeline Frame Rate to match your video (e.g., 24, 25, 30fps).
• Set Timeline Resolution (e.g., 1080p or 4K).

This helps prevent scaling or speed mismatches later.`,
  },
  {
    id: 3,
    title: 'Screen 3 — Import Media',
    shortTitle: 'Import Media',
    icon: 'folder-open-outline',
    content: `Bring Your Footage Into Resolve

• Go to the Media page.
• Locate your files on your computer.
• Drag clips into the Media Pool.

Your footage is now ready for editing.`,
  },
  {
    id: 4,
    title: 'Screen 4 — Understand the Workspace',
    shortTitle: 'Understand the Workspace',
    icon: 'grid-outline',
    content: `Know the Key Pages

At the bottom of Resolve you'll see these tabs:

• Media — import & organize clips
• Cut — quick edits
• Edit — full editing timeline
• Fusion — visual effects
• Color — color correction
• Fairlight — audio editing
• Deliver — export your final video

Each page is part of the editing workflow.`,
  },
  {
    id: 5,
    title: 'Screen 5 — Add Clips to the Timeline',
    shortTitle: 'Add Clips to the Timeline',
    icon: 'film-outline',
    content: `Build Your Story

• Switch to the Edit page.
• Drag clips from the Media Pool onto the timeline.
• Move them into order to tell your story.

This constructs the sequence viewers will watch.`,
  },
  {
    id: 6,
    title: 'Screen 6 — Trim & Cut Clips',
    shortTitle: 'Trim & Cut Clips',
    icon: 'cut-outline',
    content: `Edit Like a Pro

On the timeline:

• Use the Blade (B) tool to cut clips.
• Use the Select (A) tool to move or delete parts.
• Trim unwanted frames from the start or end.

Short, tight edits keep viewers engaged.`,
  },
  {
    id: 7,
    title: 'Screen 7 — Add B-Roll & Graphics',
    shortTitle: 'Add B-Roll & Graphics',
    icon: 'layers-outline',
    content: `Add Supporting Clips

To add b-roll (extra footage) or lower thirds:

• Import media the same way.
• Place it on a track above your main video.
• Adjust length and position on the timeline.

This adds visual variety.`,
  },
  {
    id: 8,
    title: 'Screen 8 — Add Text & Titles',
    shortTitle: 'Add Text & Titles',
    icon: 'text-outline',
    content: `Communicate Clearly With Text

• In the Effects Library, find Titles.
• Drag a title to the timeline.
• Customize the text in the inspector panel.

Text helps explain context and reinforce key ideas.`,
  },
  {
    id: 9,
    title: 'Screen 9 — Add Transitions & Effects',
    shortTitle: 'Add Transitions & Effects',
    icon: 'swap-horizontal-outline',
    content: `Smooth Cuts & Visual Interest

To create smooth scene changes:

• Open Effects Library
• Choose a transition (e.g., Cross Dissolve)
• Drag it between clips on the timeline

Use transitions sparingly for clarity.`,
  },
  {
    id: 10,
    title: 'Screen 10 — Adjust Audio (Fairlight)',
    shortTitle: 'Adjust Audio (Fairlight)',
    icon: 'volume-high-outline',
    content: `Make Your Sound Better

• Switch to the Fairlight page.
• Adjust volume for clips.
• Use tools for noise reduction and balance.

Good audio makes your videos feel more polished.`,
  },
  {
    id: 11,
    title: 'Screen 11 — Basic Color Correction',
    shortTitle: 'Basic Color Correction',
    icon: 'color-palette-outline',
    content: `Improve Your Look

• Go to the Color page.
• Use Color Wheels to adjust:

• Exposure
• Contrast
• Saturation

Color correction boosts visual impact.`,
  },
  {
    id: 12,
    title: 'Screen 12 — Review & Export (Deliver)',
    shortTitle: 'Review & Export (Deliver)',
    icon: 'download-outline',
    content: `Export Your Final Video

• Click the Deliver page.
• Choose format (e.g., MP4).
• Set resolution & quality.
• Click Add to Render Queue > Start Render.

Your video is now ready to share.`,
  },
];

export default function HowToEditDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [capcutStep, setCapcutStep] = useState(1);
  const [davinciStep, setDavinciStep] = useState(1);
  const [toolsStep, setToolsStep] = useState(1);
  const [filmingStep, setFilmingStep] = useState(1);
  const [batchEditingStep, setBatchEditingStep] = useState(1);

  // 2-screen flow for "Tools and Softwares"
  if (id === 'tools-and-softwares') {
    const currentScreen = TOOLS_AND_SOFTWARES_FLOW_SCREENS[toolsStep - 1];
    const isLastScreen =
      toolsStep === TOOLS_AND_SOFTWARES_FLOW_SCREENS.length;

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
                {toolsStep} / {TOOLS_AND_SOFTWARES_FLOW_SCREENS.length}
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
                    setToolsStep(toolsStep + 1);
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

  // 10-screen flow for "How to Use Capcut"
  if (id === 'how-to-use-capcut') {
    const currentScreen = HOW_TO_USE_CAPCUT_FLOW_SCREENS[capcutStep - 1];
    const isLastScreen =
      capcutStep === HOW_TO_USE_CAPCUT_FLOW_SCREENS.length;

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
                {capcutStep} / {HOW_TO_USE_CAPCUT_FLOW_SCREENS.length}
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
                    setCapcutStep(capcutStep + 1);
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

  // 12-screen flow for "How to Use Davinci Resolve"
  if (id === 'how-to-use-davinci-resolve') {
    const currentScreen =
      HOW_TO_USE_DAVINCI_RESOLVE_FLOW_SCREENS[davinciStep - 1];
    const isLastScreen =
      davinciStep === HOW_TO_USE_DAVINCI_RESOLVE_FLOW_SCREENS.length;

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
                {davinciStep} / {HOW_TO_USE_DAVINCI_RESOLVE_FLOW_SCREENS.length}
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
                    setDavinciStep(davinciStep + 1);
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

  // 3-screen flow for "How to Optimize Filming"
  if (id === 'how-to-optimize-filming') {
    const currentScreen =
      HOW_TO_OPTIMIZE_FILMING_FLOW_SCREENS[filmingStep - 1];
    const isLastScreen =
      filmingStep === HOW_TO_OPTIMIZE_FILMING_FLOW_SCREENS.length;

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
                {filmingStep} / {HOW_TO_OPTIMIZE_FILMING_FLOW_SCREENS.length}
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
                    setFilmingStep(filmingStep + 1);
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

  // 3-screen flow for "Batch Editing Tips"
  if (id === 'batch-editing-tips') {
    const currentScreen =
      BATCH_EDITING_TIPS_FLOW_SCREENS[batchEditingStep - 1];
    const isLastScreen =
      batchEditingStep === BATCH_EDITING_TIPS_FLOW_SCREENS.length;

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
                {batchEditingStep} / {BATCH_EDITING_TIPS_FLOW_SCREENS.length}
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
                    setBatchEditingStep(batchEditingStep + 1);
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
    HOW_TO_EDIT_CONTENT[id || ''] || 'Content not found.';
  const option = HOW_TO_EDIT_OPTIONS.find((opt) => opt.id === id);

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
              {option?.title || 'How to Edit & Film'}
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
  // Flow (same design as Use Hooks / Understanding Audience)
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
