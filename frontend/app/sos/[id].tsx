import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UniverseBackground } from '../../components/UniverseBackground';
import { SOS_ISSUES } from '../../constants/content';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SOSFlowScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const issue = SOS_ISSUES.find((i) => i.id === id);

  const [step, setStep] = useState(1); // 1: Explanation, 2: Black Hole, 3: Affirmations
  const [asteroids, setAsteroids] = useState(['', '', '']);
  const [affirmations, setAffirmations] = useState(['', '', '', '']);
  const [isVacuuming, setIsVacuuming] = useState(false);

  if (!issue) {
    return (
      <UniverseBackground>
        <SafeAreaView style={styles.container}>
          <Text style={styles.errorText}>Issue not found</Text>
        </SafeAreaView>
      </UniverseBackground>
    );
  }

  const handleLetGo = () => {
    setIsVacuuming(true);
    setTimeout(() => {
      setIsVacuuming(false);
      setStep(3);
    }, 2000);
  };

  const handleComplete = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      await fetch(`${BACKEND_URL}/api/sos/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          issue_type: issue.id,
          asteroids,
          affirmations,
        }),
      });
      await refreshUser();
      router.push('/(tabs)/main');
    } catch (error) {
      console.error('Error completing SOS:', error);
    }
  };

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.starCharacter}>⭐</Text>
        </View>

        {step === 1 && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.issueTitle}>{issue.title}</Text>
            <View style={styles.explanationBox}>
              <Text style={styles.explanationText}>{issue.explanation}</Text>
            </View>
            <TouchableOpacity style={styles.letGoButton} onPress={() => setStep(2)}>
              <Text style={styles.letGoButtonText}>Let go</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {step === 2 && (
          <View style={styles.blackHoleContainer}>
            <View style={styles.blackHole}>
              {isVacuuming && <Text style={styles.blackHoleEmoji}>🕳️</Text>}
            </View>

            <View style={styles.asteroidsContainer}>
              {asteroids.map((asteroid, index) => (
                <View
                  key={index}
                  style={[
                    styles.asteroidInput,
                    isVacuuming && styles.asteroidVacuuming,
                  ]}
                >
                  <TextInput
                    style={styles.asteroidText}
                    value={asteroid}
                    onChangeText={(text) => {
                      const newAsteroids = [...asteroids];
                      newAsteroids[index] = text;
                      setAsteroids(newAsteroids);
                    }}
                    placeholder={`Negative thought ${index + 1}...`}
                    placeholderTextColor="#666"
                    multiline
                    editable={!isVacuuming}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.letGoButton}
              onPress={handleLetGo}
              disabled={isVacuuming}
            >
              <Text style={styles.letGoButtonText}>
                {isVacuuming ? 'Letting go...' : 'Let Go'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.affirmationTitle}>Write Your Affirmations</Text>
            <View style={styles.starsContainer}>
              {affirmations.map((affirmation, index) => (
                <View key={index} style={styles.starInput}>
                  <Text style={styles.starEmoji}>⭐</Text>
                  <TextInput
                    style={styles.affirmationText}
                    value={affirmation}
                    onChangeText={(text) => {
                      const newAffirmations = [...affirmations];
                      newAffirmations[index] = text;
                      setAffirmations(newAffirmations);
                    }}
                    placeholder="Positive affirmation..."
                    placeholderTextColor="#666"
                    multiline
                  />
                </View>
              ))}
            </View>

            {affirmations.every((a) => a.trim() !== '') && (
              <View style={styles.constellationMessage}>
                <Text style={styles.constellationText}>
                  Look at that! Your positive feelings became beautiful stars in your universe.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.homeButton}
              onPress={handleComplete}
              disabled={!affirmations.every((a) => a.trim() !== '')}
            >
              <Text style={styles.homeButtonText}>Home</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
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
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
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
  issueTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 24,
    textAlign: 'center',
  },
  explanationBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    minHeight: 200,
  },
  explanationText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  letGoButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  letGoButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e27',
  },
  blackHoleContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  blackHole: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#000',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  blackHoleEmoji: {
    fontSize: 80,
  },
  asteroidsContainer: {
    gap: 20,
  },
  asteroidInput: {
    backgroundColor: 'rgba(139, 69, 19, 0.3)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(139, 69, 19, 0.5)',
  },
  asteroidVacuuming: {
    opacity: 0.3,
  },
  asteroidText: {
    color: '#fff',
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  affirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 24,
    textAlign: 'center',
  },
  starsContainer: {
    gap: 20,
    marginBottom: 32,
  },
  starInput: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starEmoji: {
    fontSize: 32,
  },
  affirmationText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  constellationMessage: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  constellationText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e27',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});