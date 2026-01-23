import React, { createContext, useContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.0.15:8000';
const AUTH_URL = 'https://auth.emergentagent.com';

WebBrowser.maybeCompleteAuthSession();

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  streak: number;
  coins: number;
  current_planet: number;
  last_post_date?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingSession();
    
    // Handle deep links for mobile
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (event: { url: string }) => {
    await processAuthRedirect(event.url);
  };

  const checkBackendHealth = async (retries = 3): Promise<boolean> => {
    if (!BACKEND_URL) {
      return false;
    }

    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒でヘルスチェック
        
        const response = await fetch(`${BACKEND_URL}/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Backend health check:', data);
          return true;
        }
      } catch (error: any) {
        if (i < retries - 1) {
          console.log(`Health check failed, retrying... (${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        } else {
          console.warn('Backend server health check failed:', error.message);
        }
      }
    }
    
    return false;
  };

  const checkExistingSession = async () => {
    try {
      if (!BACKEND_URL) {
        console.error('BACKEND_URL is not set. Please create a .env file with EXPO_PUBLIC_BACKEND_URL');
        setLoading(false);
        return;
      }

      const sessionToken = await AsyncStorage.getItem('session_token');
      
      if (sessionToken) {
        // まずヘルスチェックを実行（軽量なので短いタイムアウト）
        const isHealthy = await checkBackendHealth(2);
        
        if (!isHealthy) {
          console.warn('Backend server is not responding. Clearing session token.');
          await AsyncStorage.removeItem('session_token').catch(() => {});
          setLoading(false);
          return;
        }
        
        // タイムアウトを15秒に設定（3秒から延長）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
            },
            signal: controller.signal
        });
          
          clearTimeout(timeoutId);
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          await AsyncStorage.removeItem('session_token');
        }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          // タイムアウトエラーの処理
          if (fetchError.name === 'AbortError' || 
              fetchError.message === 'Network request timed out' ||
              fetchError.message?.includes('timeout')) {
            console.warn('Request timeout: Backend server may be unreachable at', BACKEND_URL);
            console.warn('Please check:');
            console.warn('1. Backend server is running');
            console.warn('2. Correct IP address in .env file (current network)');
            console.warn('3. Both devices are on the same network');
            console.warn('4. Firewall is not blocking the connection');
            // タイムアウト時はセッショントークンを削除してログイン画面に戻す
            await AsyncStorage.removeItem('session_token').catch(() => {});
          } else if (fetchError.message === 'Network request failed' || fetchError.message?.includes('Failed to fetch')) {
            console.error('Network error: Could not connect to backend server');
            console.error(`Backend URL: ${BACKEND_URL}`);
            console.error('Please check:');
            console.error('1. Backend server is running');
            console.error('2. Correct IP address in .env file');
            console.error('3. Both devices are on the same network');
            await AsyncStorage.removeItem('session_token').catch(() => {});
          } else {
            console.error('Fetch error:', fetchError);
          }
        }
      } else {
        // セッショントークンがない場合は即座にローディングを停止
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // エラーが発生しても必ずローディングを停止
      await AsyncStorage.removeItem('session_token').catch(() => {});
    } finally {
      // 必ずローディングを停止
      setLoading(false);
    }
  };

  const processAuthRedirect = async (url: string) => {
    try {
      // Extract session_id from URL (supports both hash and query)
      let sessionId = null;
      
      if (url.includes('#session_id=')) {
        sessionId = url.split('#session_id=')[1].split('&')[0];
      } else if (url.includes('?session_id=')) {
        sessionId = url.split('?session_id=')[1].split('&')[0];
      }
      
      if (!sessionId) {
        console.warn('No session_id found in URL');
        return;
      }
      
      if (!BACKEND_URL) {
        console.error('BACKEND_URL is not set. Please create a .env file with EXPO_PUBLIC_BACKEND_URL');
        return;
      }
      
      // まずヘルスチェックを実行
      console.log('Checking backend server health...');
      const isHealthy = await checkBackendHealth();
      
      if (!isHealthy) {
        console.error('Backend server is not responding. Please ensure the server is running.');
        console.error(`Expected URL: ${BACKEND_URL}`);
        console.error('To start the server, run: cd backend && uvicorn server:app --host 0.0.0.0 --port 8000');
        return;
      }
      
      console.log('Attempting to connect to:', `${BACKEND_URL}/api/auth/session`);
      
      // Exchange session_id for user data with timeout and retry logic
      const maxRetries = 3;
      let lastError: any = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト
          
          const response = await fetch(`${BACKEND_URL}/api/auth/session?session_id=${sessionId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
        
          if (!response.ok) {
            let errorText = '';
            try {
              errorText = await response.text();
            } catch (e) {
              errorText = 'Could not read error message';
            }
            
            console.error(`Auth API error: ${response.status} - ${errorText}`);
            
            // 500エラーの場合は詳細な情報を表示
            if (response.status === 500) {
              console.error('Server error (500): The backend server encountered an internal error.');
              console.error('Possible causes:');
              console.error('1. MongoDB connection issue');
              console.error('2. Emergent Auth API connection issue');
              console.error('3. Database operation failed');
              console.error('Error details:', errorText);
            }
            
            // エラーが発生した場合でも、ユーザーに通知してログイン画面に戻す
            return;
          }
          
          const data = await response.json();
          await AsyncStorage.setItem('session_token', data.session_token);
          setUser(data.user);
          return; // 成功したら終了
          
        } catch (fetchError: any) {
          lastError = fetchError;
          
          if (fetchError.name === 'AbortError') {
            console.warn(`Request timeout (attempt ${attempt + 1}/${maxRetries})`);
            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機してリトライ
              continue;
            } else {
              console.error('Request timeout: Backend server took too long to respond after retries');
              console.error('Please check:');
              console.error(`1. Backend server is running at ${BACKEND_URL}`);
              console.error('2. Both devices are on the same network');
              console.error('3. Firewall is not blocking the connection');
              console.error('4. Backend server is accessible from this device');
            }
          } else if (fetchError.message === 'Network request failed' || fetchError.message?.includes('Failed to fetch')) {
            console.warn(`Network error (attempt ${attempt + 1}/${maxRetries}):`, fetchError.message);
            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機してリトライ
              continue;
            } else {
              console.error('Network error: Could not connect to backend server after retries');
              console.error(`Backend URL: ${BACKEND_URL}`);
              console.error('Please check:');
              console.error('1. Backend server is running');
              console.error('2. Correct IP address in .env file');
              console.error('3. Both devices are on the same network');
            }
          } else {
            console.error('Error processing auth redirect:', fetchError);
            break; // 予期しないエラーはリトライしない
          }
        }
      }
      
      // すべてのリトライが失敗した場合
      if (lastError) {
        console.error('Failed to process auth redirect after all retries');
      }
      
    } catch (error) {
      console.error('Error processing auth redirect:', error);
      if (error instanceof TypeError && error.message === 'Network request failed') {
        console.error('Network error: Make sure the backend server is running at', BACKEND_URL);
        console.error('If using a mobile device/emulator, use your computer\'s IP address instead of localhost');
      }
    }
  };

  const login = async () => {
    try {
      const redirectUrl = Platform.OS === 'web' 
        ? `${BACKEND_URL}/` 
        : Linking.createURL('/');
      
      const authUrl = `${AUTH_URL}/?redirect=${encodeURIComponent(redirectUrl)}`;
      
      if (Platform.OS === 'web') {
        // Web: Use window redirect
        window.location.href = authUrl;
      } else {
        // Mobile: Use WebBrowser
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          await processAuthRedirect(result.url);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      
      if (sessionToken) {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
      }
      
      await AsyncStorage.removeItem('session_token');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      if (!BACKEND_URL) {
        console.error('BACKEND_URL is not set. Please create a .env file with EXPO_PUBLIC_BACKEND_URL');
        return;
      }

      const sessionToken = await AsyncStorage.getItem('session_token');
      
      if (sessionToken) {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      if (error instanceof TypeError && error.message === 'Network request failed') {
        console.error('Network error: Make sure the backend server is running at', BACKEND_URL);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};