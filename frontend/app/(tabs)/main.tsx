import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { UniverseBackground } from '../../components/UniverseBackground';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function MainScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
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
    if (planetIndex === user.current_planet && !missionCompleted) {
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

  const renderPlanets = () => {
    const planets = [];
    const currentPlanet = user?.current_planet || 0;
    const screenWidth = width - 40; // padding on sides

    for (let i = 0; i < 10; i++) {
      const isPast = i < currentPlanet;
      const isCurrent = i === currentPlanet;
      const isFuture = i > currentPlanet;
      
      // Calculate position for zig-zag pattern
      // Even numbers go left, odd numbers go right
      const isLeft = i % 2 === 0;
      const xPosition = isLeft ? 20 : screenWidth - 60; // 60 is planet size + padding
      
      planets.push(
        <View key={i} style={[styles.planetWrapper, { marginBottom: 60 }]}>
          {/* Connecting line to next planet */}
          {i < 9 && (
            <View style={[
              styles.pathLine,
              isLeft ? styles.pathLineRightDown : styles.pathLineLeftDown,
            ]} />
          )}
          
          {/* Planet container */}
          <View style={[styles.planetContainer, { marginLeft: isLeft ? 0 : 'auto' }]}>
            <TouchableOpacity
              style={[
                styles.planet,
                isPast && styles.planetPast,
                isCurrent && styles.planetCurrent,
                isFuture && styles.planetFuture,
              ]}
              onPress={() => handlePlanetPress(i)}
              disabled={!isCurrent || missionCompleted}
            >
              <Text style={styles.planetText}>{i + 1}</Text>
            </TouchableOpacity>
            
            {/* Star character on current planet */}
            {isCurrent && (
              <View style={[
                styles.starCharacterOnPlanet,
                isLeft ? styles.starLeft : styles.starRight
              ]}>
                <Text style={styles.starEmoji}>⭐</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return planets;
  };

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
          >
            <Ionicons name="menu" size={32} color="#FFD700" />
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={20} color="#FF6B6B" />
              <Text style={styles.statText}>{user?.streak || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.coinEmoji}>🪙</Text>
              <Text style={styles.statText}>{user?.coins || 0}</Text>
            </View>
          </View>
        </View>

        {/* Planet Roadmap */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.roadmapContainer}
        >
          {renderPlanets()}
        </ScrollView>

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
                style={styles.sosMenuButton}
                onPress={() => {
                  setShowMenu(false);
                  router.push('/sos');
                }}
              >
                <Ionicons name="alert-circle" size={24} color="#ff4444" />
                <Text style={styles.sosMenuButtonText}>SOS</Text>
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
      </SafeAreaView>
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
    paddingVertical: 16,
  },
  menuButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  coinEmoji: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  roadmapContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  planetRowLeft: {
    justifyContent: 'flex-start',
  },
  planetRowRight: {
    justifyContent: 'flex-end',
  },
  connectionLine: {
    position: 'absolute',
    width: 2,
    height: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
  },
  connectionLineRight: {
    right: 40,
    top: 80,
    transform: [{ rotate: '45deg' }],
  },
  connectionLineLeft: {
    left: 40,
    top: 80,
    transform: [{ rotate: '-45deg' }],
  },
  planet: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  planetPast: {
    backgroundColor: 'rgba(100, 200, 100, 0.3)',
    borderColor: '#64C864',
  },
  planetCurrent: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: '#FFD700',
  },
  planetFuture: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    borderColor: '#666',
  },
  planetText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  starCharacterOnPlanet: {
    position: 'absolute',
  },
  starCharacterLeft: {
    left: -50,
  },
  starCharacterRight: {
    right: -50,
  },
  starEmoji: {
    fontSize: 40,
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
  sosMenuButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  sosMenuButtonText: {
    color: '#ff4444',
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