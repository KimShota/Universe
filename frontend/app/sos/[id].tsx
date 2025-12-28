import React, { useState, useRef, useEffect } from 'react';
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
  
  // Vortex rotation animation
  const vortexRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step === 2) {
      // Start infinite rotation
      Animated.loop(
        Animated.timing(vortexRotation, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [step]);

  const rotateInterpolate = vortexRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
            {/* Swirling Vortex Background */}
            <Animated.View style={[styles.vortexContainer, { transform: [{ rotate: rotateInterpolate }] }]}>
              {[...Array(20)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.vortexRing,
                    {
                      width: 100 + i * 40,
                      height: 100 + i * 40,
                      borderRadius: (100 + i * 40) / 2,
                      opacity: 0.6 - i * 0.03,
                    },
                  ]}
                />
              ))}
            </Animated.View>

            {/* Central Black Hole */}
            <View style={styles.blackHole}>
              <View style={styles.blackHoleCore} />
            </View>

            {/* Three Asteroids in Circular Orbit */}
            <View style={[styles.asteroidOrbit, styles.asteroid1Position]}>
              <View style={styles.asteroidContainer}>
                <TextInput
                  style={styles.asteroidInput}
                  value={asteroids[0]}
                  onChangeText={(text) => {
                    const newAsteroids = [...asteroids];
                    newAsteroids[0] = text;
                    setAsteroids(newAsteroids);
                  }}
                  placeholder="Negative thought..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  editable={!isVacuuming}
                />
              </View>
            </View>

            <View style={[styles.asteroidOrbit, styles.asteroid2Position]}>
              <View style={styles.asteroidContainer}>
                <TextInput
                  style={styles.asteroidInput}
                  value={asteroids[1]}
                  onChangeText={(text) => {
                    const newAsteroids = [...asteroids];
                    newAsteroids[1] = text;
                    setAsteroids(newAsteroids);
                  }}
                  placeholder="Negative thought..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  editable={!isVacuuming}
                />
              </View>
            </View>

            <View style={[styles.asteroidOrbit, styles.asteroid3Position]}>
              <View style={styles.asteroidContainer}>
                <TextInput
                  style={styles.asteroidInput}
                  value={asteroids[2]}
                  onChangeText={(text) => {
                    const newAsteroids = [...asteroids];
                    newAsteroids[2] = text;
                    setAsteroids(newAsteroids);
                  }}
                  placeholder="Negative thought..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  editable={!isVacuuming}
                />
              </View>
            </View>

            {/* Let Go Button */}
            <View style={styles.letGoButtonContainer}>
              <TouchableOpacity
                style={styles.letGoButton}
                onPress={handleLetGo}
                disabled={isVacuuming}
              >
                <Text style={styles.letGoButtonText}>
                  {isVacuuming ? 'Releasing...' : 'Let Go'}
                </Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: 'rgba(138, 43, 226, 0.8)',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  letGoButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  blackHoleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  vortexContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '200%',
    height: '200%',
  },
  vortexRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'solid',
  },
  blackHole: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 10,
  },
  blackHoleCore: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: 'rgba(138, 43, 226, 0.6)',
  },
  asteroidOrbit: {
    position: 'absolute',
    zIndex: 20,
  },
  asteroid1Position: {
    top: '25%',
    left: '10%',
  },
  asteroid2Position: {
    top: '30%',
    right: '8%',
  },
  asteroid3Position: {
    bottom: '28%',
    left: '12%',
  },
  asteroidContainer: {
    backgroundColor: 'rgba(139, 69, 19, 0.3)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.6)',
    padding: 12,
    minWidth: 200,
    maxWidth: 250,
  },
  asteroidInput: {
    color: '#fff',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  letGoButtonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    zIndex: 30,
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