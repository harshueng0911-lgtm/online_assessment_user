import { authApi } from "../api/authApi.js";

// Consumes the raw API endpoints layer and exposes clean business methods
export const authService = {
  signIn: (email, password) => authApi.signIn(email, password),
  signUp: (email, password, meta = {}) => authApi.signUp(email, password, meta),
  signOut: () => authApi.signOut(),
  resetPassword: (email) => authApi.resetPassword(email),
  updatePassword: (password) => authApi.updatePassword(password),
  getSession: () => authApi.getSession(),
  onAuthStateChange: (cb) => authApi.onAuthStateChange(cb),
};
