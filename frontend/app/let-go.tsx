import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UniverseBackground } from '../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FEARS_STORAGE_KEY = (issueId: string) => `sos:${issueId}:fears`;

type AsteroidAnim = {
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
};

export default function LetGoScreen() {
  const router = useRouter();
  const { issueId } = useLocalSearchParams<{ issueId?: string }>();
  const resolvedIssueId = issueId ? String(issueId) : 'unknown';

  const [fears, setFears] = useState<string[]>(['', '', '']);
  const [isVacuuming, setIsVacuuming] = useState(false);
  const [showGoodJob, setShowGoodJob] = useState(false);

  const center = useMemo(() => {
    return {
      x: SCREEN_WIDTH / 2,
      y: SCREEN_HEIGHT / 2 - 40, // Adjust for header
    };
  }, []);

  const asteroidOffsets = useMemo(() => {
    return [
      { x: -SCREEN_WIDTH * 0.24, y: -SCREEN_HEIGHT * 0.3 },
      { x: SCREEN_WIDTH * 0.30, y: -SCREEN_HEIGHT * 0.08 },
      { x: -SCREEN_WIDTH * 0.24, y: SCREEN_HEIGHT * 0.10 },
    ];
  }, []);

  const blackHoleRotate = useRef(new Animated.Value(0)).current;
  const blackHolePulse = useRef(new Animated.Value(0)).current;
  const pullPulse = useRef(new Animated.Value(0)).current;

  const asteroidsAnim = useRef<AsteroidAnim[]>(
    asteroidOffsets.map(() => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(blackHoleRotate, {
        toValue: 1,
        duration: 7000,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blackHolePulse, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(blackHolePulse, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ])
    );

    const pullLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pullPulse, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pullPulse, {
          toValue: 0,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );

    rotateLoop.start();
    pulseLoop.start();
    pullLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      pullLoop.stop();
    };
  }, []);

  const rotate = blackHoleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseScale = blackHolePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const pullScale = pullPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const handleLetGo = async () => {
    if (isVacuuming) return;
    setIsVacuuming(true);

    const animations: Animated.CompositeAnimation[] = [];

    asteroidOffsets.forEach((offset, i) => {
      animations.push(
        Animated.timing(asteroidsAnim[i].translateX, {
          toValue: -offset.x,
          duration: 1400,
          useNativeDriver: true,
        })
      );
      animations.push(
        Animated.timing(asteroidsAnim[i].translateY, {
          toValue: -offset.y,
          duration: 1400,
          useNativeDriver: true,
        })
      );
      animations.push(
        Animated.timing(asteroidsAnim[i].scale, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        })
      );
      animations.push(
        Animated.timing(asteroidsAnim[i].opacity, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        })
      );
    });

    Animated.parallel(animations).start(async () => {
      try {
        await AsyncStorage.setItem(FEARS_STORAGE_KEY(resolvedIssueId), JSON.stringify(fears));
      } catch {
        // ignore
      }
      setIsVacuuming(false);
      setShowGoodJob(true);
    });
  };

  const handleBecomeConfident = () => {
    setShowGoodJob(false);
    router.push({
      pathname: '/affirmation',
      params: { issueId: resolvedIssueId },
    });
  };

  const asteroidSize = 132;

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Let Go</Text>
          <View style={{ width: 26 }} />
        </View>

        <Animated.View style={[styles.scene, { transform: [{ scale: pullScale }] }]}>
          <View style={[styles.blackHoleWrap, { left: center.x - 160, top: center.y - 220 }]}>
            <Animated.View style={[styles.accretionOuter, { transform: [{ rotate }, { scale: pulseScale }] }]}>
              <View style={[styles.ring, styles.ring1]} />
              <View style={[styles.ring, styles.ring2]} />
              <View style={[styles.ring, styles.ring3]} />
              <View style={styles.glowHalo} />
            </Animated.View>

            <View style={styles.blackCore} />
            <View style={styles.eventHorizon} />
          </View>

          {asteroidOffsets.map((offset, i) => {
            const left = center.x + offset.x - asteroidSize / 2;
            const top = center.y + offset.y - asteroidSize / 2;

            return (
              <Animated.View
                key={`asteroid-${i}`}
                style={[
                  styles.asteroid,
                  {
                    left,
                    top,
                    width: asteroidSize,
                    height: asteroidSize,
                    opacity: asteroidsAnim[i].opacity,
                    transform: [
                      { translateX: asteroidsAnim[i].translateX },
                      { translateY: asteroidsAnim[i].translateY },
                      { scale: asteroidsAnim[i].scale },
                    ],
                  },
                ]}
              >
                <View style={styles.asteroidShell}>
                  <View style={styles.asteroidCrater1} />
                  <View style={styles.asteroidCrater2} />
                  <TextInput
                    style={styles.asteroidInput}
                    value={fears[i]}
                    onChangeText={(t) => {
                      const next = [...fears];
                      next[i] = t;
                      setFears(next);
                    }}
                    placeholder="Write a fear..."
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    editable={!isVacuuming}
                    multiline
                  />
                </View>
              </Animated.View>
            );
          })}

          <View style={styles.ctaWrap}>
            <TouchableOpacity
              style={[styles.ctaButton, isVacuuming && styles.ctaButtonDisabled]}
              onPress={handleLetGo}
              disabled={isVacuuming}
              activeOpacity={0.85}
            >
              <Ionicons name="radio-button-on" size={18} color="#0b0b12" />
              <Text style={styles.ctaText}>{isVacuuming ? 'Releasing...' : 'Let Go'}</Text>
            </TouchableOpacity>
            <Text style={styles.hintText}>
              Type your fears into the asteroids, then release them into the void.
            </Text>
          </View>
        </Animated.View>

        <Modal visible={showGoodJob} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Good job</Text>
              <Text style={styles.modalSubtitle}>
                You let it go. Now write what you want to believe instead.
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={handleBecomeConfident} activeOpacity={0.85}>
                <Text style={styles.modalButtonText}>Become Confident</Text>
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
  scene: { flex: 1 },
  blackHoleWrap: {
    position: 'absolute',
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accretionOuter: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },
  ring1: {
    width: 300,
    height: 300,
    borderColor: 'rgba(255, 140, 0, 0.24)',
  },
  ring2: {
    width: 250,
    height: 250,
    borderColor: 'rgba(168, 85, 247, 0.20)',
  },
  ring3: {
    width: 200,
    height: 200,
    borderColor: 'rgba(56, 189, 248, 0.16)',
  },
  glowHalo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  eventHorizon: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  blackCore: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#050509',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 20,
  },
  asteroid: {
    position: 'absolute',
  },
  asteroidShell: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  asteroidCrater1: {
    position: 'absolute',
    left: 12,
    top: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  asteroidCrater2: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  asteroidInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    textAlignVertical: 'top',
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 36,
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.45)',
  },
  ctaButtonDisabled: { opacity: 0.7 },
  ctaText: {
    color: '#0b0b12',
    fontWeight: '800',
    fontSize: 16,
  },
  hintText: {
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
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
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
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


