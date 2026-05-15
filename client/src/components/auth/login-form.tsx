"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/api"
import useAuth from "@/components/auth/auth-context"

export function LoginForm() {
  const navigate       = useNavigate()
  const { hydrateUser } = useAuth()

  const [email,     setEmail]     = useState("")
  const [password,  setPassword]  = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // 1. POST /login — returns { message, token, ID }
      const res = await authApi.login(email, password)

      // 2. Store the token in memory + sessionStorage, then call GET /me
      //    to fetch the full profile (FirstName, LastName, Role, etc.)
      await hydrateUser(res.token)

      navigate("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="text-muted-foreground">Enter your credentials to access your account</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in…" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Forgot your password?{" "}
        <button type="button" className="text-primary hover:underline">
          Reset it here
        </button>
      </p>
    </form>
  )
}

export default LoginForm