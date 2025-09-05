'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface UserInfo {
  auid?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  language_preference?: 'zh' | 'en';
  ip_address?: string;
  ip_country?: string;
  created_at?: string;
}

const DEBUG = process.env.NODE_ENV === 'development';

const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存

export const UserContext = createContext<{
  user: User | null;
  loading: boolean;
  refreshUser: (force?: boolean) => Promise<User | null>;
  userProfile: UserInfo | null;
}>({
  user: null,
  loading: true,
  refreshUser: async () => null,
  userProfile: null,
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRefresh = useRef<number>(0);

  const lastSession = useRef<Session | null>(null); // 记录上次 session

  const refreshUser = async (force = false): Promise<User | null> => {
    const now = Date.now();
    if (!force && now - lastRefresh.current < CACHE_DURATION) {
      return user; // 缓存内不刷新，直接返回当前user
    }
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile');
      const data = await res.json();

      if (data.user) {
        setUser(data.user);
        setUserProfile(data.userProfile);
        lastRefresh.current = now;
        return data.user;
      } else {
        setUser(null);
        setUserProfile(null);
        return null;
      }
    } catch (err) {
      console.error('刷新用户失败', err);
      setUser(null);
      setUserProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const initializeUserState = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session) {
      lastSession.current = session;
      setUser(session.user);
    }

    await refreshUser(true); // 先设置 session 再请求，避免重复请求
  };

  useEffect(() => {
    initializeUserState();
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (DEBUG) console.log('auth state:', event);
  
        const prevAccessToken = lastSession.current?.access_token;
        const newAccessToken = session?.access_token;
  
        if (prevAccessToken !== newAccessToken) {
          if (DEBUG) console.log('access token changed');
          await refreshUser(true);
        }
        lastSession.current = session;
      }
    );
  
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUser(); // 命中缓存则跳过
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
  
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, userProfile, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}