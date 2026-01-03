import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, RadialGradient, Defs, Stop, Ellipse } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleDelay: number;
  color: string; // 星の色を追加
  glowColor: string; // グロー色を追加
}

interface StarLayer {
  stars: Star[];
  speed: number;
}


interface UniverseBackgroundProps {
  starCount?: number;
  parallaxOffset?: number;
  children?: React.ReactNode;
}

export const UniverseBackground: React.FC<UniverseBackgroundProps> = ({ 
  starCount = 300, // パフォーマンス最適化: 600→300
  parallaxOffset = 0,
  children
}) => {

  // 星のレイヤーを生成（パフォーマンス最適化: 4層→3層）
  const starLayers = useMemo<StarLayer[]>(() => {
    const layers = [
      { count: Math.floor(starCount * 0.6), speed: 0.1, sizeRange: [0.3, 1.2] }, // 遠くの小さな星
      { count: Math.floor(starCount * 0.3), speed: 0.3, sizeRange: [0.8, 2.2] }, // 中距離の星
      { count: Math.floor(starCount * 0.1), speed: 0.5, sizeRange: [1.5, 3.5] }, // 近くの明るい星
    ];

    // 星の色のパレット（リアルな星の色）
    const starColors = [
      { color: 'hsl(210, 40%, 98%)', glow: 'hsl(210, 40%, 95%)' }, // 白
      { color: 'hsl(200, 90%, 85%)', glow: 'hsl(200, 90%, 70%)' }, // 青白
      { color: 'hsl(45, 80%, 90%)', glow: 'hsl(45, 80%, 75%)' }, // 黄色
      { color: 'hsl(15, 70%, 85%)', glow: 'hsl(15, 70%, 70%)' }, // オレンジ
      { color: 'hsl(220, 60%, 88%)', glow: 'hsl(220, 60%, 75%)' }, // 青
    ];

    return layers.map((layer) => {
      const stars: Star[] = [];
      for (let i = 0; i < layer.count; i++) {
        const size = Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]) + layer.sizeRange[0];
        const colorIndex = Math.floor(Math.random() * starColors.length);
        const starColorSet = starColors[colorIndex];
        
        stars.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size,
          opacity: Math.random() * 0.4 + 0.4, // より明るい星
          twinkleSpeed: Math.random() * 6 + 4, // パフォーマンス最適化: より遅いアニメーション
          twinkleDelay: Math.random() * 8, // パフォーマンス最適化: より長い遅延
          color: starColorSet.color,
          glowColor: starColorSet.glow,
        });
      }
      return { stars, speed: layer.speed };
    });
  }, [starCount]);

  // 流れ星アニメーションを削除（パフォーマンス最適化）

  // より深みのある背景グラデーション（スクリーンショットに合わせて調整）
  const backgroundColors = [
    'hsl(240, 50%, 3%)',    // 深い紫
    'hsl(250, 45%, 6%)',    // 紫がかった青
    'hsl(230, 55%, 8%)',    // 青
    'hsl(200, 50%, 10%)',   // ティールブルー（スクリーンショットの下部）
    'hsl(240, 45%, 5%)',    // 深い青に戻る
  ] as [string, string, string, string, string];

  return (
    <View style={styles.container} pointerEvents="box-none">
      <LinearGradient
        colors={backgroundColors}
        locations={[0, 0.3, 0.6, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />

      <NebulaLayer />
      
      {starLayers.map((layer, layerIndex) => (
        <View
          key={`layer-${layerIndex}`}
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [{ translateX: -parallaxOffset * layer.speed }],
            },
          ]}
        >
          {layer.stars.map((star, index) => (
            <TwinklingStar
              key={`star-${layerIndex}-${index}`}
              star={star}
            />
          ))}
        </View>
      ))}

      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

// キラキラする星（より滑らかでリアルなアニメーション）
const TwinklingStar: React.FC<{ star: Star }> = ({ star }) => {
  const opacity = useRef(new Animated.Value(star.opacity)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // より滑らかなキラキラアニメーション
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: Math.min(1, star.opacity + 0.3),
            duration: (star.twinkleSpeed * 1000) / 2,
            delay: star.twinkleDelay * 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.15,
            duration: (star.twinkleSpeed * 1000) / 2,
            delay: star.twinkleDelay * 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: star.opacity,
            duration: (star.twinkleSpeed * 1000) / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: (star.twinkleSpeed * 1000) / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    twinkle.start();
    return () => twinkle.stop();
  }, []);

  // パフォーマンス最適化: shadowは大きな星のみに適用
  const hasShadow = star.size > 2.5;
  
  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          backgroundColor: star.color,
          ...(hasShadow && {
            shadowColor: star.glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: star.size * 2,
          }),
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

// 星雲レイヤー（よりリアルな色と動き）
const NebulaLayer: React.FC = () => {
  const slowDrift = useRef(new Animated.Value(0)).current;
  const mediumDrift = useRef(new Animated.Value(0)).current;
  const fastDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (animValue: Animated.Value, duration: number, keyframes: Array<{ progress: number; translateX: string; translateY: string; rotate: string }>) => {
      const animations: Animated.CompositeAnimation[] = [];
      
      for (let i = 1; i < keyframes.length; i++) {
        const prev = keyframes[i - 1];
        const curr = keyframes[i];
        const segmentDuration = (curr.progress - prev.progress) * duration;
        
        animations.push(
          Animated.timing(animValue, {
            toValue: curr.progress,
            duration: segmentDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          })
        );
      }

      return Animated.loop(Animated.sequence(animations));
    };

    // パフォーマンス最適化: より遅い動き（durationを長く）
    createLoop(slowDrift, 120000, [
      { progress: 0, translateX: '0%', translateY: '0%', rotate: '0deg' },
      { progress: 0.33, translateX: '2%', translateY: '1.5%', rotate: '0.8deg' },
      { progress: 0.66, translateX: '-1.5%', translateY: '-0.8%', rotate: '-0.4deg' },
      { progress: 1, translateX: '0%', translateY: '0%', rotate: '0deg' },
    ]).start();

    createLoop(mediumDrift, 90000, [
      { progress: 0, translateX: '0%', translateY: '0%', rotate: '0deg' },
      { progress: 0.25, translateX: '-3%', translateY: '2.5%', rotate: '-0.8deg' },
      { progress: 0.5, translateX: '1.5%', translateY: '-1.5%', rotate: '0.4deg' },
      { progress: 0.75, translateX: '-0.8%', translateY: '3%', rotate: '-0.3deg' },
      { progress: 1, translateX: '0%', translateY: '0%', rotate: '0deg' },
    ]).start();

    createLoop(fastDrift, 60000, [
      { progress: 0, translateX: '0%', translateY: '0%', rotate: '0deg' },
      { progress: 0.2, translateX: '4%', translateY: '-2.5%', rotate: '0deg' },
      { progress: 0.4, translateX: '-2.5%', translateY: '3.5%', rotate: '0deg' },
      { progress: 0.6, translateX: '3.5%', translateY: '1.5%', rotate: '0deg' },
      { progress: 0.8, translateX: '-1.5%', translateY: '-3.5%', rotate: '0deg' },
      { progress: 1, translateX: '0%', translateY: '0%', rotate: '0deg' },
    ]).start();
  }, []);

  return (
    <>
      {/* 美しい紫色の星雲（右側上部） */}
      <Animated.View
        style={[
          styles.nebula,
          styles.nebulaSlow,
          {
            opacity: 0.85, // 美しい不透明度
            transform: [
              {
                translateX: slowDrift.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [0, SCREEN_WIDTH * 0.02, -SCREEN_WIDTH * 0.015, 0],
                }),
              },
              {
                translateY: slowDrift.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [0, SCREEN_HEIGHT * 0.015, -SCREEN_HEIGHT * 0.008, 0],
                }),
              },
              {
                rotate: slowDrift.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: ['0deg', '0.8deg', '-0.4deg', '0deg'],
                }),
              },
            ],
          },
        ]}
      >
        <NebulaGradient
          gradients={[
            { cx: '80%', cy: '25%', rx: '70%', ry: '65%', color: 'hsl(280, 80%, 45%)', opacity: 1.0 }, // 美しい紫色
            { cx: '75%', cy: '35%', rx: '60%', ry: '55%', color: 'hsl(270, 75%, 42%)', opacity: 0.95 },
            { cx: '85%', cy: '20%', rx: '55%', ry: '50%', color: 'hsl(285, 85%, 40%)', opacity: 0.9 },
            { cx: '70%', cy: '30%', rx: '50%', ry: '48%', color: 'hsl(275, 70%, 38%)', opacity: 0.85 },
          ]}
        />
      </Animated.View>

      {/* 美しいスカイブルーの星雲（左下） */}
      <Animated.View
        style={[
          styles.nebula,
          styles.nebulaMedium,
          {
            opacity: 0.8, // 美しい不透明度
            transform: [
              {
                translateX: mediumDrift.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, -SCREEN_WIDTH * 0.03, SCREEN_WIDTH * 0.015, -SCREEN_WIDTH * 0.008, 0],
                }),
              },
              {
                translateY: mediumDrift.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, SCREEN_HEIGHT * 0.025, -SCREEN_HEIGHT * 0.015, SCREEN_HEIGHT * 0.03, 0],
                }),
              },
              {
                rotate: mediumDrift.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: ['0deg', '-0.8deg', '0.4deg', '-0.3deg', '0deg'],
                }),
              },
            ],
          },
        ]}
      >
        <NebulaGradient
          gradients={[
            { cx: '15%', cy: '85%', rx: '65%', ry: '60%', color: 'hsl(200, 85%, 45%)', opacity: 1.0 }, // 美しいスカイブルー
            { cx: '10%', cy: '80%', rx: '55%', ry: '55%', color: 'hsl(195, 80%, 42%)', opacity: 0.95 },
            { cx: '20%', cy: '90%', rx: '50%', ry: '50%', color: 'hsl(205, 75%, 40%)', opacity: 0.9 },
            { cx: '12%', cy: '82%', rx: '48%', ry: '48%', color: 'hsl(200, 70%, 38%)', opacity: 0.85 },
          ]}
        />
      </Animated.View>

      {/* ベース星雲 - 紫色とスカイブルーの調和 */}
      <View style={[styles.nebula, styles.nebulaBase, { opacity: 0.5 }]}>
        <NebulaGradient
          gradients={[
            { cx: '50%', cy: '50%', rx: '100%', ry: '80%', color: 'hsl(250, 60%, 25%)', opacity: 0.6 },
            { cx: '70%', cy: '40%', rx: '60%', ry: '50%', color: 'hsl(240, 55%, 23%)', opacity: 0.55 },
          ]}
        />
      </View>
    </>
  );
};

interface NebulaGradientProps {
  gradients: Array<{
    cx: string;
    cy: string;
    rx: string;
    ry: string;
    color: string;
    opacity: number;
  }>;
}

// SVGでradial-gradientを再現（より滑らかなグラデーション）
const NebulaGradient: React.FC<NebulaGradientProps> = ({ gradients }) => {
  const uniqueId = useRef(Math.random().toString(36).substring(7)).current;
  
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        {gradients.map((grad, index) => (
          <RadialGradient
            key={`${uniqueId}-${index}`}
            id={`nebulaGrad-${uniqueId}-${index}`}
            cx={grad.cx}
            cy={grad.cy}
            rx={grad.rx}
            ry={grad.ry}
          >
            <Stop offset="0%" stopColor={grad.color} stopOpacity={grad.opacity} />
            <Stop offset="15%" stopColor={grad.color} stopOpacity={grad.opacity * 0.9} />
            <Stop offset="35%" stopColor={grad.color} stopOpacity={grad.opacity * 0.7} />
            <Stop offset="60%" stopColor={grad.color} stopOpacity={grad.opacity * 0.4} />
            <Stop offset="85%" stopColor={grad.color} stopOpacity={grad.opacity * 0.1} />
            <Stop offset="100%" stopColor={grad.color} stopOpacity="0" />
          </RadialGradient>
        ))}
      </Defs>
      {gradients.map((grad, index) => (
        <Ellipse
          key={`${uniqueId}-ellipse-${index}`}
          cx={grad.cx}
          cy={grad.cy}
          rx={grad.rx}
          ry={grad.ry}
          fill={`url(#nebulaGrad-${uniqueId}-${index})`}
        />
      ))}
    </Svg>
  );
};


const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  star: {
    position: 'absolute',
  },
  nebula: {
    position: 'absolute',
    overflow: 'hidden',
  },
  nebulaSlow: {
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 1.5,
    top: -SCREEN_HEIGHT * 0.25,
    left: -SCREEN_WIDTH * 0.25,
  },
  nebulaMedium: {
    width: SCREEN_WIDTH * 1.3,
    height: SCREEN_HEIGHT * 1.3,
    top: -SCREEN_HEIGHT * 0.15,
    left: -SCREEN_WIDTH * 0.15,
  },
  nebulaFast: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_HEIGHT * 1.2,
    top: -SCREEN_HEIGHT * 0.1,
    left: -SCREEN_WIDTH * 0.1,
  },
  nebulaBase: {
    ...StyleSheet.absoluteFillObject,
  },
});
