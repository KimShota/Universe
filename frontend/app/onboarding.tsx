import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UniverseBackground } from '../components/UniverseBackground';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { playClickSound } from '../utils/soundEffects';


const ONBOARDING_DONE_KEY = 'onboarding:done';
const ONBOARDING_BRANCH_KEY = 'onboarding:branch';
const ONBOARDING_PRIMARY_STRUGGLE_KEY = 'onboarding:primaryStruggle';
const ONBOARDING_PRIMARY_ISSUE_KEY = 'onboarding:primaryIssueId';
const ONBOARDING_DRAFT_KEY = 'onboarding:draft';

type Branch = 'first_time' | 'stuck_creator';

const JOURNEY_OPTIONS: { id: Branch; title: string }[] = [
  { id: 'first_time', title: 'This is my first time creating content online.' },
  { id: 'stuck_creator', title: "I’m confident posting content, but I can’t post consistently or see results." },
];

const SOS_CHOICES: { id: 'judgment' | 'clarity' | 'camera' | 'overwhelmed'; title: string; issueId: string }[] = [
  { id: 'judgment', title: 'Fear of judgment', issueId: 'reactions' },
  { id: 'clarity', title: 'No clarity on what to post', issueId: 'stuck' },
  { id: 'camera', title: 'No confidence on camera', issueId: 'reactions' },
  { id: 'overwhelmed', title: "Overwhelmed / don’t know where to start", issueId: 'tired' },
];

const REGION_LAYOUT: string[][] = [
  ['North America'],
  ['South America'],
  ['Europe', 'Asia'],
  ['Africa', 'Oceania'],
  ['Middle East'],
];

function parseStep(raw: unknown): 1 | 2 | 3 | 4 | 5 {
  const s = typeof raw === 'string' ? Number(raw) : 1;
  if (s === 2 || s === 3 || s === 4 || s === 5) return s;
  return 1;
}

export default function OnboardingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string; issueId?: string }>();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(() => parseStep(params.step));

  const [branch, setBranch] = useState<Branch | null>(null);
  const [primaryStruggle, setPrimaryStruggle] = useState<string | null>(null);
  const [primaryIssueId, setPrimaryIssueId] = useState<string | null>(null);

  // Creator Universe setup (3 pages)
  // Page 1 — Identity & Message
  const [messageEthos, setMessageEthos] = useState('');
  const [skillPeopleComeFor, setSkillPeopleComeFor] = useState('');
  const [passion, setPassion] = useState('');
  const [currentStruggle, setCurrentStruggle] = useState('');
  const [interest, setInterest] = useState('');

  // Page 2 — Target Avatar
  const [regions, setRegions] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [genderMale, setGenderMale] = useState('');
  const [genderFemale, setGenderFemale] = useState('');
  const [profession, setProfession] = useState('');
  const [avatarStruggle, setAvatarStruggle] = useState('');
  const [avatarDesire, setAvatarDesire] = useState('');
  const [avatarCreators, setAvatarCreators] = useState('');

  // Page 3 — Personal Story & Strength
  const [struggledWith, setStruggledWith] = useState('');
  const [passionateNow, setPassionateNow] = useState('');
  const [experience, setExperience] = useState('');
  const [goodAt, setGoodAt] = useState('');

  const { width } = Dimensions.get('window');
  const contentMaxWidth = useMemo(() => Math.min(width - 32, 520), [width]);

  const buildDraft = () => ({
    branch,
    primaryStruggle,
    primaryIssueId,
    messageEthos,
    skillPeopleComeFor,
    passion,
    currentStruggle,
    interest,
    regions,
    ageMin,
    ageMax,
    genderMale,
    genderFemale,
    profession,
    avatarStruggle,
    avatarDesire,
    avatarCreators,
    struggledWith,
    passionateNow,
    experience,
    goodAt,
  });

  const persistDraft = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(buildDraft()));
    } catch {
      // ignore
    }
  };

  const goToStep = async (next: 1 | 2 | 3 | 4 | 5) => {
    await persistDraft();
    setStep(next);
  };

  const toggleRegion = (r: string) => {
    setRegions((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  useEffect(() => {
    (async () => {
      try {
        const b = await AsyncStorage.getItem(ONBOARDING_BRANCH_KEY);
        const ps = await AsyncStorage.getItem(ONBOARDING_PRIMARY_STRUGGLE_KEY);
        const pi = await AsyncStorage.getItem(ONBOARDING_PRIMARY_ISSUE_KEY);
        const draftRaw = await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY);
        if (b === 'first_time' || b === 'stuck_creator') setBranch(b);
        if (ps) setPrimaryStruggle(ps);
        if (pi) setPrimaryIssueId(pi);

        if (draftRaw) {
          try {
            const d = JSON.parse(draftRaw);
            if (d && typeof d === 'object') {
              if (d.branch === 'first_time' || d.branch === 'stuck_creator') setBranch(d.branch);
              if (typeof d.primaryStruggle === 'string') setPrimaryStruggle(d.primaryStruggle);
              if (typeof d.primaryIssueId === 'string') setPrimaryIssueId(d.primaryIssueId);
              if (typeof d.messageEthos === 'string') setMessageEthos(d.messageEthos);
              if (typeof d.skillPeopleComeFor === 'string') setSkillPeopleComeFor(d.skillPeopleComeFor);
              if (typeof d.passion === 'string') setPassion(d.passion);
              if (typeof d.currentStruggle === 'string') setCurrentStruggle(d.currentStruggle);
              if (typeof d.interest === 'string') setInterest(d.interest);
              if (Array.isArray(d.regions)) setRegions(d.regions);
              if (typeof d.ageMin === 'string') setAgeMin(d.ageMin);
              if (typeof d.ageMax === 'string') setAgeMax(d.ageMax);
              if (typeof d.genderMale === 'string') setGenderMale(d.genderMale);
              if (typeof d.genderFemale === 'string') setGenderFemale(d.genderFemale);
              if (typeof d.avatarStruggle === 'string') setAvatarStruggle(d.avatarStruggle);
              if (typeof d.avatarDesire === 'string') setAvatarDesire(d.avatarDesire);
              if (typeof d.avatarCreators === 'string') setAvatarCreators(d.avatarCreators);
              if (typeof d.struggledWith === 'string') setStruggledWith(d.struggledWith);
              if (typeof d.passionateNow === 'string') setPassionateNow(d.passionateNow);
              if (typeof d.experience === 'string') setExperience(d.experience);
              if (typeof d.goodAt === 'string') setGoodAt(d.goodAt);
            }
          } catch {
            // ignore
          }
        }

        // Prefill the “currently struggling with” field when returning from SOS.
        if (!currentStruggle && ps) {
          setCurrentStruggle(ps);
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When returning from other screens, allow external navigation to set the initial step.
    setStep(parseStep(params.step));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.step]);

  useEffect(() => {
    // Guard: branch B should not stay on SOS step
    if (step === 2 && branch === 'stuck_creator') {
      setStep(3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, branch]);

  const completeOnboarding = async () => {
    playClickSound();
    try {
      if (!user?.id) {
        router.replace('/(tabs)/main');
        return;
      }
      const content_pillars = [
        { title: skillPeopleComeFor.trim() || 'Content Pillar 1', ideas: [] as string[] },
        { title: passion.trim() || 'Content Pillar 2', ideas: [] as string[] },
        { title: currentStruggle.trim() || 'Content Pillar 3', ideas: [] as string[] },
        { title: interest.trim() || 'Content Pillar 4', ideas: [] as string[] },
      ];
      const avatar = {
        demographic: {
          region: regions,
          ageMin,
          ageMax,
          genderMale,
          genderFemale,
          profession,
        },
        psychographic: {
          struggle: avatarStruggle.trim(),
          desire: avatarDesire.trim(),
          creators: avatarCreators.trim(),
        },
      };
      const identity = {
        pain: [struggledWith].map((s) => s.trim()).filter(Boolean),
        passion: [passionateNow].map((s) => s.trim()).filter(Boolean),
        experience: [experience].map((s) => s.trim()).filter(Boolean),
        skill: [goodAt].map((s) => s.trim()).filter(Boolean),
      };

      const { error } = await supabase.from('creator_universe').upsert(
        {
          user_id: user.id,
          overarching_goal: messageEthos.trim(),
          content_pillars,
          avatar,
          identity,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('Onboarding save failed:', error);
      } else {
        await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
        await AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY).catch(() => {});
      }
    } catch (e) {
      console.error('Onboarding complete error:', e);
    }
    router.replace('/(tabs)/main');
  };

  const header = (
    <View style={styles.header}>
      {step > 1 ? (
        <TouchableOpacity
          onPress={async () => {
            playClickSound();
            if (step === 3 && branch === 'stuck_creator') {
              await goToStep(1);
              return;
            }
            await goToStep((step - 1) as 1 | 2 | 3 | 4 | 5);
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerSpacer} />
      )}

      <View style={styles.progressDots}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity
        onPress={async () => {
          playClickSound();
          await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
          await AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY).catch(() => {});
          router.replace('/(tabs)/main');
        }}
        style={styles.skipButton}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        {header}

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16 }]}>
          <View style={[styles.card, { width: '100%', maxWidth: contentMaxWidth }]}>
            {step === 1 && (
              <>
                <Text style={styles.title}>Where are you in your creator journey right now?</Text>
                <Text style={styles.subtitle}>Pick one to continue.</Text>

                <View style={styles.optionList}>
                  {JOURNEY_OPTIONS.map((o) => {
                    const active = branch === o.id;
                    return (
                      <TouchableOpacity
                        key={o.id}
                        style={[styles.optionButton, active && styles.optionButtonActive]}
                        onPress={() => {
                          playClickSound();
                          setBranch(o.id);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.optionText, active && styles.optionTextActive]}>{o.title}</Text>
                        {active && <Ionicons name="checkmark-circle" size={20} color="#FFD700" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, !branch && styles.primaryButtonDisabled]}
                  disabled={!branch}
                  onPress={async () => {
                    if (!branch) return;
                    playClickSound();
                    try {
                      await AsyncStorage.setItem(ONBOARDING_BRANCH_KEY, branch);
                    } catch {
                      // ignore
                    }
                    if (branch === 'first_time') {
                      await goToStep(2);
                    } else {
                      await goToStep(3);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#0a0e27" />
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={styles.title}>What are you struggling with the most right now?</Text>
                <Text style={styles.subtitle}>Pick one — we’ll guide you into the SOS flow first.</Text>

                <View style={styles.optionList}>
                  {SOS_CHOICES.map((o) => {
                    const active = primaryStruggle === o.title;
                    return (
                      <TouchableOpacity
                        key={o.id}
                        style={[styles.optionButton, active && styles.optionButtonActive]}
                        onPress={() => {
                          playClickSound();
                          setPrimaryStruggle(o.title);
                          setPrimaryIssueId(o.issueId);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.optionText, active && styles.optionTextActive]}>{o.title}</Text>
                        {active && <Ionicons name="checkmark-circle" size={20} color="#FFD700" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, !primaryIssueId && styles.primaryButtonDisabled]}
                  disabled={!primaryIssueId}
                  onPress={async () => {
                    if (!primaryIssueId || !primaryStruggle) return;
                    playClickSound();
                    try {
                      await AsyncStorage.setItem(ONBOARDING_PRIMARY_STRUGGLE_KEY, primaryStruggle);
                      await AsyncStorage.setItem(ONBOARDING_PRIMARY_ISSUE_KEY, primaryIssueId);
                    } catch {
                      // ignore
                    }
                    await persistDraft();
                    router.push({
                      pathname: `/sos/${primaryIssueId}` as any,
                      params: { onboarding: '1' },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#0a0e27" />
                </TouchableOpacity>
              </>
            )}

            {step === 3 && (
              <>
                <Text style={styles.title}>Creator Universe Setup</Text>
                <Text style={styles.subtitle}>Page 1 of 3 — Identity & Message</Text>

                <Text style={styles.fieldLabel}>What is your message or ethos?</Text>
                <TextInput
                  style={styles.input}
                  value={messageEthos}
                  onChangeText={setMessageEthos}
                  placeholder="Write your message in one sentence"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />
                <Text style={styles.fieldLabel}>What is your skill that people come to you for?</Text>
                <TextInput
                  style={styles.input}
                  value={skillPeopleComeFor}
                  onChangeText={setSkillPeopleComeFor}
                  placeholder="One skill you can teach"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />
                <Text style={styles.fieldLabel}>What is your passion?</Text>
                <TextInput
                  style={styles.input}
                  value={passion}
                  onChangeText={setPassion}
                  placeholder="What do you love creating about?"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />
                <Text style={styles.fieldLabel}>What are you currently struggling with?</Text>
                <TextInput
                  style={styles.input}
                  value={currentStruggle}
                  onChangeText={setCurrentStruggle}
                  placeholder="What’s holding you back right now?"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />
                <Text style={styles.fieldLabel}>What is your interest?</Text>
                <TextInput
                  style={styles.input}
                  value={interest}
                  onChangeText={setInterest}
                  placeholder="What topics or areas interest you?"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={async () => {
                    playClickSound();
                    await goToStep(4);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={18} color="#0a0e27" />
                </TouchableOpacity>
              </>
            )}

            {step === 4 && (
              <>
                <Text style={styles.title}>Creator Universe Setup</Text>
                <Text style={styles.subtitle}>Page 2 of 3 — Target Avatar</Text>

                <Text style={styles.fieldLabel}>Where is your target avatar from?</Text>
                <View style={styles.regionGrid}>
                  {REGION_LAYOUT.map((row, rowIndex) => (
                    <View
                      key={rowIndex}
                      style={row.length === 1 ? styles.regionRowSingle : styles.regionRowDouble}
                    >
                      {row.map((r) => {
                        const selected = regions.includes(r);
                        const small = row.length === 2;
                        return (
                          <TouchableOpacity
                            key={r}
                            style={[
                              styles.regionChip,
                              row.length === 1 ? styles.regionChipFull : styles.regionChipHalf,
                              small && styles.regionChipSmall,
                              selected && styles.regionChipSelected,
                            ]}
                            onPress={() => {
                              playClickSound();
                              toggleRegion(r);
                            }}
                            activeOpacity={0.85}
                          >
                            <Text
                              style={[
                                styles.regionText,
                                small && styles.regionTextSmall,
                                selected && styles.regionTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {r}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>How old is your target avatar?</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    value={ageMin}
                    onChangeText={setAgeMin}
                    placeholder="Min"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    value={ageMax}
                    onChangeText={setAgeMax}
                    placeholder="Max"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    keyboardType="number-pad"
                  />
                </View>

                <Text style={styles.fieldLabel}>What is the male and female ratio?</Text>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    value={genderMale}
                    onChangeText={setGenderMale}
                    placeholder="Male %"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    value={genderFemale}
                    onChangeText={setGenderFemale}
                    placeholder="Female %"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    keyboardType="number-pad"
                  />
                </View>

                <Text style={styles.fieldLabel}>What profession(s) does your target avatar have?</Text>
                <TextInput
                  style={styles.input}
                  value={profession}
                  onChangeText={setProfession}
                  placeholder="e.g. Entrepreneurs, marketers..."
                  placeholderTextColor="rgba(255,255,255,0.45)"
                />

                <Text style={styles.fieldLabel}>What does your target avatar struggle with?</Text>
                <TextInput
                  style={styles.input}
                  value={avatarStruggle}
                  onChangeText={setAvatarStruggle}
                  placeholder="Their main struggle"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />
                <Text style={styles.fieldLabel}>What does your target avatar desire?</Text>
                <TextInput
                  style={styles.input}
                  value={avatarDesire}
                  onChangeText={setAvatarDesire}
                  placeholder="Their desire"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />
                <Text style={styles.fieldLabel}>What other creators does your target avatar consume?</Text>
                <TextInput
                  style={styles.input}
                  value={avatarCreators}
                  onChangeText={setAvatarCreators}
                  placeholder="Who do they watch daily?"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={async () => {
                    playClickSound();
                    await goToStep(5);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={18} color="#0a0e27" />
                </TouchableOpacity>
              </>
            )}

            {step === 5 && (
              <>
                <Text style={styles.title}>Creator Universe Setup</Text>
                <Text style={styles.subtitle}>Page 3 of 3 — Personal Story & Strength</Text>

                <Text style={styles.fieldLabel}>What have you struggled with?</Text>
                <TextInput
                  style={styles.input}
                  value={struggledWith}
                  onChangeText={setStruggledWith}
                  placeholder="A real struggle you overcame"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />
                <Text style={styles.fieldLabel}>What are you passionate about right now?</Text>
                <TextInput
                  style={styles.input}
                  value={passionateNow}
                  onChangeText={setPassionateNow}
                  placeholder="What are you into right now?"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />
                <Text style={styles.fieldLabel}>What have you gone through or developed?</Text>
                <TextInput
                  style={styles.input}
                  value={experience}
                  onChangeText={setExperience}
                  placeholder="Qualifications, milestones, who you helped…"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />
                <Text style={styles.fieldLabel}>What are you good at?</Text>
                <Text style={styles.hintText}>What do people come to you for?</Text>
                <TextInput
                  style={styles.input}
                  value={goodAt}
                  onChangeText={setGoodAt}
                  placeholder="What can you teach?"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                />

                <TouchableOpacity style={styles.primaryButton} onPress={completeOnboarding} activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>Finish</Text>
                  <Ionicons name="checkmark" size={18} color="#0a0e27" />
                </TouchableOpacity>
              </>
            )}
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
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  progressDots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotActive: {
    backgroundColor: 'rgba(255,215,0,0.95)',
  },
  skipButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  skipText: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 24,
    alignItems: 'center',
  },
  card: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(18, 18, 28, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.22)',
  },
  title: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.14)',
    marginBottom: 10,
  },
  featureText: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '700',
  },
  optionList: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionButtonActive: {
    backgroundColor: 'rgba(255,215,0,0.10)',
    borderColor: 'rgba(255,215,0,0.55)',
  },
  optionText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '700',
    flex: 1,
  },
  optionTextActive: {
    color: '#FFD700',
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#0a0e27',
    fontWeight: '900',
    fontSize: 16,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 8,
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 16,
  },
  helper: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  fieldLabel: {
    color: 'rgba(255,215,0,0.95)',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  hintText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.25,
    borderColor: 'rgba(255,215,0,0.22)',
    borderRadius: 16,
    padding: 14,
    color: '#fff',
    minHeight: 52,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  regionGrid: {
    gap: 10,
  },
  regionRowSingle: {
    flexDirection: 'row',
    width: '100%',
  },
  regionRowDouble: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  regionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionChipFull: {
    flex: 1,
  },
  regionChipHalf: {
    flex: 1,
  },
  regionChipSmall: {
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  regionChipSelected: {
    backgroundColor: 'rgba(255,215,0,0.14)',
    borderColor: 'rgba(255,215,0,0.8)',
  },
  regionText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '800',
    fontSize: 13,
  },
  regionTextSmall: {
    fontSize: 12,
  },
  regionTextSelected: {
    color: '#FFD700',
  },
});

