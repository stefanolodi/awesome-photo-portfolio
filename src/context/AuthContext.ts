import { createContext } from 'react';
import type { Session, AuthError } from '@supabase/supabase-js';

export interface AuthContextValue {
  session: Session | null;
  isOwner: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
