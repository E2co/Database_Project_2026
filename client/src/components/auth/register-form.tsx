"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { authApi } from "@/api"
import useAuth from "@/components/auth/auth-context"

export function RegisterForm() {
  const navigate = useNavigate()
  const { hydrateUser } = useAuth()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    userID: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormData((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.role) {
      setError("Please select a role.")
      return
    }

    setIsLoading(true)
    try {
      await authApi.register({
        FirstName: formData.firstName,
        LastName: formData.lastName,
        Email: formData.email,
        Role: formData.role,
        Password: formData.password,
        ...(formData.userID ? { UserID: formData.userID } : {}),
      })

      const loginRes = await authApi.login(formData.email, formData.password)
      await hydrateUser(loginRes.token)
      navigate("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.")
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h3>Join Our Community</h3>
              <p>Connect with students and instructors across the university.</p>
            </div>
          </div>
          
          <div className="login-feature">
            <div className="login-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
              </svg>
            </div>
            <div>
              <h3>Access Resources</h3>
              <p>Get instant access to course materials, lectures, and study guides.</p>
            </div>
          </div>
          
          <div className="login-feature">
            <div className="login-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <h3>Track Progress</h3>
              <p>Monitor your grades, assignments, and academic achievements.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="login-right">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h2>Create an account</h2>
            <p>Join OURVLE to start your learning journey</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">{error}</div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={set("firstName")}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={set("lastName")}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={set("email")}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={set("password")}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={formData.role}
                onChange={set("role")}
                required
              >
                <option value="">Select your role</option>
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="userID">
                User ID <span className="form-optional">(optional)</span>
              </label>
              <input
                id="userID"
                type="text"
                placeholder="Leave blank to auto-generate"
                value={formData.userID}
                onChange={set("userID")}
              />
            </div>

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-terms">
              By creating an account you agree to our{" "}
              <button type="button">Terms of Service</button>
            </p>
            <p>
              Already have an account?{" "}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
