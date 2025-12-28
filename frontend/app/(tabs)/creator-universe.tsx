import React, { useState, useEffect } from 'react';
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

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

export default function CreatorUniverseScreen() {
  const [goal, setGoal] = useState('');
  const [pillars, setPillars] = useState([
    { title: 'Content Pillar 1', ideas: [''] },
    { title: 'Content Pillar 2', ideas: [''] },
    { title: 'Content Pillar 3', ideas: [''] },
    { title: 'Content Pillar 4', ideas: [''] },
  ]);

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
      setGoal(data.overarching_goal || '');
      if (data.content_pillars && data.content_pillars.length > 0) {
        setPillars(data.content_pillars);
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
        }),
      });
    } catch (error) {
      console.error('Error saving universe:', error);
    }
  };

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

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.starCharacter}>⭐</Text>
        </View>

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
              {/* Lines from center top to each pillar */}
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
              {/* Vertical lines from each pillar down */}
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
                  <View key={ideaIndex} style={styles.ideaBox}>
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
    paddingVertical: 16,
  },
  starCharacter: {
    fontSize: 48,
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
  addIdeaButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});