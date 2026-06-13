import { supabase } from "../lib/supabase.js";

export const authApi = {
  signIn: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: (email, password, meta = {}) =>
    supabase.auth.signUp({ email, password, options: { data: meta } }),

  signOut: () => supabase.auth.signOut(),

  resetPassword: (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),

  updatePassword: (password) => supabase.auth.updateUser({ password }),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),
};
