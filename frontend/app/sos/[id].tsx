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
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { playClickSound } from '../../utils/soundEffects';
import Svg, { Line } from 'react-native-svg';

const { width } = Dimensions.get('window');

// 9-screen flow content for "Hate comments hurt"
const HATE_FLOW_SCREENS = [
  {
    id: 1,
    message: "Let's be honest. Hate comments hurt. Even when you try to ignore them, they can stay in your mind longer than they should. That feeling is normal. You're human.",
  },
  {
    id: 2,
    message: "Hate comments are not about you. They are a reflection of who they are, their anger, insecurity, or frustration. They project their emotions onto you because they don't know how to deal with them themselves.",
  },
  {
    id: 3,
    message: "Here's something important to remember: Those people are not doing more than you. You are already ahead of them. People who are building don't waste time tearing others down.",
  },
  {
    id: 4,
    message: "Don't let someone else's negativity: control your emotions, slow your progress, and stop you from posting. Your growth is too valuable to be paused by that negativity.",
  },
  {
    id: 5,
    message: "If someone is negative or disrespectful to you, unfollow them immediately. Protecting your mental space is the highest priority.",
  },
  {
    id: 6,
    message: "This also applies to friends. If your friends constantly discourage you, mock your goals, or make you doubt yourself… Ask yourself: Are they truly supporting you? Real friends support your growth, even when they don't fully understand it.",
  },
  {
    id: 7,
    message: "Sometimes, even family members won't support you. That's painful, but it's normal. Not everyone will understand your vision. That's why trusting yourself matters more than approval.",
  },
  {
    id: 8,
    message: "Building a personal brand is one of the most valuable assets in history. It compounds. It opens doors. It creates freedom. Don't let temporary comments destroy long-term value.",
  },
  {
    id: 9,
    message: "Also, remember that not every negative comment is bad. Some may sound harsh, but carry lessons you can learn from. Take what helps you. Ignore what doesn't. Growth comes from discernment.",
  },
];

// 8-screen flow content for "I'm scared of what other people will think"
type ReactionsFlowScreen = {
  id: number;
  message: string;
  isActionScreen?: boolean;
  actionOptions?: string[];
  actionNote?: string;
};
const REACTIONS_FLOW_SCREENS: ReactionsFlowScreen[] = [
  {
    id: 1,
    message: "It's completely okay to feel scared before posting content for the first time. Fear doesn't mean you're weak. It means you're stepping outside your comfort zone. Every confident creator you admire once felt this exact same fear.",
  },
  {
    id: 2,
    message: "Here's a brutal truth. No one is thinking about you as much as you think they are. People are too busy worrying about themselves.",
  },
  {
    id: 3,
    message: 'You might think: "Everyone is watching me." "Everyone thinks I\'m cringey." But that\'s not reality. Most people are thinking about themselves. They have their own worries.',
  },
  {
    id: 4,
    message: 'In fact, many people who see your content are quietly thinking: "I wish I had the courage to do that." Some won\'t admit it, but they\'re jealous because you\'re TRYING.',
  },
  {
    id: 5,
    message: "Being real doesn't make you cringey. Showing your struggles doesn't make you weak. It makes you human. And humans connect with honesty, not perfection. So, be yourself when you create content.",
  },
  {
    id: 6,
    message: "When you show up as your true self, you're not just posting content. You're building a personal brand. You're creating connections. You're helping someone feel less alone. That matters more than views.",
  },
  {
    id: 7,
    message: "You don't succeed because you're fearless. You succeed because you keep posting anyway. You learn. You improve. You stay consistent. Confidence comes after action.",
  },
  {
    id: 8,
    message: "You will never be judged by people doing more than you. Judgment almost always comes from people doing less. So keep going. The right people are watching, and they're rooting for you.",
  },
];

// 8-screen flow content for "Nothing seems to work"
const STUCK_FLOW_SCREENS = [
  {
    id: 1,
    message: 'There are moments when you think: "Nothing is working." "I\'m not going to succeed." "Posting isn\'t worth it… I should just quit." If you feel this way, pause for a second and read this. This moment happens to everyone.',
  },
  {
    id: 2,
    message: "Success doesn't always come fast. It might take: one month, one year, two years or even five years. That doesn't mean you're failing. It means you're early.",
  },
  {
    id: 3,
    message: "It took MrBeast around 7 to 8 years to succeed. Years of posting. Years of trying. Years of seeing almost no results. He didn't win because he was lucky. He won because he never quit. That's how you win content creation.",
  },
  {
    id: 4,
    message: "Most days won't feel exciting. Some days, it will feel like nothing has changed. No growth. No validation. No progress. But progress is happening quietly, even when you can't see it yet.",
  },
  {
    id: 5,
    message: "Always think in terms of the long game. If success came instantly, dreams wouldn't be meaningful. Dreams are exciting because they're hard. Because they demand patience. Because they test your commitment.",
  },
  {
    id: 6,
    message: "There will be obstacles for sure. There will be slow periods for sure. But if you know deep down that you will succeed, then you might as well enjoy the journey. Don't suffer through the process. Grow through it.",
  },
  {
    id: 7,
    message: "The shortest path to success is not talent. It's not motivation. It's not luck. It's consistency. Showing up again. Even when it's boring. Even when it feels pointless.",
  },
  {
    id: 8,
    message: "If you keep posting consistently, and keep improving step by step, success becomes inevitable. Trust the process. Trust the system. Trust yourself.",
  },
];

// 8-screen flow content for "I have no energy to post"
type TiredFlowScreen = {
  id: number;
  message: string;
  isActionScreen?: boolean;
  actionOptions?: string[];
};
const TIRED_FLOW_SCREENS: TiredFlowScreen[] = [
  {
    id: 1,
    message: "I know you're tired. It's almost bedtime. You've already done everything you needed to do today. All you want is to sleep.",
  },
  {
    id: 2,
    message: 'Right now, you might be thinking: "Every post needs to be perfect." "If I can\'t do it properly, I shouldn\'t post at all." But that\'s not true.',
  },
  {
    id: 3,
    message: "When you're busy or exhausted, you don't need a perfect post. You can simply: post a B-roll with one honest line of text and value in the caption, or record a talking-head video with no script. Showing up imperfectly is still showing up.",
  },
  {
    id: 4,
    message: "Some of the most relatable content is made when you're tired. No edits. No overthinking. Just real energy. Your audience connects with you, not perfection.",
  },
  {
    id: 5,
    message: "Here's a secret most people don't realize: Famous creators don't create content every single day. They plan ahead. They batch. They work smarter, not harder.",
  },
  {
    id: 6,
    message: "Batching means: scripting multiple posts at once, filming multiple videos in one session, resting on the days you don't have energy. This is how creators stay consistent without burning out.",
  },
  {
    id: 7,
    message: "You don't need to post daily. Aim for at least 4 posts a week. That's enough to: build trust, create connections, stay visible. Consistency beats intensity.",
  },
  {
    id: 8,
    message: "Not all content needs to be polished. In fact, imperfection is more beautiful than perfection. It makes you relatable. It makes you human. It deepens your connection with your audience.",
  },
];

export default function SOSFlowScreen() {
  const { id, onboarding } = useLocalSearchParams<{ id?: string; onboarding?: string }>();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const issue = SOS_ISSUES.find((i) => i.id === id);
  const isOnboarding = onboarding === '1' || onboarding === 'true';

  const [step, setStep] = useState(1); // 1: Explanation, 2: Black Hole, 3: Affirmations
  const [hateFlowStep, setHateFlowStep] = useState(1); // 1-7 for hate flow
  const [reactionsFlowStep, setReactionsFlowStep] = useState(1); // 1-8 for reactions flow
  const [stuckFlowStep, setStuckFlowStep] = useState(1); // 1-8 for stuck flow
  const [tiredFlowStep, setTiredFlowStep] = useState(1); // 1-8 for tired flow
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
      if (!user?.id) return;
      await supabase.from('sos_completions').insert({
        user_id: user.id,
        issue_type: issue.id,
        asteroids,
        affirmations,
        completed_at: new Date().toISOString(),
      });
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single();
      const curCoins = profile?.coins ?? 0;
      await supabase.from('profiles').update({ coins: curCoins + 10 }).eq('id', user.id);
      await refreshUser();
      router.push('/(tabs)/main');
    } catch (error) {
      console.error('Error completing SOS:', error);
    }
  };

  // Special 8-screen flow for "tired" issue
  if (id === 'tired') {
    const currentScreen = TIRED_FLOW_SCREENS[tiredFlowStep - 1];
    const isLastScreen = tiredFlowStep === TIRED_FLOW_SCREENS.length;
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
                      params: { issueId: 'tired', onboarding: isOnboarding ? '1' : undefined },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.letGoRitualButtonText}>Let Go</Text>
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

  // Special 8-screen flow for "stuck" issue
  if (id === 'stuck') {
    const currentScreen = STUCK_FLOW_SCREENS[stuckFlowStep - 1];
    const isLastScreen = stuckFlowStep === STUCK_FLOW_SCREENS.length;

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
                      params: { issueId: 'stuck', onboarding: isOnboarding ? '1' : undefined },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.letGoRitualButtonText}>Let Go</Text>
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
                      params: { issueId: 'reactions', onboarding: isOnboarding ? '1' : undefined },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.letGoRitualButtonText}>Let Go</Text>
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

  // Special 9-screen flow for "hate" issue
  if (id === 'hate') {
    const currentScreen = HATE_FLOW_SCREENS[hateFlowStep - 1];
    const isLastScreen = hateFlowStep === HATE_FLOW_SCREENS.length;

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
                      params: { issueId: 'hate', onboarding: isOnboarding ? '1' : undefined },
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.letGoRitualButtonText}>Let Go</Text>
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
                  params: { issueId: String(issue.id), onboarding: isOnboarding ? '1' : undefined },
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