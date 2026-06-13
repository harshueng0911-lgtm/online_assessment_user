// ─────────────────────────────────────────────────────────────────────────────
// FIXES APPLIED IN THIS FILE
//
//  #8  Profile object shape was duplicated in three places
//      Old: the same { id, name, email, role, avatar } literal was copy-pasted
//      into restoreSession(), onAuthStateChange(), and login(). Any future
//      field addition required three edits and was easy to get out of sync.
//      Fix: extracted a single toProfile(supabaseUser) helper at module level.
//      All three call sites now use it — one source of truth.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useEffect,
  useState,
} from "react";

import { authService } from "../services/authService.js";
import { supabase } from "../lib/supabase.js";

export const AuthContext = createContext(null);

// ─── FIX #8 ──────────────────────────────────────────────────────────────────
// Single helper that converts a raw Supabase user object into our app's profile
// shape. Any future field changes happen here and propagate everywhere.
function toProfile(supabaseUser) {
  return {
    id: supabaseUser.id,
    name:
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split("@")[0],
    email: supabaseUser.email,
    role: supabaseUser.user_metadata?.role || "candidate",
    avatar: supabaseUser.user_metadata?.avatar || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const {
          data: { session },
        } = await authService.getSession();

        if (session?.user) {
          // FIX #8 – use the shared helper instead of the inline literal
          setUser(toProfile(session.user));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // FIX #8 – use the shared helper instead of the inline literal
        setUser(toProfile(session.user));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async ({ email, password }) => {
    const { data, error } = await authService.signIn(email, password);
    if (error) throw error;

    // FIX #8 – use the shared helper instead of the inline literal
    const profile = toProfile(data.user);
    setUser(profile);
    return profile;
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const signup = async ({
    name,
    student_id,
    department,
    year,
    semester,
    email,
    password,
  }) => {
    const { data, error } = await authService.signUp(email, password, {
      name,
      student_id,
      department,
      year,
      semester,
    });

    if (error) throw error;

    const currentUser = data.user;

    const { error: dbError } = await supabase.from("users").insert([
      {
        id: currentUser.id,
        name,
        student_id,
        email,
        department,
        year,
        semester,
        avatar: null,
      },
    ]);

    if (dbError) throw dbError;

    return currentUser;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
