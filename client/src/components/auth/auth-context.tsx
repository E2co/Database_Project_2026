import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { authApi } from "@/api"

export interface User {
  ID: string
  UserID: string
  FirstName: string
  LastName: string
  Email: string
  Role: "student" | "lecturer" | "admin"
}

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isStudent: boolean
  isLecturer: boolean
  isAdmin: boolean
  hydrateUser: (token: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authApi.me()
        setUser({
          ID: userData.ID,
          UserID: userData.UserID,
          FirstName: userData.FirstName,
          LastName: userData.LastName,
          Email: userData.Email,
          Role: userData.Role as "student" | "lecturer" | "admin",  // Type cast
        })
      } catch (err) {
        console.log("No active session")
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const hydrateUser = async (token: string) => {
    try {
      localStorage.setItem("token", token)
      const userData = await authApi.me()
      setUser({
        ID: userData.ID,
        UserID: userData.UserID,
        FirstName: userData.FirstName,
        LastName: userData.LastName,
        Email: userData.Email,
        Role: userData.Role as "student" | "lecturer" | "admin",  // Type cast
      })
    } catch (err) {
      console.error("Failed to hydrate user:", err)
      localStorage.removeItem("token")
      setUser(null)
      throw err
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
      localStorage.removeItem("token")
      setUser(null)
    } catch (err) {
      console.error("Logout error:", err)
      localStorage.removeItem("token")
      setUser(null)
    }
  }

  const isStudent = user?.Role === "student"
  const isLecturer = user?.Role === "lecturer"
  const isAdmin = user?.Role === "admin"

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isStudent,
        isLecturer,
        isAdmin,
        hydrateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
