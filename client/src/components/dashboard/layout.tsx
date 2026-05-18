"use client"

import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import useAuth from "@/components/auth/auth-context"

const NAV_ITEMS = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/dashboard",
    roles: ["student", "lecturer", "admin"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    id: "courses",
    name: null,
    href: "/dashboard/courses",
    roles: ["student", "lecturer", "admin"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    id: "calendar",
    name: "Calendar",
    href: "/dashboard/calendar",
    roles: ["student", "lecturer"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2v4" /><path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
      </svg>
    ),
  },
  {
    id: "assignments",
    name: "Assignments",
    href: "/dashboard/assignments",
    roles: ["student", "lecturer"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
        <path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
      </svg>
    ),
  },
  {
    id: "forums",
    name: "Forums",
    href: "/dashboard/forums",
    roles: ["student", "lecturer"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "reports",
    name: "Reports",
    href: "/dashboard/reports",
    roles: ["lecturer", "admin"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin, isStudent } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const role = user?.role ?? "student"
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "U"
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.email ?? "User"

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role))

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate("/login")
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <span className="sidebar-title">OURVLE</span>
        </div>

        {user && (
          <div className="sidebar-role">
            <span className="sidebar-role-badge">{user.role}</span>
          </div>
        )}

        <nav className="sidebar-nav">
          <ul className="sidebar-nav-list">
            {visibleNav.map((item) => {
              // Determine label based on role and item
              let label = item.name
              if (item.id === "courses") {
                label = isAdmin || isStudent ? "Courses" : "My Courses"
              }
              
              const isActive = pathname === item.href

              return (
                <li key={item.id} className="sidebar-nav-item">
                  <Link
                    to={item.href}
                    className={isActive ? 'active' : ''}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
          <div className="header-spacer" />
          <div className="header-actions">
            <button className="notification-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span>Notifications</span>
            </button>

            {/* User Dropdown in Header */}
            <div className="header-user-dropdown" ref={dropdownRef}>
              <button 
                className="header-user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-label="User menu"
              >
                <div className="header-avatar">{initials}</div>
                <div className="header-user-info">
                  <div className="header-user-name">{displayName}</div>
                  <div className="header-user-role">{user?.role ?? ""}</div>
                </div>
                <svg className={`header-user-chevron ${dropdownOpen ? 'open' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="dropdown-content dropdown-user header-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-header-name">{displayName}</div>
                    <div className="dropdown-header-email">{user?.email}</div>
                  </div>
                  <div className="dropdown-separator" />
                  <button className="dropdown-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile Settings
                  </button>
                  <button className="dropdown-item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                      <circle cx="12" cy="12" r="1" />
                      <path d="M12 1v6m0 6v6" />
                      <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24" />
                      <path d="M1 12h6m6 0h6" />
                      <path d="M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
                    </svg>
                    Help &amp; Support
                  </button>
                  <div className="dropdown-separator" />
                  <button 
                    className="dropdown-item danger" 
                    onClick={handleLogout}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout