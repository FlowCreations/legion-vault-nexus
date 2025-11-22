import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

type UserProfile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
};

type AuthCtx = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx | null>(null);

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url, location, bio')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.warn('[AUTH] profile load error', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[AUTH] fetchProfile exception', err);
    return null;
  }
}

async function checkAdminStatus(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    const [p, adminStatus] = await Promise.all([
      fetchProfile(u.id),
      checkAdminStatus(u.id)
    ]);
    setProfile(p);
    setIsAdmin(adminStatus);
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AUTH] getSession error', error);
          // Clear all auth-related storage on error
          await supabase.auth.signOut({ scope: 'local' });
        }
        
        if (!mounted) return;

        const initialSession = data?.session;
        setSession(initialSession ?? null);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await loadProfile(initialSession.user);
        }
        
        setReady(true);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('[AUTH] State change event:', event);
            console.log('[AUTH] Session exists:', !!newSession);
            console.log('[AUTH] User exists:', !!newSession?.user);
            
            if (!mounted) return;

            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              if (newSession?.user) {
                console.log('[AUTH] Loading profile after event:', event);
                await loadProfile(newSession.user);
              }
            } else if (event === 'SIGNED_OUT') {
              setProfile(null);
              setIsAdmin(false);
            }
          }
        );
        
        unsubscribe = subscription.unsubscribe;
      } catch (err) {
        console.error('[AUTH] initialization error', err);
        // Clear potentially corrupted session
        await supabase.auth.signOut({ scope: 'local' });
        if (mounted) setReady(true);
      }
    };

    initialize();
    return () => {
      mounted = false;
      if (unsubscribe) {
        try { unsubscribe(); } catch (err) { console.warn('[AUTH] unsubscribe error', err); }
      }
    };
  }, [loadProfile]);

  const signInWithGoogle = useCallback(async (returnTo?: string) => {
    try {
      console.log('[AUTH] Initiating Google OAuth flow');
      console.log('[AUTH] Redirect URL:', `${window.location.origin}${returnTo || '/'}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${returnTo || '/'}`,
          queryParams: { 
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('[AUTH] Google OAuth initialization error:', error);
        throw error;
      }
      
      console.log('[AUTH] Google OAuth data:', data);
    } catch (err: any) {
      console.error('[AUTH] Google sign-in error', err);
      toast.error('Sign-in failed', { description: err.message || 'Failed to initiate Google sign-in' });
      throw err;
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      // Clear any stale session first
      await supabase.auth.signOut({ scope: 'local' });
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Signed in successfully');
    } catch (err: any) {
      console.error('[AUTH] Email sign-in error', err);
      const errorMessage = err.message || 'An error occurred during sign-in';
      toast.error('Sign-in failed', { description: errorMessage });
      throw err;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      
      // Send custom branded verification email
      if (data?.user) {
        const firstName = email.split('@')[0];
        try {
          await supabase.functions.invoke('generate-email-verification', {
            body: {
              userId: data.user.id,
              email: email,
              firstName: firstName
            }
          });
          console.log('[AUTH] Custom verification email sent');
        } catch (emailError) {
          console.error('[AUTH] Failed to send verification email:', emailError);
          // Don't fail signup if email fails
        }
      }
      
      // Check if email confirmation is required
      if (data?.user && !data.session) {
        toast.success('Welcome to Sons of Legion!', {
          description: 'Check your email for a verification link to complete your signup.',
          duration: 8000,
        });
      } else {
        toast.success('Account created successfully!');
      }
    } catch (err: any) {
      console.error('[AUTH] Email sign-up error', err);
      toast.error('Sign-up failed', { description: err.message });
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset email sent', {
        description: 'Check your inbox for a link to reset your password.',
      });
    } catch (err: any) {
      console.error('[AUTH] Password reset error', err);
      toast.error('Failed to send reset email', { description: err.message });
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('[AUTH] Starting sign out...');
      
      // Clear state immediately to prevent UI delays
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('[AUTH] signOut error', error);
      }
      
      console.log('[AUTH] Successfully signed out');
      toast.success('Signed out successfully');
    } catch (err) {
      console.error('[AUTH] signOut exception', err);
      // State already cleared above
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  const value = useMemo(
    () => ({
      ready, session, user, profile, isAdmin,
      signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut, refreshProfile,
    }),
    [ready, session, user, profile, isAdmin, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
