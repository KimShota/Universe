import { useEffect } from 'react';
import { Audio } from 'expo-av';

export function BackgroundAudio() {
  useEffect(() => {
    let sound: Audio.Sound | null = null;

    const playAudio = async () => {
      try {
        // オーディオモードを設定（他のオーディオと混在可能に）
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        // オーディオを読み込む
        const { sound: soundObject } = await Audio.Sound.createAsync(
          require('../Media/universe_audio.mp3'),
          {
            shouldPlay: true,
            isLooping: true,
            volume: 0.5, // 音量を50%に設定（必要に応じて調整）
          }
        );

        sound = soundObject;
      } catch (error) {
        console.error('Error playing background audio:', error);
      }
    };

    playAudio();

    // クリーンアップ関数
    return () => {
      if (sound) {
        sound.unloadAsync().catch((error) => {
          console.error('Error unloading audio:', error);
        });
      }
    };
  }, []);

  return null; // このコンポーネントは何もレンダリングしない
}

