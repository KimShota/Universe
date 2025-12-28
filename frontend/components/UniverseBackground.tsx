import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

// Generate random stars
const generateStars = (count: number) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 3000,
    });
  }
  return stars;
};

const STARS = generateStars(100);

export const UniverseBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Base universe gradient */}
      <View style={styles.universe} />
      
      {/* Stars layer */}
      <View style={styles.starsContainer}>
        {STARS.map((star, index) => (
          <Star key={index} star={star} />
        ))}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const Star: React.FC<{ star: any }> = ({ star }) => {
  const opacityAnim = useRef(new Animated.Value(star.opacity)).current;

  useEffect(() => {
    const startTwinkling = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.2,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: star.opacity,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const timer = setTimeout(startTwinkling, star.delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          opacity: opacityAnim,
        },
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