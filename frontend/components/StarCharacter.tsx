import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

const SIZE = 120;
const CX = SIZE / 2;
const CY = SIZE / 2;
const STAR_R = 50;

type Props = {
  isHappy: boolean;
  size?: number;
  style?: object;
};

/**
 * Renders a plump, golden star character with either a sad or happy expression.
 * Sad: downturned mouth, watery eyes, teardrops.
 * Happy: smile, curved eyebrows, rosy cheeks, sparkling eyes.
 */
export function StarCharacter({ isHappy, size = 148, style }: Props) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="xMidYMid meet">
        <G>
          {/* Star body — plump circle (golden yellow with soft glow) */}
          <Circle
            cx={CX}
            cy={CY}
            r={STAR_R}
            fill="#FFD700"
            stroke="rgba(255,200,80,0.5)"
            strokeWidth={2}
          />
          <Circle cx={CX} cy={CY} r={STAR_R - 2} fill="#FFD700" />

          {isHappy ? (
            /* ——— Happy face ——— */
            <>
              {/* Eyebrows */}
              <Path
                d="M 38 42 Q 48 38, 58 42"
                stroke="#2a1f1a"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M 62 42 Q 72 38, 82 42"
                stroke="#2a1f1a"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
              {/* Eyes */}
              <Circle cx={48} cy={50} r={6} fill="#2a1f1a" />
              <Circle cx={72} cy={50} r={6} fill="#2a1f1a" />
              <Circle cx={50} cy={48} r={2} fill="#fff" />
              <Circle cx={74} cy={48} r={2} fill="#fff" />
              {/* Smile */}
              <Path
                d="M 44 64 Q 60 76, 76 64"
                stroke="#2a1f1a"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
              {/* Rosy cheeks */}
              <Circle cx={32} cy={58} r={6} fill="#F4A6A6" fillOpacity={0.7} />
              <Circle cx={88} cy={58} r={6} fill="#F4A6A6" fillOpacity={0.7} />
            </>
          ) : (
            /* ——— Sad face ——— */
            <>
              {/* Sad eyes */}
              <Circle cx={48} cy={50} r={6} fill="#2a1f1a" />
              <Circle cx={72} cy={50} r={6} fill="#2a1f1a" />
              <Circle cx={50} cy={48} r={1.5} fill="rgba(255,255,255,0.9)" />
              <Circle cx={74} cy={48} r={1.5} fill="rgba(255,255,255,0.9)" />
              {/* Downturned mouth */}
              <Path
                d="M 44 68 Q 60 78, 76 68"
                stroke="#2a1f1a"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
              {/* Teardrops (below outer eye corners) */}
              <Path
                d="M 42 56 L 40 66 Q 42 68.5, 44 66 Z"
                fill="#A8D8F0"
                stroke="rgba(168,216,240,0.5)"
                strokeWidth={0.8}
              />
              <Path
                d="M 78 56 L 76 66 Q 78 68.5, 80 66 Z"
                fill="#A8D8F0"
                stroke="rgba(168,216,240,0.5)"
                strokeWidth={0.8}
              />
            </>
          )}
        </G>
      </Svg>
    </View>
  );
}
