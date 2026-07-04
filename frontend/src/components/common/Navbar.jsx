import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import {
  Bell, Search, Menu, X, ChevronDown, LogOut,
  User, LayoutDashboard, Shield, FileCheck,
  PenSquare, UserPlus
} from 'lucide-react'

export default function Navbar() {
  const { user, logout, isAdmin, isJournalist, isFactChecker } = useAuth()
  const { unreadCount } = useNotifications()
  const [menuOpen, setMenuOpen]       = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen]   = useState(false)
  const [searchQ, setSearchQ]         = useState('')
  const profileRef = useRef(null)
  const navigate   = useNavigate()

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [navigate])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ)}`)
      setSearchOpen(false)
      setSearchQ('')
    }
  }

  // Show "Apply as Journalist" if user is CITIZEN house (not yet applied)
  const showApplyLink = user && user.house === 'CITIZEN'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top editorial strip */}
      <div className="bg-navy-900 text-white text-xs py-1.5 text-center tracking-widest font-sans uppercase select-none">
        The Public Post — Truth is a public responsibility
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-navy-900 rounded flex items-center justify-center">
              <span className="text-white font-serif font-bold text-sm">P</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-serif font-bold text-navy-900 text-lg leading-none">The Public Post</div>
              <div className="text-navy-400 text-[10px] uppercase tracking-widest leading-none">Verified Journalism</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            <NavLink to="/" end className={({ isActive }) =>
              `btn-ghost text-sm ${isActive ? 'text-navy-900 font-semibold' : 'text-navy-500'}`}>
              Feed
            </NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) =>
              `btn-ghost text-sm ${isActive ? 'text-navy-900 font-semibold' : 'text-navy-500'}`}>
              Credibility
            </NavLink>
            {isFactChecker && (
              <NavLink to="/factcheck" className={({ isActive }) =>
                `btn-ghost text-sm ${isActive ? 'text-navy-900 font-semibold' : 'text-navy-500'}`}>
                Fact Check
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) =>
                `btn-ghost text-sm ${isActive ? 'text-navy-900 font-semibold' : 'text-navy-500'}`}>
                Admin
              </NavLink>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => { setSearchOpen(v => !v); setMenuOpen(false) }}
              className="btn-ghost p-2"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {user ? (
              <>
                {/* Notifications bell */}
                <Link to="/notifications" className="btn-ghost p-2 relative" aria-label="Notifications">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(v => !v)}
                    className="flex items-center gap-2 btn-ghost px-2.5 py-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-navy-800 max-w-[90px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown size={13} className={`text-navy-400 transition-transform duration-150 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                      {/* User info */}
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <div className="text-sm font-semibold text-navy-900 truncate">{user.name}</div>
                        <div className="text-xs text-navy-500 truncate">{user.email}</div>
                        <div className="mt-1.5 flex gap-1 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 bg-navy-100 text-navy-600 rounded font-semibold uppercase tracking-wide">
                            {user.house}
                          </span>
                          {user.role === 'ADMIN' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-semibold uppercase tracking-wide">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Links */}
                      <div className="py-1">
                        <Link to="/profile" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-navy-700 hover:bg-gray-50">
                          <User size={14} />Profile
                        </Link>

                        {isJournalist && (
                          <>
                            <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-navy-700 hover:bg-gray-50">
                              <LayoutDashboard size={14} />My Dashboard
                            </Link>
                            <Link to="/write" onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-navy-700 hover:bg-gray-50">
                              <PenSquare size={14} />Write Article
                            </Link>
                          </>
                        )}

                        {showApplyLink && (
                          <Link to="/apply-journalist" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-verified-600 hover:bg-blue-50 font-medium">
                            <UserPlus size={14} />Apply as Journalist
                          </Link>
                        )}

                        {isFactChecker && (
                          <Link to="/factcheck" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-navy-700 hover:bg-gray-50">
                            <FileCheck size={14} />Fact Check Queue
                          </Link>
                        )}

                        {isAdmin && (
                          <Link to="/admin" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-navy-700 hover:bg-gray-50">
                            <Shield size={14} />Admin Panel
                          </Link>
                        )}
                      </div>

                      {/* Sign out */}
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={() => { setProfileOpen(false); logout() }}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                          <LogOut size={14} />Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Join</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => { setMenuOpen(v => !v); setProfileOpen(false) }}
              className="md:hidden btn-ghost p-2 ml-1"
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-3 pt-1">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search articles, journalists, topics…"
                className="input flex-1"
                autoFocus
              />
              <button type="submit" className="btn-primary px-5">Search</button>
              <button type="button" onClick={() => setSearchOpen(false)} className="btn-ghost px-3">
                <X size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-0.5 pb-4">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 rounded font-medium">
              Feed
            </NavLink>
            <NavLink to="/leaderboard" onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 rounded font-medium">
              Credibility Leaderboard
            </NavLink>
            {user && (
              <>
                <NavLink to="/profile" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 rounded font-medium">
                  Profile
                </NavLink>
                <NavLink to="/notifications" onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 rounded font-medium">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </NavLink>
                {isJournalist && (
                  <>
                    <NavLink to="/write" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 rounded font-medium">
                      Write Article
                    </NavLink>
                    <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 rounded font-medium">
                      My Dashboard
                    </NavLink>
                  </>
                )}
                {showApplyLink && (
                  <NavLink to="/apply-journalist" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-verified-600 hover:bg-blue-50 rounded font-medium">
                    Apply as Journalist
                  </NavLink>
                )}
                {isFactChecker && (
                  <NavLink to="/factcheck" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 rounded font-medium">
                    Fact Check
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin" onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-navy-700 hover:bg-gray-50 rounded font-medium">
                    Admin Panel
                  </NavLink>
                )}
                <button onClick={() => { setMenuOpen(false); logout() }}
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded font-medium">
                  Sign Out
                </button>
              </>
            )}
            {!user && (
              <div className="flex gap-2 px-3 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 justify-center text-sm py-2">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 justify-center text-sm py-2">Join</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
