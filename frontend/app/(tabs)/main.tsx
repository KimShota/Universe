import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { UniverseBackground } from '../../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Svg, { Line, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function MainScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
    if (user && planetIndex === user.current_planet && !missionCompleted) {
      setShowMissionModal(true);
    }
  };

  const handleMissionComplete = async () => {
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

  const totalSteps = 5;
  const currentStep = user?.current_planet || 0;

  const roadmapSteps = Array.from({ length: totalSteps }, (_, i) => {
    const isLeft = i % 2 === 0;
    const yPosition = 80 + i * 100;
    const xPosition = isLeft ? width * 0.3 : width * 0.7;

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
              onPress={() => setShowMenu(true)}
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
                    return (
                      <Line
                        key={`line-${step.id}`}
                        x1={step.x}
                        y1={step.y}
                        x2={nextStep.x}
                        y2={nextStep.y}
                        stroke={step.completed ? "#4ade80" : "#374151"}
                        strokeWidth="2"
                        opacity={0.6}
                      />
                    );
                  }
                  return null;
                })}

                {roadmapSteps.map((step) => (
                  <Circle
                    key={`circle-${step.id}`}
                    cx={step.x}
                    cy={step.y}
                    r="4"
                    fill={step.completed ? "#4ade80" : step.current ? "#fbbf24" : "#6b7280"}
                    opacity={0.8}
                  />
                ))}
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
                  <Text style={[
                    styles.stepText,
                    step.current && styles.stepTextCurrent,
                  ]}>
                    {step.id + 1}
                  </Text>
                  {step.completed && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Navigation */}
          <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/(tabs)/content-tips')}
            >
              <Ionicons name="bulb-outline" color="#ffffff" size={24} />
              <Text style={styles.navText}>Content Tips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosButton}
              onPress={() => router.push('/sos')}
            >
              <Ionicons name="alert-circle" color="#ffffff" size={40} />
              <Text style={styles.sosText}>SOS!</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/(tabs)/creator-universe')}
            >
              <Ionicons name="telescope-outline" color="#ffffff" size={24} />
              <Text style={styles.navText}>Creator Universe</Text>
            </TouchableOpacity>
          </View>

          {/* Batching Button */}
          <TouchableOpacity
            style={[styles.batchingButton, { bottom: insets.bottom + 120 }]}
            onPress={() => router.push('/batching')}
          >
            <Ionicons name="layers-outline" color="#0a0e27" size={20} />
            <Text style={styles.batchingText}>Batching</Text>
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
                onPress={() => setShowMissionModal(false)}
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
                  setShowMenu(false);
                }}
              >
                <Ionicons name="home-outline" size={24} color="#FFD700" />
                <Text style={styles.homeMenuButtonText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={logout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeMenuButton}
                onPress={() => setShowMenu(false)}
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1f2937',
    borderWidth: 3,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stepCompleted: {
    backgroundColor: '#065f46',
    borderColor: '#4ade80',
  },
  stepCurrent: {
    backgroundColor: '#78350f',
    borderColor: '#fbbf24',
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
  batchingButton: {
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
  },
  batchingText: {
    color: '#0a0e27',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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