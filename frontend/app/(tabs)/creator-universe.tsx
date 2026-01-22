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
    age: '',
    gender: '',
  });
  const [psychographic, setPsychographic] = useState({
    struggle: '',
    desire: '',
    creators: '',
  });

  // Edge screen state
  const [uniqueness, setUniqueness] = useState({
    pain: ['', '', ''],
    passion: ['', '', ''],
    experience: ['', '', ''],
    skill: ['', '', ''],
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
        setDemographic(data.audience.demographic || { region: '', age: '', gender: '' });
        setPsychographic(data.audience.psychographic || { struggle: '', desire: '', creators: '' });
      }
      
      // Edge
      if (data.edge) {
        setUniqueness(data.edge.uniqueness || {
          pain: ['', '', ''],
          passion: ['', '', ''],
          experience: ['', '', ''],
          skill: ['', '', ''],
        });
      }
    } catch (error) {
      console.error('Error loading universe:', error);
    }
  };

  const saveUniverse = async () => {
    try {
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
            demographic,
            psychographic,
          },
          edge: {
            uniqueness,
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
    const newPillars = [...pillars];
    newPillars[pillarIndex].ideas.push('');
    setPillars(newPillars);
  };

  const removeIdea = (pillarIndex: number, ideaIndex: number) => {
    const newPillars = [...pillars];
    newPillars[pillarIndex].ideas.splice(ideaIndex, 1);
    setPillars(newPillars);
    saveUniverse();
  };

  // Edge screen functions
  const updateUniquenessField = (category: keyof typeof uniqueness, index: number, value: string) => {
    const newUniqueness = { ...uniqueness };
    newUniqueness[category] = [...newUniqueness[category]];
    newUniqueness[category][index] = value;
    setUniqueness(newUniqueness);
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
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          
          {/* Tab Buttons */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeScreen === 'vision' && styles.tabButtonActive]}
              onPress={() => handleScreenChange('vision')}
            >
              <Text style={[styles.tabText, activeScreen === 'vision' && styles.tabTextActive]}>
                Vision
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeScreen === 'audience' && styles.tabButtonActive]}
              onPress={() => handleScreenChange('audience')}
            >
              <Text style={[styles.tabText, activeScreen === 'audience' && styles.tabTextActive]}>
                Audience
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeScreen === 'edge' && styles.tabButtonActive]}
              onPress={() => handleScreenChange('edge')}
            >
              <Text style={[styles.tabText, activeScreen === 'edge' && styles.tabTextActive]}>
                Edge
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={28} color="#FFD700" />
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
                <Text style={styles.goalLabel}>Overarching Goal</Text>
                <TextInput
                  style={styles.goalInput}
                  value={goal}
                  onChangeText={setGoal}
                  onBlur={saveUniverse}
                  placeholder="What's your main goal?"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                />
              </View>

              {/* Connection Lines from Goal to Pillars */}
              <View style={styles.connectionsContainer}>
                <Svg height="60" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.125} y2="60" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.375} y2="60" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.625} y2="60" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.875} y2="60" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
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
                      onBlur={saveUniverse}
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
                  <Line x1={(width - 40) * 0.125} y1="0" x2={(width - 40) * 0.125} y2="40" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) * 0.375} y1="0" x2={(width - 40) * 0.375} y2="40" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) * 0.625} y1="0" x2={(width - 40) * 0.625} y2="40" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) * 0.875} y1="0" x2={(width - 40) * 0.875} y2="40" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
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
                            onBlur={saveUniverse}
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
                    <TouchableOpacity
                      style={styles.addIdeaButton}
                      onPress={() => {
                        addIdea(pillarIndex);
                        saveUniverse();
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={16} color="#FFD700" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Audience Screen */}
          <View style={styles.screen}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
              {/* Target Avatar */}
              <View style={styles.goalContainer}>
                <Text style={styles.goalLabel}>Target Avatar</Text>
              </View>

              {/* Connection Lines from Target Avatar */}
              <View style={styles.connectionsContainer}>
                <Svg height="60" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.25} y2="60" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.75} y2="60" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                </Svg>
              </View>

              {/* Demographic and Psychographic Row */}
              <View style={styles.pillarsRow}>
                <View style={styles.audienceBox}>
                  <Text style={styles.pillarTitle}>Demographic</Text>
                </View>
                <View style={styles.audienceBox}>
                  <Text style={styles.pillarTitle}>Psychographic</Text>
                </View>
              </View>

              {/* Connection Lines from Categories to Inputs */}
              <View style={styles.pillarConnectionsContainer}>
                <Svg height="40" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) * 0.25} y1="0" x2={(width - 40) * 0.25} y2="40" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) * 0.75} y1="0" x2={(width - 40) * 0.75} y2="40" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                </Svg>
              </View>

              {/* Input Fields Grid */}
              <View style={styles.ideasRow}>
                {/* Demographic Column */}
                <View style={styles.audienceColumn}>
                  <View style={styles.ideaBox}>
                    <TextInput
                      style={styles.ideaInput}
                      value={demographic.region}
                      onChangeText={(text) => {
                        setDemographic({ ...demographic, region: text });
                      }}
                      onBlur={saveUniverse}
                      placeholder="Region"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      multiline
                    />
                  </View>
                  <View style={styles.ideaBox}>
                    <TextInput
                      style={styles.ideaInput}
                      value={demographic.age}
                      onChangeText={(text) => {
                        setDemographic({ ...demographic, age: text });
                      }}
                      onBlur={saveUniverse}
                      placeholder="Age"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      multiline
                    />
                  </View>
                  <View style={styles.ideaBox}>
                    <TextInput
                      style={styles.ideaInput}
                      value={demographic.gender}
                      onChangeText={(text) => {
                        setDemographic({ ...demographic, gender: text });
                      }}
                      onBlur={saveUniverse}
                      placeholder="Male : Female"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      multiline
                    />
                  </View>
                </View>

                {/* Psychographic Column */}
                <View style={styles.audienceColumn}>
                  <View style={styles.ideaBox}>
                    <TextInput
                      style={styles.ideaInput}
                      value={psychographic.struggle}
                      onChangeText={(text) => {
                        setPsychographic({ ...psychographic, struggle: text });
                      }}
                      onBlur={saveUniverse}
                      placeholder="Struggle"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      multiline
                    />
                  </View>
                  <View style={styles.ideaBox}>
                    <TextInput
                      style={styles.ideaInput}
                      value={psychographic.desire}
                      onChangeText={(text) => {
                        setPsychographic({ ...psychographic, desire: text });
                      }}
                      onBlur={saveUniverse}
                      placeholder="Desire"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      multiline
                    />
                  </View>
                  <View style={styles.ideaBox}>
                    <TextInput
                      style={styles.ideaInput}
                      value={psychographic.creators}
                      onChangeText={(text) => {
                        setPsychographic({ ...psychographic, creators: text });
                      }}
                      onBlur={saveUniverse}
                      placeholder="Creators they consume"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      multiline
                    />
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
                <Text style={styles.goalLabel}>Uniqueness</Text>
              </View>

              {/* Connection Lines from Uniqueness */}
              <View style={styles.connectionsContainer}>
                <Svg height="60" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.125} y2="60" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.375} y2="60" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.625} y2="60" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) / 2} y1="0" x2={(width - 40) * 0.875} y2="60" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                </Svg>
              </View>

              {/* Categories Row */}
              <View style={styles.pillarsRow}>
                {(['Pain', 'Passion', 'Experience', 'Skill'] as const).map((category, index) => (
                  <View key={category} style={styles.pillarBox}>
                    <Text style={styles.pillarTitle}>{category}</Text>
                  </View>
                ))}
              </View>

              {/* Connection Lines from Categories to Inputs */}
              <View style={styles.pillarConnectionsContainer}>
                <Svg height="40" width={width - 40} style={styles.svg}>
                  <Line x1={(width - 40) * 0.125} y1="0" x2={(width - 40) * 0.125} y2="40" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) * 0.375} y1="0" x2={(width - 40) * 0.375} y2="40" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) * 0.625} y1="0" x2={(width - 40) * 0.625} y2="40" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                  <Line x1={(width - 40) * 0.875} y1="0" x2={(width - 40) * 0.875} y2="40" stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" />
                </Svg>
              </View>

              {/* Input Fields Grid */}
              <View style={styles.ideasRow}>
                {(['pain', 'passion', 'experience', 'skill'] as const).map((category, categoryIndex) => (
                  <View key={category} style={styles.ideasColumn}>
                    {uniqueness[category].map((value, index) => (
                      <View key={index} style={styles.ideaBox}>
                        <TextInput
                          style={styles.ideaInput}
                          value={value}
                          onChangeText={(text) => updateUniquenessField(category, index, text)}
                          onBlur={saveUniverse}
                          placeholder={`${category.charAt(0).toUpperCase() + category.slice(1)} ${index + 1}`}
                          placeholderTextColor="rgba(255, 255, 255, 0.3)"
                          multiline
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    zIndex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.6)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  helpButton: {
    zIndex: 1,
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
  },
  goalContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  goalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  goalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    width: '80%',
    textAlign: 'center',
    textAlignVertical: 'top',
  },
  connectionsContainer: {
    height: 60,
    marginBottom: 0,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    paddingHorizontal: 5,
  },
  pillarBox: {
    width: '23%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 8,
    padding: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  audienceBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 8,
    padding: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  pillarTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pillarConnectionsContainer: {
    height: 40,
    marginBottom: 0,
  },
  ideasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  ideasColumn: {
    width: '23%',
    gap: 8,
  },
  audienceColumn: {
    width: '48%',
    gap: 8,
  },
  ideaBoxWrapper: {
    position: 'relative',
  },
  ideaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
  },
  ideaInput: {
    color: '#fff',
    fontSize: 11,
    textAlignVertical: 'top',
  },
  deleteIdeaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 2,
    zIndex: 10,
  },
  addIdeaButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
