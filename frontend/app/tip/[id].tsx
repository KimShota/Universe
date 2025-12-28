import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UniverseBackground } from '../../components/UniverseBackground';
import { CONTENT_TIPS } from '../../constants/content';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function TipDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const tip = CONTENT_TIPS.find((t) => t.id === id);

  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  if (!tip) {
    return (
      <UniverseBackground>
        <SafeAreaView style={styles.container}>
          <Text style={styles.errorText}>Tip not found</Text>
        </SafeAreaView>
      </UniverseBackground>
    );
  }

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    const isCorrect = tip.quiz[currentQuestion].correct === index;
    if (isCorrect) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestion < tip.quiz.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setQuizComplete(true);
      }
    }, 1000);
  };

  const handleQuizComplete = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      await fetch(`${BACKEND_URL}/api/content-tips/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          tip_id: tip.id,
          score,
        }),
      });
      await refreshUser();
      setShowQuiz(false);
      setQuizComplete(false);
      setCurrentQuestion(0);
      setScore(0);
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  return (
    <UniverseBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.starCharacter}>⭐</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>{tip.title}</Text>
          
          <View style={styles.contentBox}>
            <Text style={styles.contentText}>{tip.content}</Text>
          </View>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => setShowQuiz(true)}
          >
            <Text style={styles.testButtonText}>Test Your Knowledge</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Quiz Modal */}
        <Modal
          visible={showQuiz}
          transparent
          animationType="slide"
          onRequestClose={() => setShowQuiz(false)}
        >
          <View style={styles.quizOverlay}>
            <View style={styles.quizContent}>
              {!quizComplete ? (
                <>
                  <Text style={styles.quizTitle}>
                    Question {currentQuestion + 1} of {tip.quiz.length}
                  </Text>
                  <Text style={styles.questionText}>
                    {tip.quiz[currentQuestion].question}
                  </Text>
                  <View style={styles.optionsContainer}>
                    {tip.quiz[currentQuestion].options.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          selectedAnswer === index &&
                            (tip.quiz[currentQuestion].correct === index
                              ? styles.optionCorrect
                              : styles.optionWrong),
                        ]}
                        onPress={() => handleAnswerSelect(index)}
                        disabled={selectedAnswer !== null}
                      >
                        <Text style={styles.optionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.quizCompleteTitle}>Quiz Complete!</Text>
                  <Text style={styles.scoreText}>
                    You scored {score} out of {tip.quiz.length}
                  </Text>
                  <Text style={styles.coinsEarned}>You earned 10 coins! 🪙</Text>
                  <TouchableOpacity
                    style={styles.closeQuizButton}
                    onPress={handleQuizComplete}
                  >
                    <Text style={styles.closeQuizButtonText}>Finish</Text>
                  </TouchableOpacity>
                </>
              )}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 24,
    textAlign: 'center',
  },
  contentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  contentText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  testButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e27',
  },
  quizOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  quizContent: {
    backgroundColor: '#0a0e27',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  questionText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  optionCorrect: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderColor: '#00ff00',
  },
  optionWrong: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderColor: '#ff0000',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  quizCompleteTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreText: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  coinsEarned: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  closeQuizButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  closeQuizButtonText: {
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
});