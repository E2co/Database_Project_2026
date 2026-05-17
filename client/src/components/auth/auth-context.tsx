import React, { createContext, useContext, useEffect, useState } from "react"
import { authApi, setToken as setApiToken } from "@/api"

export interface AuthUser {
  id: string
  userID: string
  role: string
  firstName: string
  lastName: string
  email: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  hydrateUser: (token: string) => Promise<void>
  logout: () => void
  isStudent: boolean
  isLecturer: boolean
  isAdmin: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Hydrate user from token (called on mount and after login)
  const hydrateUser = async (token: string) => {
    try {
      setApiToken(token)
      const response = await authApi.me()
      const mappedUser: AuthUser = {
        id: response.ID,
        userID: response.UserID,
        role: response.Role,
        firstName: response.FirstName,
        lastName: response.LastName,
        email: response.Email,
      }
      setUser(mappedUser)
      // Save token to sessionStorage
      sessionStorage.setItem("ourvle_token", token)
    } catch (error) {
      console.error("Failed to hydrate user:", error)
      setUser(null)
      sessionStorage.removeItem("ourvle_token")
      setApiToken("")
    }
  }

  // On mount: check if token exists in sessionStorage
  useEffect(() => {
    const token = sessionStorage.getItem("ourvle_token")
    
    if (token) {
      // Token exists, try to hydrate
      hydrateUser(token).finally(() => setLoading(false))
    } else {
      // No token, skip hydration
      setLoading(false)
    }
  }, [])

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem("ourvle_token")
    setApiToken("")
    authApi.logout().catch(() => {}) // Best effort
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hydrateUser,
        logout,
        isStudent: user?.role === "student",
        isLecturer: user?.role === "lecturer",
        isAdmin: user?.role === "admin",
        isLoading: loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export default useAuth