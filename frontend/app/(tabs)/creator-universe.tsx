import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { UniverseBackground } from '../../components/UniverseBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CreatorUniverseScreen() {
  const [goal, setGoal] = useState('');
  const [pillars, setPillars] = useState([
    { title: 'Content Pillar 1', ideas: [] },
    { title: 'Content Pillar 2', ideas: [] },
    { title: 'Content Pillar 3', ideas: [] },
    { title: 'Content Pillar 4', ideas: [] },
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

  const addIdea = (pillarIndex: number) => {
    const newPillars = [...pillars];
    newPillars[pillarIndex].ideas.push(`Idea ${newPillars[pillarIndex].ideas.length + 1}`);
    setPillars(newPillars);
  };

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.starCharacter}>⭐</Text>
          <Text style={styles.title}>Creator's Universe</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          {/* Overarching Goal */}
          <View style={styles.goalContainer}>
            <Text style={styles.sectionTitle}>Overarching Goal</Text>
            <TextInput
              style={styles.goalInput}
              value={goal}
              onChangeText={setGoal}
              onBlur={saveUniverse}
              placeholder="What's your main goal?"
              placeholderTextColor="#666"
              multiline
            />
          </View>

          {/* Content Pillars */}
          <View style={styles.pillarsContainer}>
            {pillars.map((pillar, index) => (
              <View key={index} style={styles.pillarCard}>
                <TextInput
                  style={styles.pillarTitle}
                  value={pillar.title}
                  onChangeText={(text) => updatePillarTitle(index, text)}
                  onBlur={saveUniverse}
                  placeholderTextColor="#666"
                />
                
                {pillar.ideas.map((idea, ideaIndex) => (
                  <Text key={ideaIndex} style={styles.ideaText}>
                    • {idea}
                  </Text>
                ))}
                
                <TouchableOpacity
                  style={styles.addIdeaButton}
                  onPress={() => {
                    addIdea(index);
                    saveUniverse();
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FFD700" />
                  <Text style={styles.addIdeaText}>Add Idea</Text>
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
    paddingVertical: 24,
  },
  starCharacter: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  goalContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  goalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pillarsContainer: {
    gap: 16,
  },
  pillarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
  },
  pillarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  ideaText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 8,
  },
  addIdeaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  addIdeaText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
});