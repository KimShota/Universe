import { Audio } from 'expo-av';

let clickSound: Audio.Sound | null = null;
let isLoaded = false;

export async function playClickSound() {
  try {
    // 初回のみオーディオを読み込む
    if (!isLoaded) {
      const { sound } = await Audio.Sound.createAsync(
        require('../Media/button-click.mp3'),
        { shouldPlay: false }
      );
      clickSound = sound;
      isLoaded = true;
    }

    // 音を再生
    if (clickSound) {
      await clickSound.replayAsync();
    }
  } catch (error) {
    console.error('Error playing click sound:', error);
  }
}

// クリーンアップ関数（必要に応じて）
export async function unloadClickSound() {
  if (clickSound) {
    await clickSound.unloadAsync();
    clickSound = null;
    isLoaded = false;
  }
}

