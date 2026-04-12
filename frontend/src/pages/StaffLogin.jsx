import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, ArrowLeft, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { API, authFetch, clearStoredToken, setStoredToken } from "@/lib/api";
import Logo from "@/components/Logo";

/**
 * StaffLogin — Password-based login for Admin and Superuser roles only.
 *
 * Route: /staff-login
 * API:   POST /api/auth/staff/login
 *
 * Regular users (role: 'user') are redirected to /login (OTP-based).
 */
const StaffLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAppAuth = useMemo(() => location.pathname.startsWith("/app/"), [location.pathname]);
  const loginRoute = isAppAuth ? "/app/login" : "/login";
  const adminRoute = isAppAuth ? "/app/admin" : "/admin";
  const superuserRoute = isAppAuth ? "/app/superuser" : "/superuser";
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const res = await authFetch(`${API}/auth/me`);
        if (!res.ok) {
          clearStoredToken();
          return;
        }

        const data = await res.json();
        const user = data?.user ?? data;
        if (cancelled || !user?.user_id) return;

        if (user.role === "superuser") {
          navigate(superuserRoute, { replace: true });
        } else if (user.role === "admin") {
          navigate(adminRoute, { replace: true });
        } else {
          navigate(loginRoute, { replace: true });
        }
      } catch {
        clearStoredToken();
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [adminRoute, loginRoute, navigate, superuserRoute]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/staff/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setStoredToken(data.access_token);
        toast.success(`Welcome, ${data.user.name?.split(" ")[0]}!`);

        const role = data.user.role;
        if (role === "superuser") {
          navigate(superuserRoute);
        } else if (role === "admin") {
          navigate(adminRoute);
        } else {
          // Should not happen — backend blocks non-staff, but handle gracefully
          toast.error("This login is for staff only.");
          clearStoredToken();
        }
      } else {
        // If backend says "use employee login", redirect them
        if (res.status === 403) {
          toast.error("This login is for staff only. Please use the employee login.");
          navigate(loginRoute);
        } else {
          toast.error(data.detail || "Invalid email or password");
        }
      }
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          onClick={() => navigate(loginRoute)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Employee Login
        </Button>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-100 border-slate-200 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <Logo variant="dark" size="lg" />
            </div>

            {/* Staff badge */}
            <div className="flex justify-center mb-3">
              <div className="flex items-center gap-2 bg-amber-100 border border-amber-200 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full">
                <ShieldAlert className="w-3.5 h-3.5" />
                Staff Access Only
              </div>
            </div>

            <CardTitle className="text-2xl font-bold font-['Manrope'] text-slate-900">
              Staff Login
            </CardTitle>
            <CardDescription className="text-slate-400">
              For Administrators and Superusers only
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@vcron.cloud"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-600">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold mt-2"
                disabled={loading || !formData.email || !formData.password}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-slate-500 pt-2">
              Not a staff member?{" "}
              <Link to={loginRoute} className="text-teal-600 hover:text-teal-700">
                Employee login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffLogin;
