"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { authApi } from "@/api"
import useAuth from "@/components/auth/auth-context"

export function RegisterForm() {
  const navigate       = useNavigate()
  const { hydrateUser } = useAuth()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName:  "",
    email:     "",
    password:  "",
    role:      "",
    userID:    "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const set = (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
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
      // 1. POST /register
      await authApi.register({
        FirstName: formData.firstName,
        LastName:  formData.lastName,
        Email:     formData.email,
        Role:      formData.role,
        Password:  formData.password,
        ...(formData.userID ? { UserID: formData.userID } : {}),
      })

      // 2. POST /login — get the token
      const loginRes = await authApi.login(formData.email, formData.password)

      // 3. Store token + fetch full profile via GET /me
      await hydrateUser(loginRes.token)

      navigate("/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Create an account</h2>
        <p className="text-muted-foreground">Join OURVLE to start your learning journey</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" placeholder="John" value={formData.firstName} onChange={set("firstName")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={set("lastName")} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" placeholder="you@university.edu" value={formData.email} onChange={set("email")} autoComplete="email" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-password">Password</Label>
          <Input id="reg-password" type="password" placeholder="••••••••" value={formData.password} onChange={set("password")} autoComplete="new-password" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(v) => setFormData((p) => ({ ...p, role: v }))}>
            <SelectTrigger id="role"><SelectValue placeholder="Select your role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="lecturer">Lecturer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="userID">User ID <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="userID" placeholder="Leave blank to auto-generate" value={formData.userID} onChange={set("userID")} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        By creating an account you agree to our{" "}
        <button type="button" className="text-primary hover:underline">Terms of Service</button>
      </p>
    </form>
  )
}

export default RegisterForm