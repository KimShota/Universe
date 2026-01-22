import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { UniverseBackground } from '../components/UniverseBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { playClickSound } from '../utils/soundEffects';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COLUMNS = ['Idea', 'Format'];

interface ScheduleData {
  [day: string]: {
    idea: string;
    format: string;
  };
}

export default function ScheduleScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleData>({
    Monday: { idea: '', format: '' },
    Tuesday: { idea: '', format: '' },
    Wednesday: { idea: '', format: '' },
    Thursday: { idea: '', format: '' },
    Friday: { idea: '', format: '' },
    Saturday: { idea: '', format: '' },
    Sunday: { idea: '', format: '' },
  });

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await fetch(`${BACKEND_URL}/api/schedule`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.schedule) {
          // Convert old format to new format if needed
          const scheduleData = data.schedule;
          if (scheduleData.idea && scheduleData.format) {
            // Old format: { idea: { Monday: '', ... }, format: { Monday: '', ... } }
            const newSchedule: ScheduleData = {
              Monday: { idea: scheduleData.idea.Monday || '', format: scheduleData.format.Monday || '' },
              Tuesday: { idea: scheduleData.idea.Tuesday || '', format: scheduleData.format.Tuesday || '' },
              Wednesday: { idea: scheduleData.idea.Wednesday || '', format: scheduleData.format.Wednesday || '' },
              Thursday: { idea: scheduleData.idea.Thursday || '', format: scheduleData.format.Thursday || '' },
              Friday: { idea: scheduleData.idea.Friday || '', format: scheduleData.format.Friday || '' },
              Saturday: { idea: scheduleData.idea.Saturday || '', format: scheduleData.format.Saturday || '' },
              Sunday: { idea: scheduleData.idea.Sunday || '', format: scheduleData.format.Sunday || '' },
            };
            setSchedule(newSchedule);
          } else {
            // New format: { Monday: { idea: '', format: '' }, ... }
            setSchedule(scheduleData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const saveSchedule = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      await fetch(`${BACKEND_URL}/api/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ schedule }),
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const updateCell = (day: string, column: string, value: string) => {
    const newSchedule = { ...schedule };
    newSchedule[day] = {
      ...newSchedule[day],
      [column.toLowerCase()]: value,
    };
    setSchedule(newSchedule);
  };

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              playClickSound();
              router.back();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Schedule</Text>
          </View>
        </View>

        <ScrollView
          style={styles.tableScroll}
          contentContainerStyle={styles.tableContent}
        >
          <View style={styles.table}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={[styles.headerCell, styles.rowHeaderCell]}>
                <Text style={styles.headerText}></Text>
              </View>
              {COLUMNS.map((column) => (
                <View key={column} style={styles.headerCell}>
                  <Text style={styles.headerText}>{column}</Text>
                </View>
              ))}
            </View>

            {/* Data Rows */}
            {DAYS.map((day) => (
              <View key={day} style={styles.dataRow}>
                <View style={[styles.dataCell, styles.rowHeaderCell]}>
                  <Text style={styles.rowHeaderText}>{day}</Text>
                </View>
                {COLUMNS.map((column) => (
                  <View key={column} style={styles.dataCell}>
                    <TextInput
                      style={styles.cellInput}
                      value={schedule[day]?.[column.toLowerCase() as 'idea' | 'format'] || ''}
                      onChangeText={(text) => {
                        updateCell(day, column, text);
                      }}
                      onBlur={saveSchedule}
                      placeholder={column === 'Idea' ? 'Enter idea...' : 'Enter format...'}
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      multiline
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  backButton: {
    padding: 8,
    zIndex: 1,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
  },
  tableScroll: {
    flex: 1,
  },
  tableContent: {
    padding: 20,
    paddingBottom: 40,
  },
  table: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(100, 200, 255, 0.3)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCell: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
  },
  rowHeaderCell: {
    width: 120,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rowHeaderText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dataCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
    minHeight: 80,
    justifyContent: 'center',
  },
  cellInput: {
    color: '#ffffff',
    fontSize: 12,
    flex: 1,
    textAlignVertical: 'top',
    padding: 4,
  },
});
