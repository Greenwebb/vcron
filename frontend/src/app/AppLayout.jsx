import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  Clock, BarChart2, FileText, Menu, X, LogOut, Shield, ChevronRight,
  WifiOff, Download, Home, Info, FileCheck, Trash2, Settings,
  BarChart, ClipboardList, Users
} from 'lucide-react'
import { authFetch, API, clearStoredToken } from '../lib/api'
import Logo from '../components/Logo'

// ─── Haptic helper ────────────────────────────────────────────────────────────
function haptic(style = 'light') {
  if (navigator.vibrate) {
    const patterns = { light: [10], medium: [20], heavy: [40] }
    navigator.vibrate(patterns[style] || [10])
  }
}

// ─── Install Prompt Hook ──────────────────────────────────────────────────────
function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true)
      return
    }
    const handler = (e) => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setIsInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = useCallback(async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setPrompt(null)
  }, [prompt])

  return { prompt, isInstalled, install }
}

// ─── Bottom Nav (worker-only: Shift Status, History, My Reports) ──────────────
function BottomNav({ role }) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  // Worker tabs — always shown
  const workerTabs = [
    { label: 'Shift Status', icon: Home,      route: '/app/dashboard' },
    { label: 'History',      icon: Clock,     route: '/app/history' },
    { label: 'My Reports',   icon: FileText,  route: '/app/my-reports' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-stretch max-w-lg mx-auto">
        {workerTabs.map(({ label, icon: Icon, route }) => {
          const active = path === route || path.startsWith(route + '/')
          return (
            <button
              key={route}
              onClick={() => { haptic('light'); navigate(route) }}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px]
                ${active ? 'text-teal-700' : 'text-slate-500 active:text-slate-700'}`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-600 rounded-full" />
              )}
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Drawer Menu ──────────────────────────────────────────────────────────────
function Drawer({ open, onClose, user, role, onLogout }) {
  const navigate = useNavigate()

  // Worker items — always shown
  const workerItems = [
    { label: 'About VChron',           icon: Info,         route: '/app/about' },
    { label: 'Privacy Policy',         icon: FileCheck,    route: '/app/privacy-policy' },
    { label: 'Terms & Conditions',     icon: ClipboardList,route: '/app/terms' },
    { label: 'Request Account Deletion', icon: Trash2,     route: '/app/request-deletion', danger: true },
  ]

  // Admin-only items (only visible to admin/superuser in the drawer)
  const adminItems = []
  if (role === 'superuser') {
    adminItems.push(
      { label: 'Superuser Panel',  icon: Shield,      route: '/app/superuser' },
      { label: 'Analytics',        icon: BarChart,    route: '/app/analytics' },
      { label: 'Admin Scoping',    icon: Settings,    route: '/app/admin-scoping' },
      { label: 'Audit Trail',      icon: ClipboardList, route: '/app/audit-trail' },
    )
  }
  if (role === 'admin') {
    adminItems.push(
      { label: 'Admin Panel',        icon: Shield,    route: '/app/admin' },
      { label: 'Deletion Requests',  icon: Trash2,    route: '/app/deletion-requests' },
    )
  }

  const go = (route) => { haptic('light'); navigate(route); onClose() }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200"
             style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-white font-bold text-lg">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-slate-900 font-semibold text-sm leading-tight">{user?.name || 'User'}</p>
              <p className="text-slate-500 text-xs capitalize">{role || 'worker'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin section (if applicable) */}
        {adminItems.length > 0 && (
          <div className="py-2 border-b border-slate-200">
            <p className="px-4 py-1 text-xs text-slate-500 uppercase tracking-widest">Administration</p>
            {adminItems.map(({ label, icon: Icon, route }) => (
              <button
                key={route}
                onClick={() => go(route)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span className="flex-1 text-left">{label}</span>
                <ChevronRight className="w-4 h-4 opacity-40" />
              </button>
            ))}
          </div>
        )}

        {/* Worker nav items */}
        <div className="flex-1 overflow-y-auto py-2">
          {workerItems.map(({ label, icon: Icon, route, danger }) => (
            <button
              key={route}
              onClick={() => go(route)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                ${danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <Icon className={`w-4 h-4 ${danger ? 'text-red-600' : 'text-slate-500'}`} />
              <span className="flex-1 text-left">{label}</span>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => { haptic('medium'); onLogout() }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Install Banner ───────────────────────────────────────────────────────────
function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-teal-700 text-white px-4 py-3 flex items-center gap-3 shadow-lg"
         style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <Download className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Install VChron</p>
        <p className="text-xs text-teal-200 leading-tight">Add to home screen for quick access</p>
      </div>
      <button onClick={onInstall} className="bg-white text-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0">
        Install
      </button>
      <button onClick={onDismiss} className="text-teal-200 hover:text-white flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Offline Banner ───────────────────────────────────────────────────────────
function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-amber-600 text-white px-4 py-2 flex items-center gap-2 text-sm">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>You're offline — some features may be limited</span>
    </div>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function AppPageSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-32 rounded-2xl bg-white border border-slate-200" />
      <div className="h-20 rounded-2xl bg-white border border-slate-200" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-white border border-slate-200" />
        <div className="h-24 rounded-2xl bg-white border border-slate-200" />
      </div>
      <div className="h-40 rounded-2xl bg-white border border-slate-200" />
    </div>
  )
}

// ─── Main AppLayout ───────────────────────────────────────────────────────────
export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [pageReady, setPageReady] = useState(false)
  const { prompt, isInstalled, install } = useInstallPrompt()

  // Show install banner if prompt is available and not dismissed
  useEffect(() => {
    if (prompt && !isInstalled && !sessionStorage.getItem('install-dismissed')) {
      setShowInstallBanner(true)
    }
  }, [prompt, isInstalled])

  // Load user from auth/me — restore session
  useEffect(() => {
    let cancelled = false

    const restoreSession = async () => {
      try {
        const response = await authFetch(`${API}/auth/me`)
        if (!response.ok) {
          clearStoredToken()
          if (!cancelled) navigate('/app/login', { replace: true })
          return
        }

        const data = await response.json()
        const resolvedUser = data?.user ?? data

        if (!resolvedUser?.user_id) {
          clearStoredToken()
          if (!cancelled) navigate('/app/login', { replace: true })
          return
        }

        if (cancelled) return
        setUser(resolvedUser)
        setRole(resolvedUser.role?.toLowerCase())
        setPageReady(true)
      } catch {
        clearStoredToken()
        if (!cancelled) navigate('/app/login', { replace: true })
      }
    }

    restoreSession()
    return () => { cancelled = true }
  }, [navigate])

  // Reset page-ready on route change (show skeleton briefly for smooth transitions)
  useEffect(() => {
    if (!user) return
    setPageReady(false)
    const t = setTimeout(() => setPageReady(true), 120)
    return () => clearTimeout(t)
  }, [location.pathname, user])

  const handleLogout = async () => {
    haptic('heavy')
    try {
      await authFetch(`${API}/auth/logout`, { method: 'POST' })
    } catch {}
    clearStoredToken()
    navigate('/app/login', { replace: true })
  }

  const handleInstall = async () => {
    await install()
    setShowInstallBanner(false)
  }

  const handleDismissInstall = () => {
    sessionStorage.setItem('install-dismissed', '1')
    setShowInstallBanner(false)
  }

  // Page title from route
  const titles = {
    '/app/dashboard':         'Shift Status',
    '/app/history':           'Attendance History',
    '/app/my-reports':        'My Reports',
    '/app/admin':             'Admin Panel',
    '/app/superuser':         'Superuser Panel',
    '/app/about':             'About VChron',
    '/app/privacy-policy':    'Privacy Policy',
    '/app/terms':             'Terms & Conditions',
    '/app/request-deletion':  'Delete Account',
    '/app/analytics':         'Analytics',
    '/app/admin-scoping':     'Admin Scoping',
    '/app/audit-trail':       'Audit Trail',
    '/app/deletion-requests': 'Deletion Requests',
  }
  const pageTitle = titles[location.pathname] || 'VChron'

  // Banner height offset
  const bannerOffset = showInstallBanner ? 48 : 0
  const topOffset = `pt-[${60 + bannerOffset}px]`

  if (!user) {
    // Splash / loading screen
    return (
      <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-[var(--vchron-teal-dark)] via-[var(--vchron-teal)] to-[var(--vchron-teal-light)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_38%)]" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <Logo variant="light" size="xl" className="drop-shadow-[0_18px_40px_rgba(0,0,0,0.28)]" />
        </div>
        <div className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2">
          <div className="h-11 w-11 rounded-full border-[3px] border-white/35 border-t-white animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Offline banner */}
      <OfflineBanner />

      {/* Install banner */}
      {showInstallBanner && (
        <InstallBanner onInstall={handleInstall} onDismiss={handleDismissInstall} />
      )}

      {/* Top header */}
      <header
        className="fixed left-0 right-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200"
        style={{ top: showInstallBanner ? '48px' : 0 }}
      >
        <div className="flex items-center justify-between px-4 h-[60px] max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <img src="/logo192.png" alt="VChron" className="w-7 h-7 rounded-lg object-contain" />
            <span className="text-slate-900 font-semibold text-sm">{pageTitle}</span>
          </div>
          <button
            onClick={() => { haptic('light'); setDrawerOpen(true) }}
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Page content with smooth transition */}
      <main
        className="flex-1 overflow-y-auto pb-[72px]"
        style={{ paddingTop: showInstallBanner ? '108px' : '60px' }}
      >
        <div
          className={`max-w-lg mx-auto w-full min-h-full transition-opacity duration-150 ${pageReady ? 'opacity-100' : 'opacity-0'}`}
        >
          {pageReady
            ? <Outlet context={{ user, role }} />
            : <AppPageSkeleton />
          }
        </div>
      </main>

      {/* Bottom nav — worker-only */}
      <BottomNav role={role} />

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        role={role}
        onLogout={handleLogout}
      />
    </div>
  )
}
