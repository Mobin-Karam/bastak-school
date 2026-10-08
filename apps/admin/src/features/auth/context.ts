import { createContext } from "react";
import type { AuthState } from "./model/auth.types";

/**
 * Keep the context identity outside the hot-reloaded provider implementation.
 * This prevents a Vite refresh from leaving route consumers attached to an old
 * context instance while the provider renders a new one.
 */
export const AuthContext = createContext<AuthState | null>(null);
