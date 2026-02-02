import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { UniverseBackground } from '../../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import Svg, { Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playClickSound } from '../../utils/soundEffects';

const { width } = Dimensions.get('window');

const PLANETS = [
  require('../../Media/mercury.png'),
  require('../../Media/venus.png'),
  require('../../Media/earth.png'),
  require('../../Media/mars.png'),
  require('../../Media/jupiter.png'),
  require('../../Media/saturn.png'),
  require('../../Media/uranus.png'),
  require('../../Media/neptune.png'),
];

export default function MainScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAssetsMenu, setShowAssetsMenu] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const { data: missionData } = useQuery({
    queryKey: ['mission', today, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('missions')
        .select('completed')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      return data?.completed ?? false;
    },
    enabled: !!user?.id,
  });
  const missionCompleted = missionData ?? false;

  const handlePlanetPress = (planetIndex: number) => {
    playClickSound();
    if (user && planetIndex === user.current_planet && !missionCompleted) {
      setShowMissionModal(true);
    }
  };

  const handleMissionComplete = async () => {
    playClickSound();
    try {
      if (!user?.id) return;

      const [missionsResult, profileResult] = await Promise.all([
        supabase.from('missions').select('completed').eq('user_id', user.id).eq('date', today).maybeSingle(),
        supabase.from('profiles').select('coins, current_planet, last_post_date, streak').eq('id', user.id).single(),
      ]);

      const existing = missionsResult.data;
      if (existing?.completed) return;

      const profile = profileResult.data;
      const cur = profile ?? { coins: 0, current_planet: 0, last_post_date: null, streak: 0 };

      await supabase.from('missions').upsert(
        { user_id: user.id, date: today, completed: true },
        { onConflict: 'user_id,date' }
      );
      let newStreak = 1;
      if (cur.last_post_date) {
        const last = new Date(cur.last_post_date);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
        newStreak = daysDiff === 1 ? (cur.streak ?? 0) + 1 : 1;
      }

      await supabase
        .from('profiles')
        .update({
          coins: (cur.coins ?? 0) + 10,
          current_planet: (cur.current_planet ?? 0) + 1,
          last_post_date: today,
          streak: newStreak,
        })
        .eq('id', user.id);

      queryClient.invalidateQueries({ queryKey: ['mission', today, user.id] });
      setShowMissionModal(false);
      await refreshUser();
    } catch (error) {
      console.error('Error completing mission:', error);
    }
  };

  const currentStep = user?.current_planet ?? 0;
  const visibleSteps = Math.min(
    365,
    10 * (1 + Math.floor(currentStep / 10))
  );

  const roadmapSteps = Array.from({ length: visibleSteps }, (_, i) => {
      const isLeft = i % 2 === 0;
    const yPosition = 80 + i * 100;
    const xPosition = isLeft ? width * 0.2 : width * 0.7;

    return {
      id: i,
      x: xPosition,
      y: yPosition,
      completed: i < currentStep,
      current: i === currentStep,
    };
  });

  return (
    <UniverseBackground>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
              onPress={() => {
                playClickSound();
                setShowMenu(true);
              }}
          >
              <Ionicons name="menu" size={28} color="#ffffff" />
          </TouchableOpacity>

            <View style={styles.streakContainer}>
              <Text style={styles.streakText}>🔥 {user?.streak || 0} day streak</Text>
            </View>
          </View>

          {/* Roadmap Section */}
          <ScrollView
            style={styles.roadmapScroll}
            contentContainerStyle={styles.roadmapContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>I'M THE NICHE</Text>

            <View style={styles.roadmapContainer}>
              <Svg height={roadmapSteps[roadmapSteps.length - 1].y + 100} width={width}>
                {roadmapSteps.map((step, index) => {
                  if (index < roadmapSteps.length - 1) {
                    const nextStep = roadmapSteps[index + 1];
                    const completed = step.completed;
                    return (
                      <React.Fragment key={`line-${step.id}`}>
                        {completed ? (
                          <>
                            <Line
                              x1={step.x}
                              y1={step.y}
                              x2={nextStep.x}
                              y2={nextStep.y}
                              stroke="#FFD700"
                              strokeWidth="6"
                              opacity={0.35}
                            />
                            <Line
                              x1={step.x}
                              y1={step.y}
                              x2={nextStep.x}
                              y2={nextStep.y}
                              stroke="#FFD700"
                              strokeWidth="2.5"
                              opacity={1}
                            />
                          </>
                        ) : (
                          <Line
                            x1={step.x}
                            y1={step.y}
                            x2={nextStep.x}
                            y2={nextStep.y}
                            stroke="#b8860b"
                            strokeWidth="2"
                            opacity={0.5}
                          />
                        )}
                      </React.Fragment>
                    );
                  }
                  return null;
                })}

              </Svg>

              {roadmapSteps.map((step) => (
                <TouchableOpacity
                  key={step.id}
                  style={[
                    styles.stepCircle,
                    {
                      left: step.x - 40,
                      top: step.y - 40,
                    },
                    step.completed && styles.stepCompleted,
                    step.current && styles.stepCurrent,
                    !step.completed && styles.stepShadowed,
                  ]}
                  onPress={() => handlePlanetPress(step.id)}
                  disabled={!step.current || missionCompleted}
                >
                  <Image
                    source={PLANETS[step.id % PLANETS.length]}
                    style={[
                      styles.planetImage,
                      !step.completed && styles.planetImageShadowed,
                    ]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Navigation */}
          <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                playClickSound();
                router.push('/(tabs)/content-tips');
              }}
            >
              <Ionicons name="bulb-outline" color="#ffffff" size={24} />
              <Text style={styles.navText}>Content Tips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosButton}
              onPress={() => {
                playClickSound();
                router.push('/sos');
              }}
            >
              <Ionicons name="alert-circle" color="#ffffff" size={40} />
              <Text style={styles.sosText}>SOS!</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                playClickSound();
                router.push('/(tabs)/creator-universe');
              }}
            >
              <Ionicons name="telescope-outline" color="#ffffff" size={24} />
              <Text style={styles.navText}>Creator Universe</Text>
            </TouchableOpacity>
          </View>

          {/* Assets Button */}
          <TouchableOpacity
            style={[styles.assetsButton, { bottom: insets.bottom + 120 }]}
            onPress={() => {
              playClickSound();
              setShowAssetsMenu(true);
            }}
          >
            <Ionicons name="folder-outline" size={24} color="#0a0e27" />
            <Text style={styles.assetsButtonText}>Assets</Text>
          </TouchableOpacity>
        </View>

        {/* Mission Modal */}
        <Modal
          visible={showMissionModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMissionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.missionModalContent}>
              <Text style={styles.missionModalTitle}>TODAY'S MISSION</Text>
              <Text style={styles.missionStatus}>SYSTEM SYNC: <Text style={styles.missionStatusActive}>ACTIVE</Text></Text>

              <View style={styles.missionCard}>
                <View style={styles.missionCardHeader}>
                  <View style={styles.missionIconWrap}>
                    <Ionicons name="rocket-outline" size={28} color="#FFD700" />
                  </View>
                  <Text style={styles.missionCardTitle}>Post your content</Text>
                </View>
                <Text style={styles.missionCardDescription}>
                  Post your content to share your story with others.
                </Text>
                <View style={styles.missionProgressRow}>
                  <Text style={styles.missionLabel}>PROGRESS</Text>
                  <View style={styles.missionProgressWrap}>
                    <View style={[styles.missionProgressBar, { flex: 1 }]}>
                      <View style={[styles.missionProgressFill, { width: missionCompleted ? '100%' : '0%' }]} />
                    </View>
                    <Text style={styles.missionProgressText}>{missionCompleted ? '1' : '0'}/1</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.postNowButton}
                onPress={handleMissionComplete}
                activeOpacity={0.85}
              >
                <Text style={styles.postNowButtonText}>POST NOW</Text>
                <Ionicons name="arrow-forward" size={20} color="#0a0e27" style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissMissionButton}
                onPress={() => {
                  playClickSound();
                  setShowMissionModal(false);
                }}
              >
                <Text style={styles.dismissMissionText}>Dismiss Mission</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Menu Modal */}
        <Modal
          visible={showMenu}
          transparent
          animationType="slide"
          onRequestClose={() => setShowMenu(false)}
        >
          <View style={styles.menuOverlay}>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Menu</Text>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>

              <TouchableOpacity
                style={styles.homeMenuButton}
                onPress={async () => {
                  playClickSound();
                  try {
                    await AsyncStorage.removeItem('onboarding:done');
                    await AsyncStorage.removeItem('onboarding:branch');
                    await AsyncStorage.removeItem('onboarding:primaryStruggle');
                    await AsyncStorage.removeItem('onboarding:primaryIssueId');
                  } catch {
                    // ignore
                  }
                  setShowMenu(false);
                  router.replace('/onboarding');
                }}
              >
                <Ionicons name="refresh-outline" size={24} color="#FFD700" />
                <Text style={styles.homeMenuButtonText}>Reset Onboarding</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteAccountButton}
                onPress={() => {
                  playClickSound();
                  Alert.alert(
                    'Delete Account',
                    'Are you sure? This will permanently delete your account and all your data. This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const uid = user?.id;
                            if (!uid) return;
                            await supabase.from('missions').delete().eq('user_id', uid);
                            await supabase.from('sos_completions').delete().eq('user_id', uid);
                            await supabase.from('creator_universe').delete().eq('user_id', uid);
                            await supabase.from('analysis_entries').delete().eq('user_id', uid);
                            await supabase.from('schedule').delete().eq('user_id', uid);
                            await supabase.from('story_finder').delete().eq('user_id', uid);
                            await supabase.from('content_tips_progress').delete().eq('user_id', uid);
                            await supabase.from('batching_scripts').delete().eq('user_id', uid);
                            await supabase.from('profiles').delete().eq('id', uid);
                            setShowMenu(false);
                            await logout();
                            router.replace('/');
                          } catch (error) {
                            Alert.alert('Error', 'Failed to delete account. Please try again.');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
                <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={async () => {
                  playClickSound();
                  setShowMenu(false);
                  await logout();
                  router.replace('/');
                }}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeMenuButton}
                onPress={() => {
                  playClickSound();
                  setShowMenu(false);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Assets Menu Modal */}
        <Modal
          visible={showAssetsMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAssetsMenu(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.assetsMenuContent}>
              <Text style={styles.modalTitle}>Assets</Text>
              
              <TouchableOpacity
                style={styles.assetsMenuItem}
                onPress={() => {
                  playClickSound();
                  setShowAssetsMenu(false);
                  router.push('/batching');
                }}
              >
                <Ionicons name="layers-outline" size={24} color="#FFD700" />
                <Text style={styles.assetsMenuItemText}>Batching</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.assetsMenuItem}
                onPress={() => {
                  playClickSound();
                  setShowAssetsMenu(false);
                  router.push('/analysis');
                }}
              >
                <Ionicons name="analytics-outline" size={24} color="#FFD700" />
                <Text style={styles.assetsMenuItemText}>Analysis</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.assetsMenuItem}
                onPress={() => {
                  playClickSound();
                  setShowAssetsMenu(false);
                  router.push('/schedule');
                }}
              >
                <Ionicons name="calendar-outline" size={24} color="#FFD700" />
                <Text style={styles.assetsMenuItemText}>Schedule</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.assetsMenuItem}
                onPress={() => {
                  playClickSound();
                  setShowAssetsMenu(false);
                  router.push('/story-finder');
                }}
              >
                <Ionicons name="book-outline" size={24} color="#FFD700" />
                <Text style={styles.assetsMenuItemText}>Story Finder</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.assetsMenuItem}
                onPress={() => {
                  playClickSound();
                  setShowAssetsMenu(false);
                  router.push('/auto-script-generator');
                }}
              >
                <Ionicons name="document-text-outline" size={24} color="#FFD700" />
                <Text style={styles.assetsMenuItemText}>Auto-Script Generator</Text>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  playClickSound();
                  setShowAssetsMenu(false);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuButton: {
    padding: 8,
  },
  streakContainer: {
    alignItems: 'flex-end',
  },
  assetsButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  assetsButtonText: {
    color: '#0a0e27',
    fontSize: 14,
    fontWeight: '600',
  },
  streakText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
  },
  roadmapScroll: {
    flex: 1,
  },
  roadmapContent: {
    paddingHorizontal: 20,
    paddingBottom: 200,
  },
  roadmapContainer: {
    position: 'relative',
    width: '100%',
  },
  stepCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  planetImage: {
    width: 100,
    height: 100,
    borderRadius: 40,
  },
  planetImageShadowed: {
    opacity: 0.4,
  },
  stepShadowed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  stepCompleted: {},
  stepCurrent: {
    shadowColor: '#fbbf24',
    shadowOpacity: 0.6,
  },
  stepText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9ca3af',
  },
  stepTextCurrent: {
    color: '#fbbf24',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButton: {
    alignItems: 'center',
    padding: 10,
  },
  navText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  sosButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    marginTop: -40,
  },
  sosText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  assetsMenuContent: {
    backgroundColor: 'rgba(20, 20, 40, 0.95)',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  assetsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    gap: 16,
  },
  assetsMenuItemText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(20, 20, 40, 0.95)',
    borderRadius: 24,
    padding: 32,
    width: '80%',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 24,
    textAlign: 'center',
  },
  missionModalContent: {
    backgroundColor: 'rgba(20, 25, 45, 0.98)',
    borderRadius: 24,
    padding: 28,
    width: '88%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  missionModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 1,
  },
  missionStatus: {
    fontSize: 12,
    color: 'rgba(147, 197, 253, 0.8)',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  missionStatusActive: {
    color: '#93C5FD',
    fontWeight: '600',
  },
  missionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 215, 0, 0.5)',
  },
  missionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  missionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  missionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  missionCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
    marginBottom: 16,
  },
  missionProgressRow: {
    marginBottom: 12,
  },
  missionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  missionProgressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  missionProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  missionProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  missionProgressText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    minWidth: 28,
  },
  postNowButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  postNowButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a0e27',
    letterSpacing: 0.5,
  },
  dismissMissionButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissMissionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginRight: 16,
  },
  checkboxText: {
    color: '#fff',
    fontSize: 18,
    flex: 1,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    backgroundColor: '#0a0e27',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 2,
    borderColor: '#FFD700',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 24,
  },
  userInfo: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#999',
    fontSize: 14,
  },
  homeMenuButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  homeMenuButtonText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteAccountButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  deleteAccountButtonText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeMenuButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
});