import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { UniverseBackground } from '../../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playClickSound } from '../../utils/soundEffects';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAssetsMenu, setShowAssetsMenu] = useState(false);

  useEffect(() => {
    checkTodayMission();
  }, []);

  const checkTodayMission = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/mission/today`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await response.json();
      setMissionCompleted(data.completed);
    } catch (error) {
      console.error('Error checking mission:', error);
    }
  };

  const handlePlanetPress = (planetIndex: number) => {
    playClickSound();
    if (user && planetIndex === user.current_planet && !missionCompleted) {
      setShowMissionModal(true);
    }
  };

  const handleMissionComplete = async () => {
    playClickSound();
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${BACKEND_URL}/api/mission/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ date: today }),
      });

      if (response.ok) {
        setMissionCompleted(true);
        setShowMissionModal(false);
        await refreshUser();
      }
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
              <Text style={styles.coinsText}>⭐ {user?.coins || 0} coins</Text>
            </View>
          </View>

          {/* Roadmap Section */}
          <ScrollView
            style={styles.roadmapScroll}
            contentContainerStyle={styles.roadmapContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Your Journey</Text>

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
                  ]}
                  onPress={() => handlePlanetPress(step.id)}
                  disabled={!step.current || missionCompleted}
                >
                  <Image
                    source={PLANETS[step.id % PLANETS.length]}
                    style={styles.planetImage}
                    resizeMode="cover"
                  />
                  {step.completed && <Text style={styles.checkmark}>✓</Text>}
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
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Today's Mission</Text>
              
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={handleMissionComplete}
              >
                <View style={styles.checkbox} />
                <Text style={styles.checkboxText}>Post your content</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  playClickSound();
                  setShowMissionModal(false);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
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
                onPress={() => {
                  playClickSound();
                  setShowMenu(false);
                }}
              >
                <Ionicons name="home-outline" size={24} color="#FFD700" />
                <Text style={styles.homeMenuButtonText}>Home</Text>
              </TouchableOpacity>

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
                style={styles.logoutButton}
                onPress={() => {
                  playClickSound();
                  logout();
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
  coinsText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '600',
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
  checkmark: {
    position: 'absolute',
    fontSize: 32,
    color: '#4ade80',
    fontWeight: '700',
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