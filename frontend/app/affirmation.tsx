import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { UniverseBackground } from '../components/UniverseBackground';
import { useAuth } from '../contexts/AuthContext';

const SAD_STAR = require('../Media/crying-star.png');
const HAPPY_STAR = require('../Media/happy-star.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const FEARS_STORAGE_KEY = (issueId: string) => `sos:${issueId}:fears`;

type BurstProps = {
  side: 'left' | 'right';
  isActive: boolean;
};

const CrackerBurst: React.FC<BurstProps> = ({ side, isActive }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;

    progress.setValue(0);
    // パフォーマンス最適化: ループを削除して1回だけ実行
    const sequence = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 1200, useNativeDriver: true }), // 520ms → 1200ms（より遅く）
      Animated.timing(progress, { toValue: 0, duration: 1200, useNativeDriver: true }), // 520ms → 1200ms
    ]);
    sequence.start();
    return () => sequence.stop();
  }, [isActive]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.05],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  const x = side === 'left' ? -1 : 1;
  const pieces = useMemo(() => {
    const colors = ['#FFD700', '#A855F7', '#38BDF8', '#FB7185', '#4ADE80'];
    // パフォーマンス最適化: 10個 → 6個に削減
    return Array.from({ length: 6 }).map((_, i) => {
      const rot = i * 60 + (side === 'left' ? 12 : -12); // 36度 → 60度（6個に合わせて調整）
      const c = colors[i % colors.length];
      return { rot, color: c };
    });
  }, [side]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.burstWrap,
        side === 'left' ? { left: 22 } : { right: 22 },
        { opacity, transform: [{ scale }] },
      ]}
    >
      {pieces.map((p, i) => (
        <View
          key={`${side}-piece-${i}`}
          style={[
            styles.burstPiece,
            {
              backgroundColor: p.color,
              transform: [
                { rotate: `${p.rot}deg` },
                { translateX: x * (18 + i * 2) },
              ],
            },
          ]}
        />
      ))}
      <View style={styles.burstCore} />
    </Animated.View>
  );
};

export default function AffirmationScreen() {
  const router = useRouter();
  const { issueId } = useLocalSearchParams<{ issueId?: string }>();
  const resolvedIssueId = issueId ? String(issueId) : 'unknown';
  const { refreshUser } = useAuth();

  const [fears, setFears] = useState<string[]>(['', '', '']);
  const [affirmations, setAffirmations] = useState<string[]>(['', '', '']);
  const [showCelebration, setShowCelebration] = useState(false);

  const glow = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  
  // Decorative stars animation
  const decorativeStars = useMemo(() => {
    // パフォーマンス最適化: 15個 → 8個に削減
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.3,
      twinkleSpeed: Math.random() * 4000 + 3000, // より遅いアニメーション
    }));
  }, []);

  const starAnimations = useRef(
    decorativeStars.map((star) => ({
      opacity: new Animated.Value(star.opacity),
      // パフォーマンス最適化: scaleアニメーションを削除
    }))
  ).current;

  useEffect(() => {
    starAnimations.forEach((anim, i) => {
      const star = decorativeStars[i];
      // パフォーマンス最適化: scaleアニメーションを削除してopacityのみに
      const twinkle = Animated.loop(
        Animated.sequence([
          Animated.timing(anim.opacity, {
            toValue: Math.min(1, star.opacity + 0.4),
            duration: star.twinkleSpeed / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: star.opacity,
            duration: star.twinkleSpeed / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      twinkle.start();
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FEARS_STORAGE_KEY(resolvedIssueId));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length === 3) setFears(parsed);
        }
      } catch {
        // ignore
      }
    })();
  }, [resolvedIssueId]);

  useEffect(() => {
    affirmations.forEach((a, i) => {
      Animated.timing(glow[i], {
        toValue: a.trim() ? 1 : 0,
        duration: 450,
        useNativeDriver: true,
      }).start();
    });
  }, [affirmations]);

  const starPositions = useMemo(() => {
    return [
      { x: SCREEN_WIDTH * 0.45, y: SCREEN_HEIGHT * 0.13 },
      { x: SCREEN_WIDTH * 0.24, y: SCREEN_HEIGHT * 0.44 },
      { x: SCREEN_WIDTH * 0.70, y: SCREEN_HEIGHT * 0.44 },
    ];
  }, []);

  const handleGoHome = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      await fetch(`${BACKEND_URL}/api/sos/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          issue_type: resolvedIssueId,
          asteroids: fears,
          affirmations,
        }),
      });
      await refreshUser();
    } catch {
      // ignore (still allow navigation)
    }

    router.replace('/(tabs)/main');
  };

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become Confident</Text>
          <View style={{ width: 26 }} />
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.body}>
            <Text style={styles.title}>Write 3 affirmations</Text>
            <Text style={styles.subtitle}>
              As you fill each star, it will start to glow.
            </Text>

            {/* Decorative stars */}
            {decorativeStars.map((star, i) => {
              const anim = starAnimations[i];
              return (
                <Animated.View
                  key={`dec-star-${star.id}`}
                  style={[
                    styles.decorativeStar,
                    {
                      left: star.x,
                      top: star.y,
                      width: star.size,
                      height: star.size,
                      borderRadius: star.size / 2,
                      opacity: anim.opacity,
                      // パフォーマンス最適化: scaleアニメーションを削除
                    },
                  ]}
                />
              );
            })}

            <View style={styles.starsStage}>
              {starPositions.map((p, i) => {
                const isHappy = affirmations[i].trim() !== '';
                const scale = glow[i].interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
                const starOpacity = glow[i].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

                return (
                  <View
                    key={`star-${i}`}
                    style={[styles.starWrap, { left: p.x - 74, top: p.y - 74 }]}
                    onStartShouldSetResponder={() => true}
                  >
                    <Animated.View style={[styles.starCharWrap, { opacity: starOpacity, transform: [{ scale }] }]}>
                      <Image
                        source={isHappy ? HAPPY_STAR : SAD_STAR}
                        style={styles.starImage}
                        resizeMode="contain"
                      />
                    </Animated.View>

                    <TextInput
                      style={styles.starInput}
                      value={affirmations[i]}
                      onChangeText={(t) => {
                        const next = [...affirmations];
                        next[i] = t;
                        setAffirmations(next);
                      }}
                      placeholder={`Affirmation ${i + 1}`}
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      multiline
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.homeButton, !affirmations.every((a) => a.trim()) && styles.homeButtonDisabled]}
                onPress={() => affirmations.every((a) => a.trim()) && setShowCelebration(true)}
                disabled={!affirmations.every((a) => a.trim())}
                activeOpacity={0.85}
              >
                <Text style={styles.homeButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>

        <Modal visible={showCelebration} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Celebration</Text>
              <Text style={styles.modalSubtitle}>
                You turned your words into light. Keep going.
              </Text>

              <View style={styles.burstsRow}>
                <CrackerBurst side="left" isActive={showCelebration} />
                <CrackerBurst side="right" isActive={showCelebration} />
              </View>

              <TouchableOpacity style={styles.modalButton} onPress={handleGoHome} activeOpacity={0.85}>
                <Text style={styles.modalButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
  },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 10 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    fontSize: 12,
  },
  starsStage: { flex: 1 },
  decorativeStar: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  starWrap: {
    position: 'absolute',
    width: 148,
    minHeight: 190,
    alignItems: 'center',
  },
  starCharWrap: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starImage: {
    width: 148,
    height: 148,
  },
  starInput: {
    marginTop: 12,
    width: '100%',
    minHeight: 64,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
    color: '#fff',
    textAlignVertical: 'top',
    fontSize: 13,
    lineHeight: 17,
  },
  footer: {
    paddingBottom: 26,
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 999,
    minWidth: 180,
    alignItems: 'center',
  },
  homeButtonDisabled: { opacity: 0.55 },
  homeButtonText: {
    color: '#0b0b12',
    fontWeight: '900',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    padding: 22,
    backgroundColor: 'rgba(18, 18, 28, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.22)',
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  burstsRow: {
    height: 90,
    justifyContent: 'center',
    marginBottom: 16,
  },
  burstWrap: {
    position: 'absolute',
    top: 10,
    width: 110,
    height: 70,
    justifyContent: 'center',
  },
  burstPiece: {
    position: 'absolute',
    left: 52,
    top: 34,
    width: 18,
    height: 3,
    borderRadius: 2,
    opacity: 0.95,
  },
  burstCore: {
    position: 'absolute',
    left: 48,
    top: 30,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },
  modalButton: {
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#0b0b12',
    fontWeight: '900',
    fontSize: 16,
  },
});


