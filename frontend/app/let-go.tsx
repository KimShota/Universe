import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UniverseBackground } from '../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { playClickSound } from '../utils/soundEffects';

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
  const { issueId, onboarding } = useLocalSearchParams<{ issueId?: string; onboarding?: string }>();
  const resolvedIssueId = issueId ? String(issueId) : 'unknown';
  const isOnboarding = onboarding === '1' || onboarding === 'true';

  const [fears, setFears] = useState<string[]>(['', '', '']);
  const [isVacuuming, setIsVacuuming] = useState(false);
  const [showGoodJob, setShowGoodJob] = useState(false);

  const center = useMemo(() => {
    return {
      x: SCREEN_WIDTH / 2,
      y: SCREEN_HEIGHT / 2 - 120, // Adjust for header
    };
  }, []);

  const asteroidOffsets = useMemo(() => {
    return [
      { x: -SCREEN_WIDTH * 0.24, y: -SCREEN_HEIGHT * 0.2 },
      { x: SCREEN_WIDTH * 0.30, y: -SCREEN_HEIGHT * 0.02 },
      { x: -SCREEN_WIDTH * 0.24, y: SCREEN_HEIGHT * 0.15 },
    ];
  }, []);

  const blackHoleRotate = useRef(new Animated.Value(0)).current;
  const blackHoleRotateInner = useRef(new Animated.Value(0)).current;
  const blackHolePulse = useRef(new Animated.Value(0)).current;

  const asteroidsAnim = useRef<AsteroidAnim[]>(
    asteroidOffsets.map(() => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    }))
  ).current;

  // 小惑星を復元する関数
  const restoreAsteroids = useCallback(async () => {
    try {
      const savedFears = await AsyncStorage.getItem(FEARS_STORAGE_KEY(resolvedIssueId));
      if (savedFears) {
        const parsed = JSON.parse(savedFears);
        if (Array.isArray(parsed) && parsed.length === 3) {
          setFears(parsed);
          // アニメーション値をリセット
          asteroidsAnim.forEach((anim) => {
            anim.translateX.setValue(0);
            anim.translateY.setValue(0);
            anim.scale.setValue(1);
            anim.opacity.setValue(1);
          });
          setIsVacuuming(false);
          setShowGoodJob(false);
        }
      } else {
        // データがない場合は初期状態にリセット
        setFears(['', '', '']);
        asteroidsAnim.forEach((anim) => {
          anim.translateX.setValue(0);
          anim.translateY.setValue(0);
          anim.scale.setValue(1);
          anim.opacity.setValue(1);
        });
        setIsVacuuming(false);
        setShowGoodJob(false);
      }
    } catch (error) {
      console.error('Error restoring asteroids:', error);
    }
  }, [resolvedIssueId]);

  // ページがフォーカスされたときに小惑星を復元
  useFocusEffect(
    useCallback(() => {
      restoreAsteroids();
    }, [restoreAsteroids])
  );

  // 初回マウント時にも復元
  useEffect(() => {
    restoreAsteroids();
  }, [restoreAsteroids]);

  useEffect(() => {
    // パフォーマンス最適化: より遅いアニメーション
    const rotateLoop = Animated.loop(
      Animated.timing(blackHoleRotate, {
        toValue: 1,
        duration: 20000, // 外側の降着円盤：より遅く
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 内側の降着円盤：より速く、逆方向に回転
    const rotateLoopInner = Animated.loop(
      Animated.timing(blackHoleRotateInner, {
        toValue: 1,
        duration: 12000, // 内側はより速く
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blackHolePulse, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blackHolePulse, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rotateLoop.start();
    rotateLoopInner.start();
    pulseLoop.start();

    return () => {
      rotateLoop.stop();
      rotateLoopInner.stop();
      pulseLoop.stop();
    };
  }, []);

  const rotate = blackHoleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateInner = blackHoleRotateInner.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'], // 逆方向に回転
  });

  const pulseScale = blackHolePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
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
      params: { issueId: resolvedIssueId, onboarding: isOnboarding ? '1' : undefined },
    });
  };

  const asteroidSize = 132;

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            playClickSound();
            router.back();
          }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Let Go</Text>
          <View style={{ width: 26 }} />
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.scene}>
            <View style={[styles.blackHoleWrap, { left: center.x - 175, top: center.y - 175 }]}>
              {/* 外側の降着円盤（回転） */}
              <Animated.View style={[styles.accretionOuter, { transform: [{ rotate }, { scale: pulseScale }] }]}>
                {/* 外側の降着円盤レイヤー */}
                <LinearGradient
                  colors={['rgba(100, 50, 30, 0.25)', 'rgba(80, 40, 20, 0.3)', 'rgba(60, 30, 15, 0.2)', 'rgba(40, 20, 50, 0.15)', 'transparent']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.accretionDiskOuter}
                />
                <LinearGradient
                  colors={['rgba(90, 45, 25, 0.3)', 'rgba(70, 35, 18, 0.35)', 'rgba(50, 25, 12, 0.25)', 'rgba(30, 15, 40, 0.18)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.accretionDiskMiddle}
                />
              </Animated.View>

              {/* 内側の降着円盤（より明るい、逆方向に回転） */}
              <Animated.View style={[styles.accretionInner, { transform: [{ rotate: rotateInner }] }]}>
                <LinearGradient
                  colors={['rgba(120, 60, 35, 0.5)', 'rgba(100, 50, 25, 0.6)', 'rgba(80, 40, 20, 0.45)', 'rgba(50, 30, 60, 0.3)', 'transparent']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.accretionDiskInner}
                />
              </Animated.View>

              {/* イベントホライズンのグロー */}
              <View style={styles.eventHorizonGlow} />
              
              {/* イベントホライズン */}
              <View style={styles.eventHorizon} />
              
              {/* ブラックホールコア */}
              <View style={styles.blackCore} />
            </View>

            {asteroidOffsets.map((offset, i) => {
              const left = center.x + offset.x - asteroidSize / 2;
              const top = center.y + offset.y - asteroidSize / 2;
              // 各小惑星に異なる回転角度を適用（-5deg, 0deg, 5deg）
              const rotationAngle = (i - 1) * 5;

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
                        { rotate: `${rotationAngle}deg` },
                      ],
                    },
                  ]}
                  onStartShouldSetResponder={() => true}
                >
                  <View style={styles.asteroidContainer}>
                    {/* 赤いオーラ/グロー効果 */}
                    <View style={styles.asteroidGlow} />
                    
                    {/* 小惑星本体 */}
                    <LinearGradient
                      colors={['rgba(180, 70, 50, 0.95)', 'rgba(160, 50, 35, 0.95)', 'rgba(140, 40, 25, 0.95)']}
                      start={{ x: 0.3, y: 0.3 }}
                      end={{ x: 0.7, y: 0.7 }}
                      style={styles.asteroidShell}
                    >
                      {/* ハイライト効果 */}
                      <View style={styles.asteroidHighlight} />
                      
                      {/* クレーター */}
                      <View style={[styles.asteroidCrater, styles.asteroidCrater1]} />
                      <View style={[styles.asteroidCrater, styles.asteroidCrater2]} />
                      <View style={[styles.asteroidCrater, styles.asteroidCrater3]} />
                      <View style={[styles.asteroidCrater, styles.asteroidCrater4]} />
                      <View style={[styles.asteroidCrater, styles.asteroidCrater5]} />
                      
                      {/* テクスチャの斑点 */}
                      <View style={styles.asteroidTexture1} />
                      <View style={styles.asteroidTexture2} />
                      <View style={styles.asteroidTexture3} />
                      
                      {/* 入力フィールド */}
                      <TextInput
                        style={styles.asteroidInput}
                        value={fears[i]}
                        onChangeText={(t) => {
                          const next = [...fears];
                          next[i] = t;
                          setFears(next);
                        }}
                        placeholder="Write a fear..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        editable={!isVacuuming}
                        multiline
                      />
                    </LinearGradient>
                  </View>
                </Animated.View>
              );
            })}

            <View style={styles.ctaWrap}>
              <TouchableOpacity
                style={[styles.ctaButton, isVacuuming && styles.ctaButtonDisabled]}
                onPress={() => {
                  playClickSound();
                  handleLetGo();
                }}
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
          </View>
        </TouchableWithoutFeedback>

        <Modal visible={showGoodJob} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Great job for letting go of your fears!</Text>
              <Text style={styles.modalSubtitle}>
                Now, let's write three affirmations —promises you're making to yourself — and add them as shining stars in your universe.
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={() => {
                playClickSound();
                handleBecomeConfident();
              }} activeOpacity={0.85}>
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
    width: 350,
    height: 350,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accretionOuter: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  accretionInner: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  accretionDiskOuter: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  accretionDiskMiddle: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  accretionDiskInner: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  eventHorizonGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  eventHorizon: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  blackCore: {
    width: 163,
    height: 163,
    borderRadius: 81.5,
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  asteroid: {
    position: 'absolute',
  },
  asteroidContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  asteroidGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 999,
    backgroundColor: 'rgba(220, 50, 30, 0.5)',
    shadowColor: 'rgba(220, 50, 30, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 15,
  },
  asteroidShell: {
    flex: 1,
    width: '100%',
    height: '100%',
    // より球体に近い形状
    borderRadius: 66, // 132/2 = 66 (asteroidSize/2)
    borderWidth: 2,
    borderColor: 'rgba(150, 40, 25, 0.7)',
    padding: 12,
    overflow: 'hidden',
    // 立体感のある影
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 15,
  },
  asteroidHighlight: {
    position: 'absolute',
    top: 8,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 150, 100, 0.3)',
    shadowColor: 'rgba(255, 150, 100, 0.6)',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  asteroidCrater: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  asteroidCrater1: {
    left: 12,
    top: 14,
    width: 28,
    height: 28,
  },
  asteroidCrater2: {
    right: 14,
    bottom: 18,
    width: 22,
    height: 22,
  },
  asteroidCrater3: {
    left: 20,
    top: 50,
    width: 18,
    height: 18,
  },
  asteroidCrater4: {
    right: 20,
    top: 30,
    width: 16,
    height: 16,
  },
  asteroidCrater5: {
    left: 50,
    bottom: 20,
    width: 20,
    height: 20,
  },
  asteroidTexture1: {
    position: 'absolute',
    top: 30,
    right: 25,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(60, 40, 25, 0.4)',
  },
  asteroidTexture2: {
    position: 'absolute',
    bottom: 35,
    left: 30,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(50, 35, 20, 0.35)',
  },
  asteroidTexture3: {
    position: 'absolute',
    top: 60,
    left: 45,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(70, 45, 30, 0.3)',
  },
  asteroidInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    textAlignVertical: 'top',
    zIndex: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 20,
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


