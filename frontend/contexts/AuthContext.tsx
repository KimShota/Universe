import React, { createContext, useContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { isValidDeepLink, parseAuthTokensFromUrl } from '../lib/deepLink';
import type { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';

// Required so the in-app browser closes and delivers the redirect URL to the app
WebBrowser.maybeCompleteAuthSession();

const APP_SCHEME = 'frontend';

export interface User {
  id: string;
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
  loginWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileToUser(profile: Record<string, unknown> | null): User | null {
  if (!profile) return null;
  return {
    id: String(profile.id),
    email: String(profile.email ?? ''),
    name: String(profile.name ?? 'User'),
    picture: profile.picture ? String(profile.picture) : undefined,
    streak: Number(profile.streak ?? 0),
    coins: Number(profile.coins ?? 0),
    current_planet: Number(profile.current_planet ?? 0),
    last_post_date: profile.last_post_date ? String(profile.last_post_date) : undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      return profileToUser({
        id: authUser.id,
        email: authUser.email ?? '',
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? 'User',
        picture: authUser.user_metadata?.avatar_url,
        streak: 0,
        coins: 0,
        current_planet: 0,
      });
    }
    return profileToUser(data);
  };

  const syncSession = async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    const profile = await fetchProfile(session.user);
    setUser(profile);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (!url.includes('access_token')) return;
      if (!isValidDeepLink(url)) {
        console.warn('[Auth] Rejected deep link with disallowed scheme:', url?.split('?')[0]);
        return;
      }
      const { accessToken, refreshToken } = parseAuthTokensFromUrl(url);
      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error && data.session) {
          await syncSession(data.session);
        }
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  const login = async () => {
    try {
      let redirectUrl: string;
      if (Platform.OS === 'web') {
        redirectUrl = typeof window !== 'undefined' ? window.location.origin + '/' : '';
      } else {
        // Linking.createURL uses the actual app scheme (frontend:// for dev build, exp:// for Expo Go)
        const base = Linking.createURL('/');
        redirectUrl = base.endsWith('/') ? base : `${base}/`;
      }

      console.log('[OAuth] Add this URL to Supabase Redirect URLs:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        console.error('Login error:', error);
        return;
      }

      if (Platform.OS !== 'web' && data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        console.log('[OAuth] Result type:', result.type);
        if (result.type === 'success') {
          console.log('[OAuth] Result URL received');
        } else {
          console.log('[OAuth] Result (not success):', result);
        }
        if (result.type === 'success' && result.url) {
          const url = result.url;
          if (!isValidDeepLink(url)) {
            console.warn('[Auth] Rejected OAuth redirect with disallowed scheme');
            return;
          }
          const { accessToken, refreshToken } = parseAuthTokensFromUrl(url);
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            await syncSession((await supabase.auth.getSession()).data.session);
          }
        }
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && (await supabase.auth.getSession()).data.session) {
      await syncSession((await supabase.auth.getSession()).data.session);
    }
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name?.trim() || undefined } },
    });
    if (!error && (await supabase.auth.getSession()).data.session) {
      await syncSession((await supabase.auth.getSession()).data.session);
    }
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user);
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithEmail, signUpWithEmail, logout, refreshUser }}>
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
