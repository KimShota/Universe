import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'ai_limit:';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function storageKey(feature: string, userId: string): string {
  return `${PREFIX}${feature}:${userId}`;
}

export async function canUseAiFeature(feature: string, userId: string): Promise<boolean> {
  if (!userId) return true;
  try {
    const key = storageKey(feature, userId);
    const lastUsed = await AsyncStorage.getItem(key);
    return lastUsed !== today();
  } catch {
    return true;
  }
}

export async function recordAiFeatureUsed(feature: string, userId: string): Promise<void> {
  if (!userId) return;
  try {
    const key = storageKey(feature, userId);
    await AsyncStorage.setItem(key, today());
  } catch {
    // ignore
  }
}

export const AI_FEATURE_KEYS = {
  auto_script: 'auto_script',
  idea_generator: 'idea_generator',
  find_patterns: 'find_patterns',
} as const;
