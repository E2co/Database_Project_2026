import React, { createContext, useContext, useEffect, useState } from "react"
import { authApi, setToken as setApiToken } from "@/api"

export interface AuthUser {
  id: string
  userID: string
  role: "student" | "lecturer" | "admin"
  firstName: string
  lastName: string
  email: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  hydrateUser: (token: string) => Promise<void>
  logout: () => Promise<void>
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
      
      // Ensure role is one of the valid types
      const validRole = (["student", "lecturer", "admin"].includes(response.Role?.toLowerCase())
        ? response.Role?.toLowerCase()
        : "student") as "student" | "lecturer" | "admin"

      const mappedUser: AuthUser = {
        id: response.ID,
        userID: response.UserID,
        role: validRole,
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
      throw error
    }
  }

  // On mount: check if token exists in sessionStorage
  useEffect(() => {
    const token = sessionStorage.getItem("ourvle_token")
    
    if (token) {
      // Token exists, try to hydrate
      hydrateUser(token)
        .catch(() => {
          console.log("Failed to restore session")
        })
        .finally(() => setLoading(false))
    } else {
      // No token, skip hydration
      setLoading(false)
    }
  }, [])

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.error("Logout API error:", err)
    } finally {
      setUser(null)
      sessionStorage.removeItem("ourvle_token")
      setApiToken("")
    }
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
  