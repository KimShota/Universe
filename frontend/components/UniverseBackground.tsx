import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, RadialGradient, Defs, Stop, Ellipse } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  glowColor: string;
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
  starCount = 200, // パフォーマンス最適化: 300→200（アニメーションなしなので多めに可能）
  parallaxOffset = 0,
  children
}) => {

  // 星のレイヤーを生成（静的表示）
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
          opacity: Math.random() * 0.3 + 0.5, // より明るい星（静的表示）
          color: starColorSet.color,
          glowColor: starColorSet.glow,
        });
      }
      return { stars, speed: layer.speed };
    });
  }, [starCount]);

  // より深みのある背景グラデーション
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

      <StaticNebulaLayer />
      
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
            <StaticStar
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

// 静的星（アニメーションなし、軽量）
const StaticStar: React.FC<{ star: Star }> = ({ star }) => {
  // パフォーマンス最適化: shadowは大きな星のみに適用
  const hasShadow = star.size > 2.5;
  
  return (
    <View
      style={[
        styles.star,
        {
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          backgroundColor: star.color,
          opacity: star.opacity,
          ...(hasShadow && {
            shadowColor: star.glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: star.size * 1.5,
            elevation: 2,
          }),
        },
      ]}
    />
  );
};

// 静的星雲レイヤー（アニメーションなし）
const StaticNebulaLayer: React.FC = () => {
  return (
    <>
      {/* 美しい紫色の星雲（右側上部） */}
      <View
        style={[
          styles.nebula,
          styles.nebulaSlow,
          { opacity: 0.85 },
        ]}
      >
        <NebulaGradient
          gradients={[
            { cx: '80%', cy: '25%', rx: '70%', ry: '65%', color: 'hsl(280, 80%, 45%)', opacity: 1.0 },
            { cx: '75%', cy: '35%', rx: '60%', ry: '55%', color: 'hsl(270, 75%, 42%)', opacity: 0.95 },
            { cx: '85%', cy: '20%', rx: '55%', ry: '50%', color: 'hsl(285, 85%, 40%)', opacity: 0.9 },
            { cx: '70%', cy: '30%', rx: '50%', ry: '48%', color: 'hsl(275, 70%, 38%)', opacity: 0.85 },
          ]}
        />
      </View>

      {/* 美しいスカイブルーの星雲（左下） */}
      <View
        style={[
          styles.nebula,
          styles.nebulaMedium,
          { opacity: 0.8 },
        ]}
      >
        <NebulaGradient
          gradients={[
            { cx: '15%', cy: '85%', rx: '65%', ry: '60%', color: 'hsl(200, 85%, 45%)', opacity: 1.0 },
            { cx: '10%', cy: '80%', rx: '55%', ry: '55%', color: 'hsl(195, 80%, 42%)', opacity: 0.95 },
            { cx: '20%', cy: '90%', rx: '50%', ry: '50%', color: 'hsl(205, 75%, 40%)', opacity: 0.9 },
            { cx: '12%', cy: '82%', rx: '48%', ry: '48%', color: 'hsl(200, 70%, 38%)', opacity: 0.85 },
          ]}
        />
      </View>

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

// SVGでradial-gradientを再現（静的、軽量）
const NebulaGradient: React.FC<NebulaGradientProps> = ({ gradients }) => {
  const uniqueId = React.useMemo(() => Math.random().toString(36).substring(7), []);
  
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
  nebulaBase: {
    ...StyleSheet.absoluteFillObject,
  },
});
