import { useCallback } from 'react';
import { playClickSound } from '../utils/soundEffects';

/**
 * ボタンクリック時に音を再生するカスタムフック
 * @param onPress 元のonPressハンドラー
 * @returns 音を再生してから元のハンドラーを実行する新しいonPressハンドラー
 */
export function useButtonPress<T extends (...args: any[]) => any>(
  onPress?: T
): T {
  return useCallback(
    ((...args: Parameters<T>) => {
      playClickSound();
      onPress?.(...args);
    }) as T,
    [onPress]
  );
}

