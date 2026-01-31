import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { UniverseBackground } from '../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../utils/soundEffects';

const PROMPT_TEMPLATE = `Act as a short-for video scriptwriter for Reels/TikTok/Shorts. Write a 45 second script in a Hook → Value → Payoff → CTA structure. 

Input (fill these in)
Topic: [what the video is about] 
Target viewer: [who it's for + what they want]
Core promise: [the result/benefit]
3 key points: [point 1], [point 2], [point 3]
Proof/credibility (optional): [quick proof]
Tone: [bold/ friendly /deadpan / luxury / etc.]
CTA goal: [follow / comment / DM / click link / save / share]
Platform: [TikTok or Reels]

Requirements: 
Start with a hook in the first 1 - 2 seconds.
Keep sentences short and speakable. Write like a human talking.
Include simple on-screen text cues in brackets.
Include quick b-roll/shot ideas in parentheses. 
Avoid generic advice: make it specific and actionable. 
End with a clear CTA tied to the topic. 
Provide 3 hook options + 1 final script 

Output format
Hook options (3):
Hook A: 
Hook B: 
Hook C: 
Final script:
HOOK: 
VALUE: 
PAYOFF:
CTA:
`;

function buildPrompt(values: {
  topic: string;
  targetViewer: string;
  corePromise: string;
  keyPoint1: string;
  keyPoint2: string;
  keyPoint3: string;
  proofCredibility: string;
  tone: string;
  ctaGoal: string;
  platform: string;
}): string {
  return PROMPT_TEMPLATE
    .replace('[what the video is about]', values.topic || '[what the video is about]')
    .replace('[who it\'s for + what they want]', values.targetViewer || '[who it\'s for + what they want]')
    .replace('[the result/benefit]', values.corePromise || '[the result/benefit]')
    .replace('[point 1]', values.keyPoint1 || '[point 1]')
    .replace('[point 2]', values.keyPoint2 || '[point 2]')
    .replace('[point 3]', values.keyPoint3 || '[point 3]')
    .replace('[quick proof]', values.proofCredibility || '[quick proof]')
    .replace('[bold/ friendly /deadpan / luxury / etc.]', values.tone || '[bold/ friendly /deadpan / luxury / etc.]')
    .replace('[follow / comment / DM / click link / save / share]', values.ctaGoal || '[follow / comment / DM / click link / save / share]')
    .replace('[TikTok or Reels]', values.platform || '[TikTok or Reels]');
}

export default function AutoScriptGeneratorScreen() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [targetViewer, setTargetViewer] = useState('');
  const [corePromise, setCorePromise] = useState('');
  const [keyPoint1, setKeyPoint1] = useState('');
  const [keyPoint2, setKeyPoint2] = useState('');
  const [keyPoint3, setKeyPoint3] = useState('');
  const [proofCredibility, setProofCredibility] = useState('');
  const [tone, setTone] = useState('');
  const [ctaGoal, setCtaGoal] = useState('');
  const [platform, setPlatform] = useState('');

  const handleCopy = useCallback(async () => {
    playClickSound();
    const prompt = buildPrompt({
      topic,
      targetViewer,
      corePromise,
      keyPoint1,
      keyPoint2,
      keyPoint3,
      proofCredibility,
      tone,
      ctaGoal,
      platform,
    });
    try {
      await Clipboard.setStringAsync(prompt);
      Alert.alert(
        'Copied!',
        'The prompt has been copied to your clipboard. Paste it into ChatGPT to generate your script.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  }, [topic, targetViewer, corePromise, keyPoint1, keyPoint2, keyPoint3, proofCredibility, tone, ctaGoal, platform]);

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
            <Ionicons name="arrow-back" size={22} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Auto-Script Generator</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            Fill in your ideas below, then tap Copy to Clipboard to paste into ChatGPT.
          </Text>

          <View style={styles.card}>
            <View style={styles.sectionTitle}>
              <View style={styles.sectionIcon}>
                <Ionicons name="create-outline" size={18} color="#FFD700" />
              </View>
              <Text style={styles.sectionLabel}>INPUT</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Topic</Text>
              <TextInput
                style={styles.input}
                value={topic}
                onChangeText={setTopic}
                placeholder="what the video is about"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Target viewer</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={targetViewer}
                onChangeText={setTargetViewer}
                placeholder="who it's for + what they want"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Core promise</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={corePromise}
                onChangeText={setCorePromise}
                placeholder="the result/benefit"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>3 key points</Text>
              <TextInput
                style={styles.input}
                value={keyPoint1}
                onChangeText={setKeyPoint1}
                placeholder="Point 1"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
              <TextInput
                style={[styles.input, styles.inputRow]}
                value={keyPoint2}
                onChangeText={setKeyPoint2}
                placeholder="Point 2"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
              <TextInput
                style={[styles.input, styles.inputRow]}
                value={keyPoint3}
                onChangeText={setKeyPoint3}
                placeholder="Point 3"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Proof/credibility (optional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={proofCredibility}
                onChangeText={setProofCredibility}
                placeholder="quick proof"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.field, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Tone</Text>
                <TextInput
                  style={styles.input}
                  value={tone}
                  onChangeText={setTone}
                  placeholder="bold, friendly, deadpan, etc."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                />
              </View>
              <View style={[styles.field, styles.fieldHalf]}>
                <Text style={styles.fieldLabel}>Platform</Text>
                <TextInput
                  style={styles.input}
                  value={platform}
                  onChangeText={setPlatform}
                  placeholder="TikTok or Reels"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>CTA goal</Text>
              <TextInput
                style={styles.input}
                value={ctaGoal}
                onChangeText={setCtaGoal}
                placeholder="follow, comment, DM, click link, save, share"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopy}
            activeOpacity={0.85}
          >
            <Ionicons name="copy-outline" size={22} color="#0a0e27" />
            <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Paste the copied prompt into ChatGPT to generate your 45-second script with 3 hook options.
          </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '700',
    color: '#FFD700',
  },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(60, 45, 90, 0.5)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: { marginRight: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1,
  },
  field: { marginBottom: 16 },
  fieldHalf: { flex: 1, marginHorizontal: 4 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputRow: { marginTop: 8 },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  row: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  copyButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  copyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e27',
  },
  hint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
