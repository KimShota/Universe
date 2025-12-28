import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Generate random stars
const generateStars = (count: number) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
    });
  }
  return stars;
};

const STARS = generateStars(150);

export const UniverseBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Base universe gradient */}
      <View style={styles.universe} />
      
      {/* Stars layer */}
      <View style={styles.starsContainer}>
        {STARS.map((star, index) => (
          <Star key={index} star={star} index={index} />
        ))}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const Star: React.FC<{ star: any; index: number }> = ({ star, index }) => {
  const opacity = useSharedValue(star.opacity);

  useEffect(() => {
    // Random twinkling effect
    const delay = Math.random() * 3000;
    setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 2000 }),
          withTiming(star.opacity, { duration: 2000 })
        ),
        -1,
        true
      );
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.radius * 2,
          height: star.radius * 2,
          borderRadius: star.radius,
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  universe: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0e27',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
});