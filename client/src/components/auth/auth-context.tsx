"use client"

import {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode,
} from "react"
import { authApi, setToken, type MeResponse } from "@/api"

// ─── Shape of the stored user ──────────────────────────────────────────────────
export interface AuthUser {
  id: string        // internal DB primary key (encoded in JWT as user_id)
  userID: string    // application-level UserID
  role: string      // "student" | "lecturer" | "admin"
  firstName: string
  lastName: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  /** Call after a successful /login — pass the raw token from the response */
  hydrateUser: (token: string) => Promise<void>
  logout: () => Promise<void>
  isStudent:  boolean
  isLecturer: boolean
  isAdmin:    boolean
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const SESSION_KEY       = "ourvle_user"
const SESSION_TOKEN_KEY = "ourvle_token"   // store token so page refresh works

function persistUser(u: AuthUser | null) {
  if (u) sessionStorage.setItem(SESSION_KEY, JSON.stringify(u))
  else   sessionStorage.removeItem(SESSION_KEY)
}

function persistToken(token: string | null) {
  if (token) sessionStorage.setItem(SESSION_TOKEN_KEY, token)
  else       sessionStorage.removeItem(SESSION_TOKEN_KEY)
}

function meToAuthUser(me: MeResponse): AuthUser {
  return {
    id:        me.ID,
    userID:    me.UserID,
    role:      me.Role.toLowerCase(),
    firstName: me.FirstName,
    lastName:  me.LastName,
    email:     me.Email,
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * On mount: restore token + user from sessionStorage so a page refresh
   * doesn't log the user out. Then re-validate with GET /me.
   */
  useEffect(() => {
    // Restore cached user immediately (avoids flash of logged-out state)
    const rawUser = sessionStorage.getItem(SESSION_KEY)
    if (rawUser) {
      try { setUser(JSON.parse(rawUser) as AuthUser) } catch { /* ignore */ }
    }

    // Restore token into the in-memory store so the /me request can send it
    const savedToken = sessionStorage.getItem(SESSION_TOKEN_KEY)
    if (savedToken) {
      setToken(savedToken)
    }

    if (savedToken) {
      // Token exists — validate it with the server
      authApi.me()
        .then((me) => {
          const u = meToAuthUser(me)
          setUser(u)
          persistUser(u)
        })
        .catch(() => {
          // Token expired or invalid — clear everything
          setToken(null)
          persistToken(null)
          setUser(null)
          persistUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      // No saved token — not logged in
      setLoading(false)
    }
  }, [])

  /**
   * Call this immediately after POST /login succeeds.
   * Pass the token from the login response JSON.
   * It stores the token, then calls GET /me to get the full profile (including Role).
   */
  const hydrateUser = useCallback(async (token: string) => {
    // Store token in memory and sessionStorage
    setToken(token)
    persistToken(token)

    // Now fetch the full user profile — the Bearer header will be sent automatically
    const me = await authApi.me()
    const u  = meToAuthUser(me)
    setUser(u)
    persistUser(u)
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    // Clear token from memory and storage
    setToken(null)
    persistToken(null)
    setUser(null)
    persistUser(null)
  }, [])

  const role = user?.role ?? ""

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      hydrateUser,
      logout,
      isStudent:  role === "student",
      isLecturer: role === "lecturer",
      isAdmin:    role === "admin",
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export default function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}