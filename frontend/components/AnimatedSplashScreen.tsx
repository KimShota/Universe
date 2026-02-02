import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { UniverseBackground } from './UniverseBackground';

const LOGO = require('../Media/splash-polar.png');

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

const DURATION_LOGO = 700;
const DURATION_TITLE = 500;
const DELAY_TITLE = 300;
const TOTAL_VISIBLE_MS = 2200;

export function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);

  useEffect(() => {
    // Replace native splash with our animated one as soon as we mount
    SplashScreen.hideAsync();

    logoScale.value = withTiming(1, {
      duration: DURATION_LOGO,
      easing: Easing.out(Easing.cubic),
    });
    logoOpacity.value = withTiming(1, { duration: DURATION_LOGO * 0.8 });
    titleOpacity.value = withDelay(
      DELAY_TITLE,
      withTiming(1, { duration: DURATION_TITLE })
    );

    const id = setTimeout(() => {
      onFinish();
    }, TOTAL_VISIBLE_MS);

    return () => clearTimeout(id);
  }, [onFinish]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  return (
    <UniverseBackground>
      <View style={styles.container}>
        <Animated.View style={[styles.logoWrap, logoAnimatedStyle]}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>
        <Animated.Text style={[styles.title, titleAnimatedStyle]}>
          Universe
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, titleAnimatedStyle]}>
          Your Content Creation Journey
        </Animated.Text>
      </View>
    </UniverseBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    marginBottom: 24,
  },
  logo: {
    width: 180,
    height: 180,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
  },
});
