"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authApi } from "@/api"
import useAuth from "@/components/auth/auth-context"

export function LoginForm() {
  const navigate = useNavigate()
  const { hydrateUser } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await authApi.login(email, password)
      await hydrateUser(res.token)
      navigate("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Left Panel - Brand & Features */}
      <div className="login-left">
        <div className="login-brand">
          <h1>OURVLE</h1>
          <p>Your comprehensive learning management platform for academic excellence.</p>
        </div>
        
        <div className="login-features">
          <div className="login-feature">
            <div className="login-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
              </svg>
            </div>
            <div>
              <h3>Course Management</h3>
              <p>Access all your enrolled courses and learning materials in one place.</p>
            </div>
          </div>
          
          <div className="login-feature">
            <div className="login-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
              </svg>
            </div>
            <div>
              <h3>Assignment Tracking</h3>
              <p>Never miss a deadline with our integrated assignment management system.</p>
            </div>
          </div>
          
          <div className="login-feature">
            <div className="login-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3>Discussion Forums</h3>
              <p>Collaborate with classmates and instructors through course forums.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-right">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h2>Welcome back</h2>
            <p>Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">{error}</div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Forgot your password?{" "}
              <button type="button">Reset it here</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
