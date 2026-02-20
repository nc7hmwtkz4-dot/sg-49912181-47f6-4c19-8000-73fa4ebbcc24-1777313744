import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
  last_sign_in_at?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Dynamic URL Helper
const getURL = () => {
  let url = process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 
           process?.env?.NEXT_PUBLIC_SITE_URL ?? 
           'http://localhost:3000'
  
  // Handle undefined or null url
  if (!url) {
    url = 'http://localhost:3000';
  }
  
  // Ensure url has protocol
  url = url.startsWith('http') ? url : `https://${url}`
  
  // Ensure url ends with slash
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

export const authService = {
  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? {
      id: user.id,
      email: user.email || "",
      user_metadata: user.user_metadata,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    } : null;
  },

  // Get current session
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Sign up with email and password
  async signUp(email: string, password: string, metadata?: { full_name?: string }): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/confirm-email`,
          data: metadata
        }
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at,
        last_sign_in_at: data.user.last_sign_in_at
      } : null;

      return { user: authUser, error: null };
    } catch (_error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign up" } 
      };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null; requires2FA?: boolean }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      // Check if user has MFA enabled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const hasMFA = factors && factors.totp && factors.totp.length > 0;

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at,
        last_sign_in_at: data.user.last_sign_in_at
      } : null;

      return { user: authUser, error: null, requires2FA: hasMFA };
    } catch (_error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign in" } 
      };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (_error) {
      return { 
        error: { message: "An unexpected error occurred during sign out" } 
      };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/reset-password`,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (_error) {
      return { 
        error: { message: "An unexpected error occurred during password reset" } 
      };
    }
  },

  // Confirm email (REQUIRED)
  async confirmEmail(token: string, type: 'signup' | 'recovery' | 'email_change' = 'signup'): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at,
        last_sign_in_at: data.user.last_sign_in_at
      } : null;

      return { user: authUser, error: null };
    } catch (_error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during email confirmation" } 
      };
    }
  },

  // Update email
  async updateEmail(newEmail: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (_error) {
      return { 
        error: { message: "An unexpected error occurred while updating email" } 
      };
    }
  },

  // Update password
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (_error) {
      return { 
        error: { message: "An unexpected error occurred while updating password" } 
      };
    }
  },

  // Delete account
  async deleteAccount(): Promise<{ error: AuthError | null }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: { message: "No user found" } };
      }

      // Delete user account (will cascade to user_coins and user_sales due to FK constraints)
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (_error) {
      return { 
        error: { message: "An unexpected error occurred while deleting account" } 
      };
    }
  },

  // 2FA Management Methods

  // Enroll in 2FA (returns QR code and secret)
  async enroll2FA(): Promise<{ qrCode: string | null; secret: string | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'NumiVault Authenticator'
      });

      if (error) {
        return { qrCode: null, secret: null, error: { message: error.message } };
      }

      return {
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        error: null
      };
    } catch (_error) {
      return {
        qrCode: null,
        secret: null,
        error: { message: "An unexpected error occurred while enrolling in 2FA" }
      };
    }
  },

  // Verify 2FA code during enrollment or login
  async verify2FA(code: string, factorId?: string): Promise<{ error: AuthError | null }> {
    try {
      // If no factorId provided, get the first TOTP factor
      let factor = factorId;
      
      if (!factor) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        if (factors?.totp && factors.totp.length > 0) {
          factor = factors.totp[0].id;
        }
      }

      if (!factor) {
        return { error: { message: "No 2FA factor found" } };
      }

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor,
        code: code
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (_error) {
      return {
        error: { message: "An unexpected error occurred while verifying 2FA code" }
      };
    }
  },

  // Disable 2FA
  async disable2FA(): Promise<{ error: AuthError | null }> {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      
      if (!factors?.totp || factors.totp.length === 0) {
        return { error: { message: "No 2FA factors found" } };
      }

      const factorId = factors.totp[0].id;
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (_error) {
      return {
        error: { message: "An unexpected error occurred while disabling 2FA" }
      };
    }
  },

  // Check if user has 2FA enabled
  async has2FA(): Promise<{ enabled: boolean; error: AuthError | null }> {
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        return { enabled: false, error: { message: error.message } };
      }

      const hasMFA = factors && factors.totp && factors.totp.length > 0;
      return { enabled: hasMFA || false, error: null };
    } catch (_error) {
      return {
        enabled: false,
        error: { message: "An unexpected error occurred while checking 2FA status" }
      };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
