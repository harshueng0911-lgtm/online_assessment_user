import "./user.types.js";

/**
 * @typedef {Object} AuthContextType
 * @property {import("./user.types.js").UserProfile|null} user - The currently logged-in user profile, or null
 * @property {boolean} loading - True if the session is currently being recovered
 * @property {Function} login - Method to authenticate a user: (credentials) => Promise<UserProfile>
 * @property {Function} signup - Method to register a new user: (registration) => Promise<void>
 * @property {Function} logout - Method to sign out the current user: () => Promise<void>
 */

export {};
