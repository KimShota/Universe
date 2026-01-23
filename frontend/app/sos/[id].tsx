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
import { playClickSound } from '../../utils/soundEffects';
import Svg, { Line } from 'react-native-svg';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// 7-screen flow content for "Hate comments hurt"
const HATE_FLOW_SCREENS = [
  {
    id: 1,
    message: "Hate comments can really hurt. Especially when you've put your heart into what you share.",
  },
  {
    id: 2,
    message: "Feeling upset doesn't mean you're weak. It means you care — and that's okay.",
  },
  {
    id: 3,
    message: "Most hate comments aren't about you. They're often a reflection of someone else's frustration or insecurity.",
  },
  {
    id: 4,
    message: "You're never judged by someone doing more than you. It's almost always from those doing less.",
  },
  {
    id: 5,
    message: "You don't need to explain yourself or fight back. Your energy is more valuable than that.",
  },
  {
    id: 6,
    message: "Your role isn't to please everyone. It's to show up for the people who need what you share.",
  },
  {
    id: 7,
    message: "You're still here. And one comment doesn't get to decide your future.",
  },
];

// 8-screen flow content for "I'm scared of what other people will think"
const REACTIONS_FLOW_SCREENS = [
  {
    id: 1,
    message: "If you're scared of what others might think, there's nothing wrong with you.\n\nYou're not broken. You're human.",
  },
  {
    id: 2,
    message: "This fear exists because humans evolved to belong. Caring about others' opinions once helped us survive.\n\nYour brain is trying to protect you.",
  },
  {
    id: 3,
    message: "Right now, your body reacts as if judgment is dangerous.\n\nBut posting content isn't a threat — even if it feels that way.\n\nYou are safe in this moment.",
  },
  {
    id: 4,
    message: "Sometimes this fear comes from past moments of rejection.\n\nThose experiences mattered — and it's okay that they still echo.\n\nThey don't define who you are now.",
  },
  {
    id: 5,
    message: "Fear can make you hesitate, and hesitation can make the fear feel stronger.\n\nThis loop isn't your fault.",
  },
  {
    id: 6,
    message: "Fear of judgment lives in thoughts, not facts.\n\nAnd thoughts can be questioned — gently, at your own pace.\n\nYou don't have to obey every thought.",
  },
  {
    id: 7,
    message: "Let's try something small — no pressure, no posting required.",
    isActionScreen: true,
    actionOptions: [
      "Write a post but don't publish it",
      "Record a video just for yourself",
      "Share something honest with one trusted person",
      "Save an idea for later",
    ],
    actionNote: "Small actions weaken fear. Avoidance strengthens it.",
  },
  {
    id: 8,
    message: "You don't need approval to start.\n\nBeing true to yourself is already enough.\n\nYou're allowed to take up space.",
  },
];

// 7-screen flow content for "Nothing seems to work"
const STUCK_FLOW_SCREENS = [
  {
    id: 1,
    message: "When nothing seems to work, it's exhausting.\n\nPutting in effort without seeing results hurts.\n\nYou're not imagining this feeling.",
  },
  {
    id: 2,
    message: "Almost every creator you admire\nfelt invisible for a long time.\n\nThis phase isn't failure — it's the beginning.",
  },
  {
    id: 3,
    message: "Low views don't mean your content is bad.\nThey mean you're early.\n\nEvery post is data. Not a verdict.",
  },
  {
    id: 4,
    message: "Confidence and quality don't come first.\nThey come from doing it many times.\n\nEvery post teaches you something — even the quiet ones.",
  },
  {
    id: 5,
    message: "The creators you look up to\nweren't built in weeks or months.\n\nIt took one year. Two years. Sometimes five.\nThat time is normal — not a problem.",
  },
  {
    id: 6,
    message: "When motivation fades, systems carry you.\nThat's why Universe exists.\n\nYou don't need a viral post.\nYou need a process you can return to.",
  },
  {
    id: 7,
    message: "You don't become a creator after success.\nYou become one by showing up consistently.\n\nDocument your life. Follow the system.\nFuture you is built one post at a time.",
  },
];

// 7-screen flow content for "I have no energy to post"
const TIRED_FLOW_SCREENS = [
  {
    id: 1,
    message: "If you feel like you have no energy to post, you're not lazy.\n\nYou're human — and this happens to every creator.",
  },
  {
    id: 2,
    message: "Posting doesn't mean creating something high-quality every day.\n\nConsistency is about showing up — not being perfect.",
  },
  {
    id: 3,
    message: "Every successful creator mixes high-effort and low-effort content.\n\nEasy posts on low-energy days are part of the process — not a failure.",
  },
  {
    id: 4,
    message: "On days like this, it's enough to:",
    isActionScreen: true,
    actionOptions: [
      "Post a B-roll with one line of text",
      "Share value in the caption only",
      "Record a talking head with no script",
    ],
  },
  {
    id: 5,
    message: "You can also repost something you shared weeks or months ago.\n\nMost people didn't see it the first time — and it still matters.",
  },
  {
    id: 6,
    message: "The creators who win aren't the ones who go all-out every day.\n\nThey're the ones who keep showing up — even on low-energy days.",
  },
  {
    id: 7,
    message: "Today doesn't need your best.\n\nIt just needs you to show up in the smallest way possible.",
  },
];

export default function SOSFlowScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const issue = SOS_ISSUES.find((i) => i.id === id);

  const [step, setStep] = useState(1); // 1: Explanation, 2: Black Hole, 3: Affirmations
  const [hateFlowStep, setHateFlowStep] = useState(1); // 1-7 for hate flow
  const [reactionsFlowStep, setReactionsFlowStep] = useState(1); // 1-8 for reactions flow
  const [stuckFlowStep, setStuckFlowStep] = useState(1); // 1-7 for stuck flow
  const [tiredFlowStep, setTiredFlowStep] = useState(1); // 1-7 for tired flow
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
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

  // Special 7-screen flow for "tired" issue
  if (id === 'tired') {
    const currentScreen = TIRED_FLOW_SCREENS[tiredFlowStep - 1];
    const isLastScreen = tiredFlowStep === 7;
    const isActionScreen = currentScreen.isActionScreen || false;

    return (
      <UniverseBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#FFD700" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              {TIRED_FLOW_SCREENS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index + 1 <= tiredFlowStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.hateFlowContainer}>
            <View style={styles.hateFlowContent}>
              <Text style={styles.hateFlowMessage}>{currentScreen.message}</Text>
              
              {isActionScreen && (
                <View style={styles.actionOptionsContainer}>
                  {currentScreen.actionOptions?.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.actionOption,
                        selectedAction === option && styles.actionOptionSelected,
                      ]}
                      onPress={() => {
                        playClickSound();
                        setSelectedAction(option);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.actionOptionText,
                        selectedAction === option && styles.actionOptionTextSelected,
                      ]}>
                        {option}
                      </Text>
                      {selectedAction === option && (
                        <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.hateFlowButtonContainer}>
              {isLastScreen ? (
                <TouchableOpacity
                  style={styles.letGoRitualButton}
                  onPress={() => {
                    playClickSound();
                    router.push({
                      pathname: '/let-go',
                      params: { issueId: 'tired' },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.letGoRitualButtonText}>Let Go Ritual</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    isActionScreen && !selectedAction && styles.continueButtonDisabled,
                  ]}
                  onPress={() => {
                    if (isActionScreen && !selectedAction) return;
                    playClickSound();
                    setTiredFlowStep(tiredFlowStep + 1);
                    setSelectedAction(null);
                  }}
                  activeOpacity={0.85}
                  disabled={isActionScreen && !selectedAction}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0a0e27" style={styles.continueIcon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </UniverseBackground>
    );
  }

  // Special 7-screen flow for "stuck" issue
  if (id === 'stuck') {
    const currentScreen = STUCK_FLOW_SCREENS[stuckFlowStep - 1];
    const isLastScreen = stuckFlowStep === 7;

    return (
      <UniverseBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#FFD700" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              {STUCK_FLOW_SCREENS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index + 1 <= stuckFlowStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.hateFlowContainer}>
            <View style={styles.hateFlowContent}>
              <Text style={styles.hateFlowMessage}>{currentScreen.message}</Text>
            </View>

            <View style={styles.hateFlowButtonContainer}>
              {isLastScreen ? (
                <TouchableOpacity
                  style={styles.letGoRitualButton}
                  onPress={() => {
                    playClickSound();
                    router.push({
                      pathname: '/let-go',
                      params: { issueId: 'stuck' },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.letGoRitualButtonText}>Let Go Ritual</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    playClickSound();
                    setStuckFlowStep(stuckFlowStep + 1);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0a0e27" style={styles.continueIcon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </UniverseBackground>
    );
  }

  // Special 8-screen flow for "reactions" issue
  if (id === 'reactions') {
    const currentScreen = REACTIONS_FLOW_SCREENS[reactionsFlowStep - 1];
    const isLastScreen = reactionsFlowStep === 8;
    const isActionScreen = currentScreen.isActionScreen || false;

    return (
      <UniverseBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#FFD700" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              {REACTIONS_FLOW_SCREENS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index + 1 <= reactionsFlowStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.hateFlowContainer}>
            <View style={styles.hateFlowContent}>
              <Text style={styles.hateFlowMessage}>{currentScreen.message}</Text>
              
              {isActionScreen && (
                <View style={styles.actionOptionsContainer}>
                  {currentScreen.actionOptions?.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.actionOption,
                        selectedAction === option && styles.actionOptionSelected,
                      ]}
                      onPress={() => {
                        playClickSound();
                        setSelectedAction(option);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.actionOptionText,
                        selectedAction === option && styles.actionOptionTextSelected,
                      ]}>
                        {option}
                      </Text>
                      {selectedAction === option && (
                        <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                      )}
                    </TouchableOpacity>
                  ))}
                  {currentScreen.actionNote && (
                    <Text style={styles.actionNote}>{currentScreen.actionNote}</Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.hateFlowButtonContainer}>
              {isLastScreen ? (
                <TouchableOpacity
                  style={styles.letGoRitualButton}
                  onPress={() => {
                    playClickSound();
                    router.push({
                      pathname: '/let-go',
                      params: { issueId: 'reactions' },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.letGoRitualButtonText}>Let Go Ritual</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    isActionScreen && !selectedAction && styles.continueButtonDisabled,
                  ]}
                  onPress={() => {
                    if (isActionScreen && !selectedAction) return;
                    playClickSound();
                    setReactionsFlowStep(reactionsFlowStep + 1);
                    setSelectedAction(null);
                  }}
                  activeOpacity={0.85}
                  disabled={isActionScreen && !selectedAction}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0a0e27" style={styles.continueIcon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </UniverseBackground>
    );
  }

  // Special 7-screen flow for "hate" issue
  if (id === 'hate') {
    const currentScreen = HATE_FLOW_SCREENS[hateFlowStep - 1];
    const isLastScreen = hateFlowStep === 7;

    return (
      <UniverseBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#FFD700" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              {HATE_FLOW_SCREENS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index + 1 <= hateFlowStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.hateFlowContainer}>
            <View style={styles.hateFlowContent}>
              <Text style={styles.hateFlowMessage}>{currentScreen.message}</Text>
            </View>

            <View style={styles.hateFlowButtonContainer}>
              {isLastScreen ? (
                <TouchableOpacity
                  style={styles.letGoRitualButton}
                  onPress={() => {
                    playClickSound();
                    router.push({
                      pathname: '/let-go',
                      params: { issueId: 'hate' },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.letGoRitualButtonText}>Let Go Ritual</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    playClickSound();
                    setHateFlowStep(hateFlowStep + 1);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0a0e27" style={styles.continueIcon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </UniverseBackground>
    );
  }

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
            <TouchableOpacity
              style={styles.letGoButton}
              onPress={() =>
                router.push({
                  pathname: '/let-go',
                  params: { issueId: String(issue.id) },
                })
              }
              activeOpacity={0.85}
            >
              <Text style={styles.letGoButtonText}>Let Go</Text>
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
    top: '18%',
    left: '8%',
  },
  asteroid2Position: {
    top: '20%',
    right: '8%',
  },
  asteroid3Position: {
    bottom: '22%',
    left: '50%',
    transform: [{ translateX: -100 }],
  },
  asteroidContainer: {
    backgroundColor: 'rgba(139, 69, 19, 0.3)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.6)',
    padding: 10,
    width: 180,
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
  // Hate flow styles
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#FFD700',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerSpacer: {
    width: 40,
  },
  hateFlowContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  hateFlowContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hateFlowMessage: {
    fontSize: 24,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    paddingHorizontal: 20,
  },
  hateFlowButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 200,
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e27',
  },
  continueIcon: {
    marginLeft: 4,
  },
  letGoRitualButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 30,
    minWidth: 250,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  letGoRitualButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a0e27',
  },
  // Reactions flow action screen styles
  actionOptionsContainer: {
    width: '100%',
    marginTop: 32,
    gap: 16,
  },
  actionOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionOptionSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  actionOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 24,
  },
  actionOptionTextSelected: {
    color: '#FFD700',
    fontWeight: '600',
  },
  actionNote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
});