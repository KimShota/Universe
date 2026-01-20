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

  const checkExistingSession = async () => {
    try {
      if (!BACKEND_URL) {
        console.error('BACKEND_URL is not set. Please create a .env file with EXPO_PUBLIC_BACKEND_URL');
        setLoading(false);
        return;
      }

      const sessionToken = await AsyncStorage.getItem('session_token');
      
      if (sessionToken) {
        // タイムアウトを3秒に設定
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
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
            // タイムアウト時はセッショントークンを削除してログイン画面に戻す
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
      
      console.log('Attempting to connect to:', `${BACKEND_URL}/api/auth/session`);
      
      // Exchange session_id for user data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
      
      try {
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('Request timeout: Backend server took too long to respond');
        } else {
          console.error('Error processing auth redirect:', fetchError);
        }
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