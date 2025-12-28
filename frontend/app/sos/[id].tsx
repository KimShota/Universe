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
import Svg, { Line } from 'react-native-svg';

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
  
  // Animation refs
  const vortexRotation = useRef(new Animated.Value(0)).current;
  const blackHoleRotation = useRef(new Animated.Value(0)).current;
  const asteroid1Position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const asteroid2Position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const asteroid3Position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const asteroid1Scale = useRef(new Animated.Value(1)).current;
  const asteroid2Scale = useRef(new Animated.Value(1)).current;
  const asteroid3Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (step === 2) {
      // Start infinite vortex rotation
      Animated.loop(
        Animated.timing(vortexRotation, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();

      // Start infinite black hole swirl (faster than vortex)
      Animated.loop(
        Animated.timing(blackHoleRotation, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [step]);

  const vortexRotateInterpolate = vortexRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const blackHoleRotateInterpolate = blackHoleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
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
    
    // Animate all asteroids being sucked into the black hole
    Animated.parallel([
      // Asteroid 1: move to center and shrink
      Animated.timing(asteroid1Position, {
        toValue: { x: 0, y: 0 },
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(asteroid1Scale, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Asteroid 2: move to center and shrink
      Animated.timing(asteroid2Position, {
        toValue: { x: 0, y: 0 },
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(asteroid2Scale, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Asteroid 3: move to center and shrink
      Animated.timing(asteroid3Position, {
        toValue: { x: 0, y: 0 },
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(asteroid3Scale, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After animation completes, move to next step
      setTimeout(() => {
        setIsVacuuming(false);
        setStep(3);
      }, 500);
    });
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
            <Animated.View style={[styles.vortexContainer, { transform: [{ rotate: vortexRotateInterpolate }] }]}>
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

            {/* Central Black Hole with Swirling Accretion Disk */}
            <Animated.View style={[styles.blackHoleOuter, { transform: [{ rotate: blackHoleRotateInterpolate }] }]}>
              {/* Accretion disk rings */}
              <View style={[styles.accretionDisk, styles.accretionDisk1]} />
              <View style={[styles.accretionDisk, styles.accretionDisk2]} />
              <View style={[styles.accretionDisk, styles.accretionDisk3]} />
            </Animated.View>
            
            {/* Event Horizon (center) */}
            <View style={styles.blackHole}>
              <View style={styles.blackHoleCore} />
            </View>

            {/* Three Asteroids in Circular Orbit with Animation */}
            <Animated.View 
              style={[
                styles.asteroidOrbit, 
                styles.asteroid1Position,
                {
                  transform: [
                    { translateX: asteroid1Position.x },
                    { translateY: asteroid1Position.y },
                    { scale: asteroid1Scale },
                  ],
                },
              ]}
            >
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
            </Animated.View>

            <Animated.View 
              style={[
                styles.asteroidOrbit, 
                styles.asteroid2Position,
                {
                  transform: [
                    { translateX: asteroid2Position.x },
                    { translateY: asteroid2Position.y },
                    { scale: asteroid2Scale },
                  ],
                },
              ]}
            >
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
            </Animated.View>

            <Animated.View 
              style={[
                styles.asteroidOrbit, 
                styles.asteroid3Position,
                {
                  transform: [
                    { translateX: asteroid3Position.x },
                    { translateY: asteroid3Position.y },
                    { scale: asteroid3Scale },
                  ],
                },
              ]}
            >
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
            </Animated.View>

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
          <View style={styles.affirmationsContainer}>
            {/* Title */}
            <View style={styles.affirmationHeader}>
              <Text style={styles.affirmationTitle}>Write Your Affirmations</Text>
            </View>

            {/* Star positions in diamond/square formation */}
            <View style={styles.starsLayout}>
              {/* Top Star */}
              <View style={[styles.starPosition, styles.starTop]}>
                <View style={[
                  styles.starCircle,
                  affirmations[0].trim() !== '' && styles.starCircleActive
                ]}>
                  <Text style={[
                    styles.starIcon,
                    affirmations[0].trim() !== '' && styles.starIconActive
                  ]}>⭐</Text>
                </View>
                <TextInput
                  style={styles.starAffirmationInput}
                  value={affirmations[0]}
                  onChangeText={(text) => {
                    const newAffirmations = [...affirmations];
                    newAffirmations[0] = text;
                    setAffirmations(newAffirmations);
                  }}
                  placeholder="Affirmation 1"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                />
              </View>

              {/* Left Star */}
              <View style={[styles.starPosition, styles.starLeft]}>
                <View style={[
                  styles.starCircle,
                  affirmations[1].trim() !== '' && styles.starCircleActive
                ]}>
                  <Text style={[
                    styles.starIcon,
                    affirmations[1].trim() !== '' && styles.starIconActive
                  ]}>⭐</Text>
                </View>
                <TextInput
                  style={styles.starAffirmationInput}
                  value={affirmations[1]}
                  onChangeText={(text) => {
                    const newAffirmations = [...affirmations];
                    newAffirmations[1] = text;
                    setAffirmations(newAffirmations);
                  }}
                  placeholder="Affirmation 2"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                />
              </View>

              {/* Right Star */}
              <View style={[styles.starPosition, styles.starRight]}>
                <View style={[
                  styles.starCircle,
                  affirmations[2].trim() !== '' && styles.starCircleActive
                ]}>
                  <Text style={[
                    styles.starIcon,
                    affirmations[2].trim() !== '' && styles.starIconActive
                  ]}>⭐</Text>
                </View>
                <TextInput
                  style={styles.starAffirmationInput}
                  value={affirmations[2]}
                  onChangeText={(text) => {
                    const newAffirmations = [...affirmations];
                    newAffirmations[2] = text;
                    setAffirmations(newAffirmations);
                  }}
                  placeholder="Affirmation 3"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                />
              </View>

              {/* Bottom Star */}
              <View style={[styles.starPosition, styles.starBottom]}>
                <View style={[
                  styles.starCircle,
                  affirmations[3].trim() !== '' && styles.starCircleActive
                ]}>
                  <Text style={[
                    styles.starIcon,
                    affirmations[3].trim() !== '' && styles.starIconActive
                  ]}>⭐</Text>
                </View>
                <TextInput
                  style={styles.starAffirmationInput}
                  value={affirmations[3]}
                  onChangeText={(text) => {
                    const newAffirmations = [...affirmations];
                    newAffirmations[3] = text;
                    setAffirmations(newAffirmations);
                  }}
                  placeholder="Affirmation 4"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                />
              </View>

              {/* Connecting Lines (SVG) */}
              <Svg height="100%" width="100%" style={styles.linesContainer}>
                {/* Top to Left */}
                <Line
                  x1="50%"
                  y1="15%"
                  x2="20%"
                  y2="50%"
                  stroke={affirmations[0].trim() !== '' && affirmations[1].trim() !== '' ? '#FFD700' : 'rgba(255, 215, 0, 0.2)'}
                  strokeWidth="2"
                />
                {/* Top to Right */}
                <Line
                  x1="50%"
                  y1="15%"
                  x2="80%"
                  y2="50%"
                  stroke={affirmations[0].trim() !== '' && affirmations[2].trim() !== '' ? '#FFD700' : 'rgba(255, 215, 0, 0.2)'}
                  strokeWidth="2"
                />
                {/* Left to Bottom */}
                <Line
                  x1="20%"
                  y1="50%"
                  x2="50%"
                  y2="85%"
                  stroke={affirmations[1].trim() !== '' && affirmations[3].trim() !== '' ? '#FFD700' : 'rgba(255, 215, 0, 0.2)'}
                  strokeWidth="2"
                />
                {/* Right to Bottom */}
                <Line
                  x1="80%"
                  y1="50%"
                  x2="50%"
                  y2="85%"
                  stroke={affirmations[2].trim() !== '' && affirmations[3].trim() !== '' ? '#FFD700' : 'rgba(255, 215, 0, 0.2)'}
                  strokeWidth="2"
                />
              </Svg>
            </View>

            {affirmations.every((a) => a.trim() !== '') && (
              <View style={styles.constellationMessage}>
                <Text style={styles.constellationText}>
                  Look at that! Your positive feelings became beautiful stars in your universe.
                </Text>
              </View>
            )}

            <View style={styles.homeButtonContainer}>
              <TouchableOpacity
                style={styles.homeButton}
                onPress={handleComplete}
                disabled={!affirmations.every((a) => a.trim() !== '')}
              >
                <Text style={styles.homeButtonText}>Home</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  },
  blackHoleOuter: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 9,
  },
  accretionDisk: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 3,
  },
  accretionDisk1: {
    width: 250,
    height: 250,
    borderColor: 'rgba(138, 43, 226, 0.7)',
  },
  accretionDisk2: {
    width: 210,
    height: 210,
    borderColor: 'rgba(255, 0, 255, 0.5)',
  },
  accretionDisk3: {
    width: 180,
    height: 180,
    borderColor: 'rgba(148, 0, 211, 0.6)',
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
  affirmationsContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  affirmationHeader: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  affirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  starsLayout: {
    flex: 1,
    position: 'relative',
    marginTop: 20,
  },
  linesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  starPosition: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  starTop: {
    top: '5%',
    left: '50%',
    transform: [{ translateX: -80 }],
  },
  starLeft: {
    top: '42%',
    left: '5%',
  },
  starRight: {
    top: '42%',
    right: '5%',
  },
  starBottom: {
    bottom: '8%',
    left: '50%',
    transform: [{ translateX: -80 }],
  },
  starCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  starCircleActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
    borderColor: '#FFD700',
    elevation: 8,
  },
  starIcon: {
    fontSize: 32,
    opacity: 0.6,
  },
  starIconActive: {
    opacity: 1,
  },
  starAffirmationInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 13,
    width: 150,
    minHeight: 55,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
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
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  constellationText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  homeButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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