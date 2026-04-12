import React, { Component, Suspense, lazy, useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Logo from "@/components/Logo";

// ─── Marketing / website pages (eager) ───────────────────────────────────────
import Landing from "@/pages/Landing";

// ─── Legacy web app pages (eager, kept for backward compat) ──────────────────
import Login from "@/pages/Login";
import StaffLogin from "@/pages/StaffLogin";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import History from "@/pages/History";
import CompleteRegistration from "@/pages/CompleteRegistration";
// These pages are lazy-loaded below (both for /app/* and legacy routes)
// Static imports removed to avoid duplicate module bundling

// ─── Lazy-loaded (react-leaflet) ──────────────────────────────────────────────
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const SuperUserDashboard = lazy(() => import("@/pages/SuperUserDashboard"));

// ─── PWA /app shell and pages (all lazy) ─────────────────────────────────────
const AppLayout = lazy(() => import("@/app/AppLayout"));
const OfflinePage = lazy(() => import("@/app/OfflinePage"));

// /app/* pages re-use the existing page components (wrapped in AppLayout)
// They are lazy-loaded for code splitting
const AppDashboard = lazy(() => import("@/pages/Dashboard"));
const AppHistory = lazy(() => import("@/pages/History"));
const AppAdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AppSuperUserDashboard = lazy(() => import("@/pages/SuperUserDashboard"));
const AppAbout = lazy(() => import("@/pages/AboutVChron"));
const AppPrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const AppTerms = lazy(() => import("@/pages/TermsAndConditions"));
const AppRequestDeletion = lazy(() => import("@/pages/RequestDeleteAccount"));
const AppAuditTrail = lazy(() => import("@/pages/AuditTrail"));
const AppAnalytics = lazy(() => import("@/pages/Analytics"));
const AppAdminScoping = lazy(() => import("@/pages/AdminScoping"));
const AppDeletionRequests = lazy(() => import("@/pages/DeletionRequests"));
const AppMyReports = lazy(() => import("@/pages/MyReports"));
const InstallPage = lazy(() => import("@/pages/Install"));

import {
  API,
  BACKEND_URL,
  authFetch,
  setStoredToken,
  clearStoredToken,
} from "@/lib/api";

export { API, BACKEND_URL, authFetch, setStoredToken, clearStoredToken };
export { getStoredToken } from "@/lib/api";

// ─── Loaders ──────────────────────────────────────────────────────────────────
const SplashLoader = ({ fullScreen = true }) => (
  <div className={`${fullScreen ? "min-h-screen" : "min-h-[60vh]"} relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--vchron-teal-dark)] via-[var(--vchron-teal)] to-[var(--vchron-teal-light)]`}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_38%)]" />
    <div className="relative z-10 flex items-center justify-center px-6">
      <Logo variant="light" size="xl" className="drop-shadow-[0_18px_40px_rgba(0,0,0,0.28)]" />
    </div>
    <div className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2">
      <div className="h-11 w-11 rounded-full border-[3px] border-white/35 border-t-white animate-spin" />
    </div>
  </div>
);

const PageLoader = () => <SplashLoader fullScreen />;

const AppPageLoader = () => (
  <SplashLoader fullScreen={false} />
);

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("App Error Boundary:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <p className="text-slate-600 mb-6 text-sm">{this.state.error?.message || "An unexpected error occurred."}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/app/login'; }}
              className="bg-teal-700 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors">
              Go to Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Token capture on OAuth redirect ─────────────────────────────────────────
function OAuthTokenCapture({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      setStoredToken(token);
      params.delete('token');
      const newSearch = params.toString();
      navigate(location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true });
    }
  }, [location.search, location.pathname, navigate]);
  return children;
}

// ─── Protected Route (legacy web) ────────────────────────────────────────────
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userData, setUserData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const response = await authFetch(`${API}/auth/me`);
        if (cancelled) return;
        if (response.ok) {
          const user = await response.json();
          setUserData(user);
          setIsAuthenticated(true);
        } else {
          clearStoredToken();
          setIsAuthenticated(false);
        }
      } catch { if (!cancelled) setIsAuthenticated(false); }
    };
    checkAuth();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (isAuthenticated === null) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && userData?.role !== 'admin' && userData?.role !== 'superuser') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// ─── Router ───────────────────────────────────────────────────────────────────
function AppRouter() {
  return (
    <OAuthTokenCapture>
      <Routes>
        {/* ── Marketing website ── */}
        <Route path="/" element={<Landing />} />

        {/* ── Legacy web app routes (kept for backward compat) ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy-policy" element={<Suspense fallback={<PageLoader />}><AppPrivacyPolicy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<PageLoader />}><AppTerms /></Suspense>} />
        <Route path="/complete-registration" element={<ProtectedRoute><CompleteRegistration /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AppAbout /></Suspense></ProtectedRoute>} />
        <Route path="/request-deletion" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AppRequestDeletion /></Suspense></ProtectedRoute>} />
        <Route path="/my-reports" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AppMyReports /></Suspense></ProtectedRoute>} />
        <Route path="/audit-trail" element={<ProtectedRoute requireAdmin><Suspense fallback={<PageLoader />}><AppAuditTrail /></Suspense></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute requireAdmin><Suspense fallback={<PageLoader />}><AppAnalytics /></Suspense></ProtectedRoute>} />
        <Route path="/admin-scoping" element={<ProtectedRoute requireAdmin><Suspense fallback={<PageLoader />}><AppAdminScoping /></Suspense></ProtectedRoute>} />
        <Route path="/deletion-requests" element={<ProtectedRoute requireAdmin><Suspense fallback={<PageLoader />}><AppDeletionRequests /></Suspense></ProtectedRoute>} />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="/superuser" element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<PageLoader />}><SuperUserDashboard /></Suspense>
          </ProtectedRoute>
        } />

        {/* ── Install page (public, no auth required) ── */}
        <Route path="/install" element={<Suspense fallback={<PageLoader />}><InstallPage /></Suspense>} />

        {/* ── PWA /app routes ── */}
        {/* Auth pages (no shell) */}
        <Route path="/app/login" element={<Login />} />
        <Route path="/app/staff-login" element={<StaffLogin />} />
        <Route path="/app/register" element={<Register />} />
        <Route path="/app/offline" element={<Suspense fallback={<PageLoader />}><OfflinePage /></Suspense>} />

        {/* App shell (with bottom nav + header) */}
        <Route path="/app" element={<Suspense fallback={<PageLoader />}><AppLayout /></Suspense>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<AppPageLoader />}><AppDashboard /></Suspense>} />
          <Route path="history" element={<Suspense fallback={<AppPageLoader />}><AppHistory /></Suspense>} />
          <Route path="admin" element={<Suspense fallback={<AppPageLoader />}><AppAdminDashboard /></Suspense>} />
          <Route path="superuser" element={<Suspense fallback={<AppPageLoader />}><AppSuperUserDashboard /></Suspense>} />
          <Route path="about" element={<Suspense fallback={<AppPageLoader />}><AppAbout /></Suspense>} />
          <Route path="privacy-policy" element={<Suspense fallback={<AppPageLoader />}><AppPrivacyPolicy /></Suspense>} />
          <Route path="terms" element={<Suspense fallback={<AppPageLoader />}><AppTerms /></Suspense>} />
          <Route path="request-deletion" element={<Suspense fallback={<AppPageLoader />}><AppRequestDeletion /></Suspense>} />
          <Route path="my-reports" element={<Suspense fallback={<AppPageLoader />}><AppMyReports /></Suspense>} />
          <Route path="audit-trail" element={<Suspense fallback={<AppPageLoader />}><AppAuditTrail /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<AppPageLoader />}><AppAnalytics /></Suspense>} />
          <Route path="admin-scoping" element={<Suspense fallback={<AppPageLoader />}><AppAdminScoping /></Suspense>} />
          <Route path="deletion-requests" element={<Suspense fallback={<AppPageLoader />}><AppDeletionRequests /></Suspense>} />
        </Route>

        {/* Redirect /app/* unknown to /app/login */}
        <Route path="/app/*" element={<Navigate to="/app/login" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OAuthTokenCapture>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <BrowserRouter>
          <AppRouter />
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </div>
    </ErrorBoundary>
  );
}

export default App;
