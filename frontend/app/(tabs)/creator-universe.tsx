import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { UniverseBackground } from '../../components/UniverseBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { playClickSound } from '../../utils/soundEffects';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width, height } = Dimensions.get('window');

const REGION_LAYOUT: string[][] = [
  ['North America'],
  ['South America'],
  ['Europe', 'Asia'],
  ['Africa', 'Oceania'],
  ['Middle East'],
];

type ScreenType = 'vision' | 'audience' | 'edge';

export default function CreatorUniverseScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenType>('vision');

  // Vision screen state
  const [goal, setGoal] = useState('');
  const [pillars, setPillars] = useState([
    { title: 'Content Pillar 1', ideas: [''] },
    { title: 'Content Pillar 2', ideas: [''] },
    { title: 'Content Pillar 3', ideas: [''] },
    { title: 'Content Pillar 4', ideas: [''] },
  ]);

  // Audience screen state
  const [demographic, setDemographic] = useState({
    region: '',
    ageMin: '',
    ageMax: '',
    genderMale: '',
    genderFemale: '',
  });
  const [psychographic, setPsychographic] = useState({
    struggle: '',
    desire: '',
    creators: '',
  });

  // Edge screen state — start with 0 boxes per category; users add via + like Vision
  const [uniqueness, setUniqueness] = useState<{
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

  useEffect(() => {
    loadUniverse();
  }, []);

  const loadUniverse = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/creator-universe`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await response.json();
      
      // Vision
      setGoal(data.overarching_goal || '');
      if (data.content_pillars && data.content_pillars.length > 0) {
        setPillars(data.content_pillars);
      }
      
      // Audience
      if (data.audience) {
        const d = data.audience.demographic || {};
        setDemographic({
          region: d.region ?? '',
          ageMin: d.ageMin ?? '',
          ageMax: d.ageMax ?? '',
          genderMale: d.genderMale ?? '',
          genderFemale: d.genderFemale ?? '',
        });
        setPsychographic(data.audience.psychographic || { struggle: '', desire: '', creators: '' });
      }
      
      // Edge — start with 0 boxes; normalize legacy "3 empty" default to []
      if (data.edge?.uniqueness) {
        const u = data.edge.uniqueness as Record<string, string[]>;
        const norm = (arr: unknown): string[] => {
          if (!Array.isArray(arr)) return [];
          if (arr.length === 3 && arr.every((s) => s === '')) return [];
          return arr;
        };
        setUniqueness({
          pain: norm(u.pain),
          passion: norm(u.passion),
          experience: norm(u.experience),
          skill: norm(u.skill),
        });
      }
    } catch (error) {
      console.error('Error loading universe:', error);
    }
  };

  const saveUniverse = async (overrides?: {
    demographic?: typeof demographic;
    uniqueness?: typeof uniqueness;
  }) => {
    try {
      const d = overrides?.demographic ?? demographic;
      const u = overrides?.uniqueness ?? uniqueness;
      const sessionToken = await AsyncStorage.getItem('session_token');
      await fetch(`${BACKEND_URL}/api/creator-universe`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          overarching_goal: goal,
          content_pillars: pillars,
          audience: {
            demographic: d,
            psychographic,
          },
          edge: {
            uniqueness: u,
          },
        }),
      });
    } catch (error) {
      console.error('Error saving universe:', error);
    }
  };

  const handleScreenChange = (screen: ScreenType) => {
    playClickSound();
    setActiveScreen(screen);
    const screenIndex = screen === 'vision' ? 0 : screen === 'audience' ? 1 : 2;
    scrollViewRef.current?.scrollTo({ x: screenIndex * width, animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const screenIndex = Math.round(offsetX / width);
    const screens: ScreenType[] = ['vision', 'audience', 'edge'];
    setActiveScreen(screens[screenIndex]);
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
    const newPillars = [...pillars];
    newPillars[pillarIndex].ideas.splice(ideaIndex, 1);
    setPillars(newPillars);
    saveUniverse();
  };

  // Edge screen functions (mirror Vision: add/remove boxes per category)
  const updateUniquenessField = (category: keyof typeof uniqueness, index: number, value: string) => {
    const newUniqueness = { ...uniqueness };
    newUniqueness[category] = [...newUniqueness[category]];
    newUniqueness[category][index] = value;
    setUniqueness(newUniqueness);
  };

  const addUniquenessItem = (category: keyof typeof uniqueness) => {
    if (uniqueness[category].length >= 4) return;
    playClickSound();
    const newUniqueness = { ...uniqueness };
    newUniqueness[category] = [...newUniqueness[category], ''];
    setUniqueness(newUniqueness);
    saveUniverse({ uniqueness: newUniqueness });
  };

  const removeUniquenessItem = (category: keyof typeof uniqueness, index: number) => {
    playClickSound();
    const newUniqueness = { ...uniqueness };
    newUniqueness[category] = newUniqueness[category].filter((_, i) => i !== index);
    setUniqueness(newUniqueness);
    saveUniverse({ uniqueness: newUniqueness });
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
              style={[styles.tabButton, activeScreen === 'audience' && styles.tabButtonActive]}
              onPress={() => handleScreenChange('audience')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeScreen === 'audience' && styles.tabTextActive]}>
                Audience
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeScreen === 'edge' && styles.tabButtonActive]}
              onPress={() => handleScreenChange('edge')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeScreen === 'edge' && styles.tabTextActive]}>
                Edge
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.helpButton}>
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
              {/* Overarching Goal */}
              <View style={styles.goalContainer}>
                <View style={styles.goalLabelRow}>
                  <Ionicons name="compass-outline" size={16} color="#FFD700" />
                  <Text style={styles.goalLabel}>Overarching Goal</Text>
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
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
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
                        <TouchableOpacity
                          style={styles.deleteIdeaButton}
                          onPress={() => removeIdea(pillarIndex, ideaIndex)}
                        >
                          <Ionicons name="close-circle" size={18} color="#ff4444" />
                        </TouchableOpacity>
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

          {/* Audience Screen */}
          <View style={styles.screen}>
            <ScrollView style={styles.scrollView} contentContainerStyle={[styles.contentContainer, styles.contentContainerAudience]}>
              {/* Target Avatar */}
              <View style={[styles.goalContainer, styles.goalContainerAudience]}>
                <View style={styles.goalLabelRow}>
                  <Ionicons name="people-outline" size={18} color="#FFD700" />
                  <Text style={[styles.goalLabel, styles.goalLabelAudience]}>Target Avatar</Text>
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
                <View style={styles.audienceBox}>
                  <View style={styles.audienceCategoryHeader}>
                    <Ionicons name="earth-outline" size={14} color="#FFD700" />
                    <Text style={styles.pillarTitle}>Demographic</Text>
                  </View>
                </View>
                <View style={styles.audienceBox}>
                  <View style={styles.audienceCategoryHeader}>
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
              <View style={[styles.ideasRow, styles.ideasRowAudience]}>
                {/* Demographic Column */}
                <View style={styles.audienceColumn}>
                  <View style={styles.audiencePanel}>
                    <View style={styles.audienceSection}>
                      <Text style={styles.audienceFieldLabel}>Region</Text>
                      <View style={styles.regionGrid}>
                        {REGION_LAYOUT.map((row, rowIndex) => (
                          <View
                            key={rowIndex}
                            style={row.length === 1 ? styles.regionRowSingle : styles.regionRowDouble}
                          >
                            {row.map((r) => {
                              const selected = demographic.region === r;
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
                                    const next = { ...demographic, region: selected ? '' : r };
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
                    <View style={styles.audienceSection}>
                      <Text style={styles.audienceFieldLabel}>Age range</Text>
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
                    <View style={styles.audienceSection}>
                      <Text style={styles.audienceFieldLabel}>Male : Female ratio</Text>
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
                  </View>
                </View>

                {/* Psychographic Column */}
                <View style={styles.audienceColumn}>
                  <View style={styles.audiencePanel}>
                    <View style={styles.audienceSection}>
                      <Text style={styles.audienceFieldLabel}>Struggle</Text>
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
                    <View style={styles.audienceSection}>
                      <Text style={styles.audienceFieldLabel}>Desire</Text>
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
                    <View style={styles.audienceSection}>
                      <Text style={styles.audienceFieldLabel}>Creators they consume</Text>
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

          {/* Edge Screen */}
          <View style={styles.screen}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
              {/* Uniqueness */}
              <View style={styles.goalContainer}>
                <View style={styles.goalLabelRow}>
                  <Ionicons name="sparkles-outline" size={16} color="#FFD700" />
                  <Text style={styles.goalLabel}>Uniqueness</Text>
                </View>
              </View>

              {/* Connection Lines from Uniqueness */}
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
                      {uniqueness[category].map((value, index) => (
                        <View key={index} style={styles.ideaBoxWrapper}>
                          <View style={styles.ideaBox}>
                            <TextInput
                              style={styles.ideaInput}
                              value={value}
                              onChangeText={(text) => updateUniquenessField(category, index, text)}
                              onBlur={() => saveUniverse()}
                              placeholder={`${label} ${index + 1}`}
                              placeholderTextColor="rgba(255, 255, 255, 0.3)"
                              multiline
                            />
                          </View>
                          <TouchableOpacity
                            style={styles.deleteIdeaButton}
                            onPress={() => removeUniquenessItem(category, index)}
                          >
                            <Ionicons name="close-circle" size={18} color="#ff4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {uniqueness[category].length < 4 && (
                        <TouchableOpacity
                          style={styles.addIdeaButton}
                          onPress={() => addUniquenessItem(category)}
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
  goalContainerAudience: {
    marginBottom: 6,
  },
  goalLabelAudience: {
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
  audienceBox: {
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
  audienceCategoryHeader: {
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
  ideasRowAudience: {
    gap: 12,
    paddingHorizontal: 2,
  },
  contentContainerAudience: {
    paddingBottom: 40,
  },
  ideasColumn: {
    flex: 1,
    gap: 10,
  },
  audienceColumn: {
    flex: 1,
    gap: 0,
  },
  audiencePanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  audienceSection: {
    marginBottom: 14,
  },
  audienceFieldLabel: {
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
    fontSize: 11,
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
});
