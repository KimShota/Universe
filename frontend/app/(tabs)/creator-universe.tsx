import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
} from 'react-native';
import { UniverseBackground } from '../../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Svg, { Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { playClickSound } from '../../utils/soundEffects';

const { width, height } = Dimensions.get('window');
const INFO_PAGE_WIDTH = Math.min(width - 40, 500);

const REGION_LAYOUT: string[][] = [
  ['North America'],
  ['South America'],
  ['Europe', 'Asia'],
  ['Africa', 'Oceania'],
  ['Middle East'],
];

type ScreenType = 'vision' | 'avatar' | 'identity';
type InfoScreenType = 'why' | 'vision' | 'avatar' | 'identity';

export default function CreatorUniverseScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const infoScrollRef = useRef<ScrollView>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenType>('vision');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoActiveScreen, setInfoActiveScreen] = useState<InfoScreenType>('why');
  const [deleteModeVision, setDeleteModeVision] = useState(false);
  const [deleteModeAvatar, setDeleteModeAvatar] = useState(false);
  const [deleteModeIdentity, setDeleteModeIdentity] = useState(false);

  // Vision screen state
  const [goal, setGoal] = useState('');
  const [pillars, setPillars] = useState([
    { title: '', ideas: [''] },
    { title: '', ideas: [''] },
    { title: '', ideas: [''] },
    { title: '', ideas: [''] },
  ]);

  // Avatar screen state — region supports multiple selections
  const [demographic, setDemographic] = useState<{
    region: string[];
    ageMin: string;
    ageMax: string;
    genderMale: string;
    genderFemale: string;
    profession: string;
  }>({
    region: [],
    ageMin: '',
    ageMax: '',
    genderMale: '',
    genderFemale: '',
    profession: '',
  });
  const [psychographic, setPsychographic] = useState({
    struggle: '',
    desire: '',
    creators: '',
  });
  const MIN_PROFESSION_HEIGHT = 56;
  const [professionHeight, setProfessionHeight] = useState(MIN_PROFESSION_HEIGHT);

  // Identity screen state — start with 0 boxes per category; users add via + like Vision
  const [identity, setIdentity] = useState<{
    pain: string[];
    passion: string[];
    experience: string[];
    skill: string[];
  }>({
    pain: [],
    passion: [],
    experience: [],
    skill: [],
  });

  const loadUniverse = useCallback(async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('creator_universe')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) {
        const defaultPillars = [
          { title: 'Content Pillar 1', ideas: [] as string[] },
          { title: 'Content Pillar 2', ideas: [] as string[] },
          { title: 'Content Pillar 3', ideas: [] as string[] },
          { title: 'Content Pillar 4', ideas: [] as string[] },
        ];
        await supabase.from('creator_universe').insert({
          user_id: user.id,
          overarching_goal: '',
          content_pillars: defaultPillars,
        });
        setGoal('');
        setPillars(defaultPillars.map((p) => ({ title: p.title, ideas: p.ideas.length ? p.ideas : [''] })));
        return;
      }
      
      // Vision
      setGoal(data.overarching_goal || '');
      if (data.content_pillars && data.content_pillars.length > 0) {
        const normalized = data.content_pillars.map((p: { title?: string; ideas?: string[] }) => {
          const t = (p.title || '').trim();
          const isPlaceholder = /^Content Pillar \d+$/i.test(t);
          return {
            title: isPlaceholder ? '' : (p.title || ''),
            ideas: p.ideas && p.ideas.length > 0 ? p.ideas : [''],
          };
        });
        setPillars(normalized);
      }
      
      // Avatar — support legacy audience
      const avatarRaw = data as { avatar?: { demographic?: Record<string, unknown>; psychographic?: { struggle?: string; desire?: string; creators?: string } }; audience?: { demographic?: Record<string, unknown>; psychographic?: { struggle?: string; desire?: string; creators?: string } } };
      const avatarData = avatarRaw.avatar ?? avatarRaw.audience;
      if (avatarData) {
        const d = avatarData.demographic || {};
        const r = (d as { region?: unknown }).region;
        const regionArr = Array.isArray(r) ? r as string[] : typeof r === 'string' && r.trim() ? [r.trim()] : [];
        setDemographic({
          region: regionArr,
          ageMin: String((d as { ageMin?: string }).ageMin ?? ''),
          ageMax: String((d as { ageMax?: string }).ageMax ?? ''),
          genderMale: String((d as { genderMale?: string }).genderMale ?? ''),
          genderFemale: String((d as { genderFemale?: string }).genderFemale ?? ''),
          profession: String((d as { profession?: string }).profession ?? ''),
        });
        const psych = avatarData.psychographic;
        setPsychographic({ struggle: psych?.struggle ?? '', desire: psych?.desire ?? '', creators: psych?.creators ?? '' });
      }
      
      // Identity — start with 0 boxes; normalize legacy "3 empty" default to []; support legacy edge
      const identityRaw = data as { identity?: Record<string, string[]>; edge?: { identity?: Record<string, string[]>; uniqueness?: Record<string, string[]> } };
      const identityData = identityRaw.identity ?? identityRaw.edge?.identity ?? identityRaw.edge?.uniqueness;
      if (identityData) {
        const norm = (arr: unknown): string[] => {
          if (!Array.isArray(arr)) return [];
          if (arr.length === 3 && arr.every((s) => s === '')) return [];
          return arr;
        };
        setIdentity({
          pain: norm(identityData.pain),
          passion: norm(identityData.passion),
          experience: norm(identityData.experience),
          skill: norm(identityData.skill),
        });
      }
    } catch (error) {
      console.error('Error loading universe:', error);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadUniverse();
    }, [loadUniverse])
  );

  const saveUniverse = async (overrides?: {
    overarching_goal?: string;
    demographic?: typeof demographic;
    psychographic?: typeof psychographic;
    identity?: typeof identity;
  }) => {
    try {
      if (!user?.id) return;
      const g = overrides?.overarching_goal ?? goal;
      const d = overrides?.demographic ?? demographic;
      const p = overrides?.psychographic ?? psychographic;
      const u = overrides?.identity ?? identity;
      await supabase
        .from('creator_universe')
        .upsert(
          {
            user_id: user.id,
            overarching_goal: g,
            content_pillars: pillars,
            avatar: { demographic: d, psychographic: p },
            identity: u,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
    } catch (error) {
      console.error('Error saving universe:', error);
    }
  };

  const handleScreenChange = (screen: ScreenType) => {
    playClickSound();
    setActiveScreen(screen);
    const screenIndex = screen === 'vision' ? 0 : screen === 'avatar' ? 1 : 2;
    scrollViewRef.current?.scrollTo({ x: screenIndex * width, animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const screenIndex = Math.round(offsetX / width);
    const screens: ScreenType[] = ['vision', 'avatar', 'identity'];
    setActiveScreen(screens[screenIndex]);
  };

  const handleInfoScreenChange = (screen: InfoScreenType) => {
    playClickSound();
    setInfoActiveScreen(screen);
    const i = screen === 'why' ? 0 : screen === 'vision' ? 1 : screen === 'avatar' ? 2 : 3;
    infoScrollRef.current?.scrollTo({ x: i * INFO_PAGE_WIDTH, animated: true });
  };

  const handleInfoScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const i = Math.min(Math.round(offsetX / INFO_PAGE_WIDTH), 3);
    const screens: InfoScreenType[] = ['why', 'vision', 'avatar', 'identity'];
    setInfoActiveScreen(screens[i] ?? 'why');
  };

  const openInfoModal = () => {
    playClickSound();
    setInfoActiveScreen('why');
    setShowInfoModal(true);
  };

  const onInfoModalShow = () => {
    infoScrollRef.current?.scrollTo({ x: 0, animated: false });
  };

  // Vision screen functions
  const updatePillarTitle = (index: number, title: string) => {
    const newPillars = [...pillars];
    newPillars[index].title = title;
    setPillars(newPillars);
  };

  const updateIdea = (pillarIndex: number, ideaIndex: number, text: string) => {
    const newPillars = [...pillars];
    newPillars[pillarIndex].ideas[ideaIndex] = text;
    setPillars(newPillars);
  };

  const addIdea = (pillarIndex: number) => {
    const current = pillars[pillarIndex].ideas;
    if (current.length >= 4) return;
    const newPillars = [...pillars];
    newPillars[pillarIndex].ideas = [...current, ''];
    setPillars(newPillars);
  };

  const removeIdea = (pillarIndex: number, ideaIndex: number) => {
    playClickSound();
    const newPillars = [...pillars];
    newPillars[pillarIndex].ideas.splice(ideaIndex, 1);
    setPillars(newPillars);
    saveUniverse();
  };

  const toggleDeleteMode = () => {
    playClickSound();
    if (activeScreen === 'vision') setDeleteModeVision((v) => !v);
    else if (activeScreen === 'avatar') setDeleteModeAvatar((v) => !v);
    else setDeleteModeIdentity((v) => !v);
  };

  const deleteModeActive =
    (activeScreen === 'vision' && deleteModeVision) ||
    (activeScreen === 'avatar' && deleteModeAvatar) ||
    (activeScreen === 'identity' && deleteModeIdentity);

  // Identity screen functions (mirror Vision: add/remove boxes per category)
  const updateIdentityField = (category: keyof typeof identity, index: number, value: string) => {
    const next = { ...identity };
    next[category] = [...next[category]];
    next[category][index] = value;
    setIdentity(next);
  };

  const addIdentityItem = (category: keyof typeof identity) => {
    if (identity[category].length >= 4) return;
    playClickSound();
    const next = { ...identity };
    next[category] = [...next[category], ''];
    setIdentity(next);
    saveUniverse({ identity: next });
  };

  const removeIdentityItem = (category: keyof typeof identity, index: number) => {
    playClickSound();
    const next = { ...identity };
    next[category] = next[category].filter((_, i) => i !== index);
    setIdentity(next);
    saveUniverse({ identity: next });
  };

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              playClickSound();
              router.push('/(tabs)/main');
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={26} color="#FFD700" />
          </TouchableOpacity>

          {/* Tab Buttons */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeScreen === 'vision' && styles.tabButtonActive]}
              onPress={() => handleScreenChange('vision')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeScreen === 'vision' && styles.tabTextActive]}>
                Vision
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeScreen === 'avatar' && styles.tabButtonActive]}
              onPress={() => handleScreenChange('avatar')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeScreen === 'avatar' && styles.tabTextActive]}>
                Avatar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeScreen === 'identity' && styles.tabButtonActive]}
              onPress={() => handleScreenChange('identity')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeScreen === 'identity' && styles.tabTextActive]}>
                Identity
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.deleteModeButton, deleteModeActive && styles.deleteModeButtonActive]}
            onPress={toggleDeleteMode}
          >
            <Ionicons
              name={deleteModeActive ? 'trash' : 'trash-outline'}
              size={24}
              color={deleteModeActive ? '#FFD700' : 'rgba(255, 255, 255, 0.6)'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpButton} onPress={openInfoModal}>
            <Ionicons name="help-circle-outline" size={26} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Scrollable Screens */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.horizontalScroll}
        >
          {/* Vision Screen */}
          <View style={styles.screen}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
              {/* Your Ethos */}
              <View style={styles.goalContainer}>
                <View style={styles.goalLabelRow}>
                  <Ionicons name="compass-outline" size={16} color="#FFD700" />
                  <Text style={styles.goalLabel}>Your Ethos</Text>
                </View>
                <TextInput
                  style={styles.goalInput}
                  value={goal}
                  onChangeText={setGoal}
                  onBlur={() => saveUniverse()}
                  placeholder="What's your main goal?"
                  placeholderTextColor="rgba(255, 255, 255, 0.45)"
                  multiline
                />
              </View>

              {/* Connection Lines from Goal to Pillars */}
              <View style={styles.connectionsContainer}>
                <Svg height="60" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.125} y2="60" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.375} y2="60" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.625} y2="60" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.875} y2="60" stroke="#FFD700" strokeWidth="3" />
                </Svg>
              </View>

              {/* Content Pillars Row */}
              <View style={styles.pillarsRow}>
                {pillars.map((pillar, index) => (
                  <View key={index} style={styles.pillarBox}>
                    <TextInput
                      style={styles.pillarTitle}
                      value={pillar.title}
                      onChangeText={(text) => updatePillarTitle(index, text)}
                      onBlur={() => saveUniverse()}
                      placeholder={`Content Pillar ${index + 1}`}
                      placeholderTextColor="rgba(255, 215, 0, 0.5)"
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                ))}
              </View>

              {/* Connection Lines from Pillars to Ideas */}
              <View style={styles.pillarConnectionsContainer}>
                <Svg height="40" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) * 0.125} y1="0" x2={(width - 40) * 0.125} y2="40" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) * 0.375} y1="0" x2={(width - 40) * 0.375} y2="40" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) * 0.625} y1="0" x2={(width - 40) * 0.625} y2="40" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) * 0.875} y1="0" x2={(width - 40) * 0.875} y2="40" stroke="#FFD700" strokeWidth="3" />
                </Svg>
              </View>

              {/* Ideas Grid */}
              <View style={styles.ideasRow}>
                {pillars.map((pillar, pillarIndex) => (
                  <View key={pillarIndex} style={styles.ideasColumn}>
                    {pillar.ideas.map((idea, ideaIndex) => (
                      <View key={ideaIndex} style={styles.ideaBoxWrapper}>
                        <View style={styles.ideaBox}>
                          <TextInput
                            style={styles.ideaInput}
                            value={idea}
                            onChangeText={(text) => updateIdea(pillarIndex, ideaIndex, text)}
                            onBlur={() => saveUniverse()}
                            placeholder="Idea"
                            placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            multiline
                          />
                        </View>
                        {deleteModeVision && (
                          <TouchableOpacity
                            style={styles.deleteIdeaButton}
                            onPress={() => removeIdea(pillarIndex, ideaIndex)}
                          >
                            <Ionicons name="close-circle" size={18} color="#ff4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    {pillar.ideas.length < 4 && (
                      <TouchableOpacity
                        style={styles.addIdeaButton}
                        onPress={() => {
                          addIdea(pillarIndex);
                          saveUniverse();
                        }}
                      >
                        <Ionicons name="add-circle-outline" size={20} color="#FFD700" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Avatar Screen */}
          <View style={styles.screen}>
            <ScrollView style={styles.scrollView} contentContainerStyle={[styles.contentContainer, styles.contentContainerAvatar]}>
              {/* Target Avatar */}
              <View style={[styles.goalContainer, styles.goalContainerAvatar]}>
                <View style={styles.goalLabelRow}>
                  <Ionicons name="people-outline" size={18} color="#FFD700" />
                  <Text style={[styles.goalLabel, styles.goalLabelAvatar]}>Target Avatar</Text>
                </View>
              </View>

              {/* Connection Lines from Target Avatar */}
              <View style={styles.connectionsContainer}>
                <Svg height="60" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.25} y2="60" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.75} y2="60" stroke="#FFD700" strokeWidth="3" />
                </Svg>
              </View>

              {/* Demographic and Psychographic Row */}
              <View style={styles.pillarsRow}>
                <View style={styles.avatarBox}>
                  <View style={styles.avatarCategoryHeader}>
                    <Ionicons name="earth-outline" size={14} color="#FFD700" />
                    <Text style={styles.pillarTitle}>Demographic</Text>
                  </View>
                </View>
                <View style={styles.avatarBox}>
                  <View style={styles.avatarCategoryHeader}>
                    <Ionicons name="heart-outline" size={14} color="#FFD700" />
                    <Text style={styles.pillarTitle}>Psychographic</Text>
                  </View>
                </View>
              </View>

              {/* Connection Lines from Categories to Inputs */}
              <View style={styles.pillarConnectionsContainer}>
                <Svg height="40" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) * 0.25} y1="0" x2={(width - 40) * 0.25} y2="40" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) * 0.75} y1="0" x2={(width - 40) * 0.75} y2="40" stroke="#FFD700" strokeWidth="3" />
                </Svg>
              </View>

              {/* Input Fields Grid */}
              <View style={[styles.ideasRow, styles.ideasRowAvatar]}>
                {/* Demographic Column */}
                <View style={styles.avatarColumn}>
                  <View style={styles.avatarPanel}>
                    <View style={styles.avatarSection}>
                      <Text style={styles.avatarFieldLabel}>Region</Text>
                      <View style={styles.regionGrid}>
                        {REGION_LAYOUT.map((row, rowIndex) => (
                          <View
                            key={rowIndex}
                            style={row.length === 1 ? styles.regionRowSingle : styles.regionRowDouble}
                          >
                            {row.map((r) => {
                              const selected = demographic.region.includes(r);
                              const isSmall = row.length === 2;
                              return (
                                <TouchableOpacity
                                  key={r}
                                  style={[
                                    styles.regionChip,
                                    selected && styles.regionChipSelected,
                                    row.length === 1 ? styles.regionChipFull : styles.regionChipHalf,
                                    isSmall && styles.regionChipSmall,
                                  ]}
                                  onPress={() => {
                                    playClickSound();
                                    const next = {
                                      ...demographic,
                                      region: selected
                                        ? demographic.region.filter((x) => x !== r)
                                        : [...demographic.region, r],
                                    };
                                    setDemographic(next);
                                    saveUniverse({ demographic: next });
                                  }}
                                  activeOpacity={0.8}
                                >
                                  {selected && (
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={isSmall ? 10 : 12}
                                      color="#FFD700"
                                      style={styles.regionChipCheck}
                                    />
                                  )}
                                  <Text
                                    style={[
                                      styles.regionChipText,
                                      selected && styles.regionChipTextSelected,
                                      isSmall && styles.regionChipTextSmall,
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
                    </View>
                    <View style={styles.avatarSection}>
                      <Text style={styles.avatarFieldLabel}>Age range</Text>
                      <View style={styles.ageRangeRow}>
                        <TextInput
                          style={styles.ageInput}
                          value={demographic.ageMin}
                          onChangeText={(t) => setDemographic({ ...demographic, ageMin: t })}
                          onBlur={() => saveUniverse()}
                          placeholder="Min"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          keyboardType="number-pad"
                        />
                        <Text style={styles.rangeSeparator}>–</Text>
                        <TextInput
                          style={styles.ageInput}
                          value={demographic.ageMax}
                          onChangeText={(t) => setDemographic({ ...demographic, ageMax: t })}
                          onBlur={() => saveUniverse()}
                          placeholder="Max"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                    <View style={styles.avatarSection}>
                      <Text style={styles.avatarFieldLabel}>Male : Female ratio</Text>
                      <View style={styles.genderRatioRow}>
                        <TextInput
                          style={styles.genderInput}
                          value={demographic.genderMale}
                          onChangeText={(t) => setDemographic({ ...demographic, genderMale: t })}
                          onBlur={() => saveUniverse()}
                          placeholder="Male %"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          keyboardType="number-pad"
                        />
                        <Text style={styles.rangeSeparator}>:</Text>
                        <TextInput
                          style={styles.genderInput}
                          value={demographic.genderFemale}
                          onChangeText={(t) => setDemographic({ ...demographic, genderFemale: t })}
                          onBlur={() => saveUniverse()}
                          placeholder="Female %"
                          placeholderTextColor="rgba(255, 255, 255, 0.4)"
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                    <View style={styles.avatarSection}>
                      <Text style={styles.avatarFieldLabel}>Profession</Text>
                      <TextInput
                        style={[styles.psychographicInput, { height: professionHeight }]}
                        value={demographic.profession}
                        onChangeText={(t) => setDemographic({ ...demographic, profession: t })}
                        onContentSizeChange={(e) => {
                          const h = e.nativeEvent?.contentSize?.height;
                          if (h == null) return;
                          setProfessionHeight(Math.max(MIN_PROFESSION_HEIGHT, h + 28));
                        }}
                        onBlur={() => saveUniverse()}
                        placeholder="e.g. Entrepreneurs, marketers..."
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>
                  </View>
                </View>

                {/* Psychographic Column */}
                <View style={styles.avatarColumn}>
                  <View style={styles.avatarPanel}>
                    <View style={styles.avatarSection}>
                      <Text style={styles.avatarFieldLabel}>Struggle</Text>
                      <TextInput
                        style={styles.psychographicInput}
                        value={psychographic.struggle}
                        onChangeText={(text) => setPsychographic({ ...psychographic, struggle: text })}
                        onBlur={() => saveUniverse()}
                        placeholder="What do they struggle with?"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>
                    <View style={styles.avatarSection}>
                      <Text style={styles.avatarFieldLabel}>Desire</Text>
                      <TextInput
                        style={styles.psychographicInput}
                        value={psychographic.desire}
                        onChangeText={(text) => setPsychographic({ ...psychographic, desire: text })}
                        onBlur={() => saveUniverse()}
                        placeholder="What do they want?"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>
                    <View style={styles.avatarSection}>
                      <Text style={styles.avatarFieldLabel}>Creators they consume</Text>
                      <TextInput
                        style={styles.psychographicInput}
                        value={psychographic.creators}
                        onChangeText={(text) => setPsychographic({ ...psychographic, creators: text })}
                        onBlur={() => saveUniverse()}
                        placeholder="Who do they follow?"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Identity Screen */}
          <View style={styles.screen}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
              {/* Identity */}
              <View style={styles.goalContainer}>
                <View style={styles.goalLabelRow}>
                  <Ionicons name="sparkles-outline" size={16} color="#FFD700" />
                  <Text style={styles.goalLabel}>Identity</Text>
                </View>
              </View>

              {/* Connection Lines from Identity */}
              <View style={styles.connectionsContainer}>
                <Svg height="60" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.125} y2="60" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.375} y2="60" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.625} y2="60" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.875} y2="60" stroke="#FFD700" strokeWidth="3" />
                </Svg>
              </View>

              {/* Categories Row */}
              <View style={styles.pillarsRow}>
                {(['Pain', 'Passion', 'Experience', 'Skill'] as const).map((category) => (
                  <View key={category} style={styles.pillarBox}>
                    <Text style={styles.pillarTitle} numberOfLines={1}>
                      {category === 'Experience' ? 'Exp.' : category}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Connection Lines from Categories to Inputs */}
              <View style={styles.pillarConnectionsContainer}>
                <Svg height="40" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) * 0.125} y1="0" x2={(width - 40) * 0.125} y2="40" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) * 0.375} y1="0" x2={(width - 40) * 0.375} y2="40" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) * 0.625} y1="0" x2={(width - 40) * 0.625} y2="40" stroke="#FFD700" strokeWidth="3" />
                  <Line x1={(width - 40) * 0.875} y1="0" x2={(width - 40) * 0.875} y2="40" stroke="#FFD700" strokeWidth="3" />
                </Svg>
              </View>

              {/* Input Fields Grid — add/remove boxes per category like Vision */}
              <View style={styles.ideasRow}>
                {(['pain', 'passion', 'experience', 'skill'] as const).map((category) => {
                  const label = category === 'experience' ? 'Exp.' : category.charAt(0).toUpperCase() + category.slice(1);
                  return (
                    <View key={category} style={styles.ideasColumn}>
                      {identity[category].map((value, index) => (
                        <View key={index} style={styles.ideaBoxWrapper}>
                          <View style={styles.ideaBox}>
                            <TextInput
                              style={[styles.ideaInput, category === 'passion' && styles.ideaInputPassion]}
                              value={value}
                              onChangeText={(text) => updateIdentityField(category, index, text)}
                              onBlur={() => saveUniverse()}
                              placeholder={`${label} ${index + 1}`}
                              placeholderTextColor="rgba(255, 255, 255, 0.3)"
                              multiline
                            />
                          </View>
                          {deleteModeIdentity && (
                            <TouchableOpacity
                              style={styles.deleteIdeaButton}
                              onPress={() => removeIdentityItem(category, index)}
                            >
                              <Ionicons name="close-circle" size={18} color="#ff4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      {identity[category].length < 4 && (
                        <TouchableOpacity
                          style={styles.addIdeaButton}
                          onPress={() => addIdentityItem(category)}
                        >
                          <Ionicons name="add-circle-outline" size={20} color="#FFD700" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Info Modal — swipeable Vision / Avatar / Identity */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
        onShow={onInfoModalShow}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Guide</Text>
              <TouchableOpacity
                style={styles.infoModalClose}
                onPress={() => {
                  playClickSound();
                  setShowInfoModal(false);
                }}
              >
                <Ionicons name="close" size={24} color="#FFD700" />
              </TouchableOpacity>
            </View>
            <View style={styles.infoTabContainer}>
              <TouchableOpacity
                style={[styles.infoTab, infoActiveScreen === 'why' && styles.infoTabActive]}
                onPress={() => handleInfoScreenChange('why')}
                activeOpacity={0.8}
              >
                <Text style={[styles.infoTabText, infoActiveScreen === 'why' && styles.infoTabTextActive]}>Why</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.infoTab, infoActiveScreen === 'vision' && styles.infoTabActive]}
                onPress={() => handleInfoScreenChange('vision')}
                activeOpacity={0.8}
              >
                <Text style={[styles.infoTabText, infoActiveScreen === 'vision' && styles.infoTabTextActive]}>Vision</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.infoTab, infoActiveScreen === 'avatar' && styles.infoTabActive]}
                onPress={() => handleInfoScreenChange('avatar')}
                activeOpacity={0.8}
              >
                <Text style={[styles.infoTabText, infoActiveScreen === 'avatar' && styles.infoTabTextActive]}>Avatar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.infoTab, infoActiveScreen === 'identity' && styles.infoTabActive]}
                onPress={() => handleInfoScreenChange('identity')}
                activeOpacity={0.8}
              >
                <Text style={[styles.infoTabText, infoActiveScreen === 'identity' && styles.infoTabTextActive]}>Identity</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={infoScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleInfoScroll}
              scrollEventThrottle={16}
              style={styles.infoHorizontalScroll}
            >
              {/* Why */}
              <View style={styles.infoScreen}>
                <ScrollView style={styles.infoScroll} contentContainerStyle={styles.infoContent}>
                  <Text style={styles.infoScreenTitle}>Why do we need the Creator Universe?</Text>
                  <Text style={styles.infoBody}>
                    Do you need millions of followers to be successful on social media? The answer is no because you could have millions of wrong followers. What you need to do is to build the right audience, so you are building A COMMUNITY.
                  </Text>
                  <Text style={styles.infoBody}>
                    You can achieve this by understanding what content your target audience wants to consume from you AND delivering it to them in the right format & messaging. This is why it is so important to understand what a good messaging framework is and what the winning formats for them are. The Creator Universe exists to give you a STRONG MESSAGE.
                  </Text>
                  <Text style={styles.infoSectionTitle}>Content that attracts the RIGHT audience = Message + Format</Text>
                  <Text style={styles.infoBody}>
                    Message: What are you saying? What value are you giving?
                  </Text>
                  <Text style={styles.infoBody}>
                    Format: How are you presenting it (b-roll, talking-head, voiceover)? What is the hook? Story? Visuals?
                  </Text>
                  <Text style={styles.infoSectionTitle}>A strong message comes from your Creator Universe</Text>
                  <Text style={styles.infoBody}>
                    Whenever you are trying to come up with content ideas, use the Creator Universe. You can simply follow this formula to generate content ideas:
                  </Text>
                  <Text style={styles.infoTip}>
                    Content Idea = topic + struggle + desire
                  </Text>
                </ScrollView>
              </View>
              {/* Vision */}
              <View style={styles.infoScreen}>
                <ScrollView style={styles.infoScroll} contentContainerStyle={styles.infoContent}>
                  <Text style={styles.infoScreenTitle}>Vision</Text>
                  <Text style={styles.infoSubtitle}>How to construct your vision universe:</Text>
                  <Text style={styles.infoSectionTitle}>The first pillar</Text>
                  <Text style={styles.infoBody}>
                    This should be Your Skill (What You Know). If you want to sell a product, people will buy from you because of this.
                  </Text>
                  <Text style={styles.infoSectionTitle}>The second pillar</Text>
                  <Text style={styles.infoBody}>
                    This should be Your Passion (What You Love). Why passion? Because you will build deep connections with your audience through familiarity & shared values.
                  </Text>
                  <Text style={styles.infoSectionTitle}>The third pillar</Text>
                  <Text style={styles.infoBody}>
                    This should be Your Story (Who You Are). This is the most important pillar. Your story is WHY behind your message. Sharing your story often creates the widest reach and builds the deepest connections with your audience.
                  </Text>
                  <Text style={styles.infoBody}>
                    You can add your interest as one more pillar since your ethos will connect all of your content pillars eventually.
                  </Text>
                  <Text style={styles.infoTip}>
                    A creator's vision allows room for change. Your ethos and content pillars can evolve without changing your entire structure. Even when you shift one or two pillars, the others keep your audience feeling familiar. That's why having multiple layers matters.
                  </Text>
                </ScrollView>
              </View>
              {/* Avatar */}
              <View style={styles.infoScreen}>
                <ScrollView style={styles.infoScroll} contentContainerStyle={styles.infoContent}>
                  <Text style={styles.infoScreenTitle}>Avatar</Text>
                  <Text style={styles.infoBody}>
                    Psychographic is more important than demographic since it will help you enhance the impact of your story.
                  </Text>
                  <Text style={styles.infoSectionTitle}>Struggle:</Text>
                  <Text style={styles.infoBody}>Think about what your target audience is struggling with.</Text>
                  <Text style={styles.infoSectionTitle}>Desire:</Text>
                  <Text style={styles.infoBody}>Think about what they desire.</Text>
                  <Text style={styles.infoSectionTitle}>Creators they consume:</Text>
                  <Text style={styles.infoBody}>
                    Think about what other content creators they are watching daily. You can have them as inspiration and learn the formats from them.
                  </Text>
                  <Text style={styles.infoTip}>
                    If you don't know who to target, think about people who are 2–3 years younger than you. You've already gone through the phase they're in, which means you can teach them valuable lessons based on your experiences and the skills you gained during that time.
                  </Text>
                </ScrollView>
              </View>
              {/* Identity */}
              <View style={styles.infoScreen}>
                <ScrollView style={styles.infoScroll} contentContainerStyle={styles.infoContent}>
                  <Text style={styles.infoScreenTitle}>Identity</Text>
                  <Text style={styles.infoBody}>
                    Identity is very important since it defines who you are and makes you such a valuable and relatable content creator.
                  </Text>
                  <Text style={styles.infoSectionTitle}>Pain</Text>
                  <Text style={styles.infoBody}>
                    Think about what you've struggled with. What defines challenges? What was the lowest point? What are core insecurities?
                  </Text>
                  <Text style={styles.infoSectionTitle}>Passion</Text>
                  <Text style={styles.infoBody}>
                    Think about what you are passionate about right now. Is there anything that you are working on right now, whether it could be your business, projects, gymming, etc?
                  </Text>
                  <Text style={styles.infoSectionTitle}>Experience</Text>
                  <Text style={styles.infoBody}>
                    Think about what you have gone through or what you have developed. Any qualifications? Any key milestones? Who have you helped?
                  </Text>
                  <Text style={styles.infoSectionTitle}>Skill</Text>
                  <Text style={styles.infoBody}>
                    Think about what you are good at and what people come to you for. What can you teach? What are the methods you mastered? Is there any go-to expertise?
                  </Text>
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </UniverseBackground>
  );
}

const cardShadow = {
  shadowColor: '#FFD700',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.15)',
  },
  backButton: {
    zIndex: 1,
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderColor: 'rgba(255, 215, 0, 0.6)',
    ...cardShadow,
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  deleteModeButton: {
    zIndex: 1,
    padding: 6,
  },
  deleteModeButtonActive: {},
  helpButton: {
    zIndex: 1,
    padding: 4,
  },
  horizontalScroll: {
    flex: 1,
  },
  screen: {
    width,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 36,
  },
  goalContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  goalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  goalContainerAvatar: {
    marginBottom: 6,
  },
  goalLabelAvatar: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  goalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    borderRadius: 16,
    padding: 18,
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 88,
    width: '85%',
    textAlign: 'center',
    textAlignVertical: 'top',
    ...cardShadow,
  },
  connectionsContainer: {
    height: 56,
    marginBottom: 2,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingHorizontal: 4,
    gap: 8,
  },
  pillarBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    borderRadius: 14,
    padding: 12,
    minHeight: 84,
    justifyContent: 'center',
    ...cardShadow,
  },
  avatarBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    borderRadius: 14,
    padding: 12,
    minHeight: 84,
    justifyContent: 'center',
    ...cardShadow,
  },
  pillarTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pillarConnectionsContainer: {
    height: 36,
    marginBottom: 2,
  },
  ideasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    gap: 8,
  },
  ideasRowAvatar: {
    gap: 12,
    paddingHorizontal: 2,
  },
  contentContainerAvatar: {
    paddingBottom: 40,
  },
  ideasColumn: {
    flex: 1,
    gap: 10,
  },
  avatarColumn: {
    flex: 1,
    gap: 0,
  },
  avatarPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  avatarSection: {
    marginBottom: 14,
  },
  avatarFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 215, 0, 0.95)',
    marginBottom: 8,
    letterSpacing: 0.4,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.45)',
  },
  regionChipFull: {
    flex: 1,
  },
  regionChipHalf: {
    flex: 1,
  },
  regionChipSmall: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  regionChipSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.16)',
    borderColor: 'rgba(255, 215, 0, 0.6)',
  },
  regionChipCheck: {
    marginRight: 4,
  },
  regionChipText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  regionChipTextSelected: {
    color: '#FFD700',
    fontWeight: '700',
  },
  regionChipTextSmall: {
    fontSize: 9,
  },
  ageRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ageInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.28)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  rangeSeparator: {
    fontSize: 15,
    color: 'rgba(255, 215, 0, 0.55)',
    fontWeight: '600',
  },
  genderRatioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  genderInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.28)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  psychographicInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.28)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  ideaBoxWrapper: {
    position: 'relative',
  },
  ideaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.28)',
    borderRadius: 12,
    padding: 12,
    minHeight: 58,
    ...cardShadow,
  },
  ideaInput: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 18,
    textAlignVertical: 'top',
  },
  ideaInputPassion: {
    fontSize: 11,
    lineHeight: 16,
  },
  deleteIdeaButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderRadius: 14,
    padding: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.4)',
  },
  addIdeaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    borderStyle: 'dashed',
  },
  // Info modal (Guide)
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalContent: {
    width: '100%',
    maxWidth: 500,
    height: Math.min(height * 0.82, 640),
    backgroundColor: 'rgba(18, 18, 28, 0.98)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    overflow: 'hidden',
    ...cardShadow,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  infoModalClose: {
    padding: 4,
  },
  infoTabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.12)',
  },
  infoTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  infoTabActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.16)',
    borderColor: 'rgba(255, 215, 0, 0.55)',
  },
  infoTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  infoTabTextActive: {
    color: '#FFD700',
    fontWeight: '700',
  },
  infoHorizontalScroll: {
    flex: 1,
    minHeight: 320,
  },
  infoScreen: {
    width: INFO_PAGE_WIDTH,
    minHeight: 320,
    alignSelf: 'stretch',
  },
  infoScroll: {
    flex: 1,
  },
  infoContent: {
    padding: 20,
    paddingBottom: 28,
  },
  infoScreenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  infoSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 22,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 215, 0, 0.9)',
    marginTop: 14,
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 22,
    marginBottom: 4,
  },
  infoTip: {
    fontSize: 14,
    color: 'rgba(255, 215, 0, 0.85)',
    lineHeight: 22,
    marginTop: 16,
    fontStyle: 'italic',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 215, 0, 0.5)',
  },
});
