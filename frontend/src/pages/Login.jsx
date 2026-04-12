import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Phone, ArrowLeft, ShieldCheck } from "lucide-react";
import { API, BACKEND_URL, authFetch, clearStoredToken, setStoredToken } from "@/lib/api";
import Logo from "@/components/Logo";

/**
 * Login — OTP-only for regular users (role: 'user')
 *
 * Step 1: Enter email or phone number → backend sends OTP
 * Step 2: Enter 6-digit OTP → receive access_token → redirect to dashboard
 *
 * Admin/Superuser use /staff-login (password-based).
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAppAuth = useMemo(() => location.pathname.startsWith("/app/"), [location.pathname]);
  const registerRoute = isAppAuth ? "/app/register" : "/register";
  const staffLoginRoute = isAppAuth ? "/app/staff-login" : "/staff-login";
  const dashboardRoute = isAppAuth ? "/app/dashboard" : "/dashboard";
  const adminRoute = isAppAuth ? "/app/admin" : "/admin";
  const superuserRoute = isAppAuth ? "/app/superuser" : "/superuser";
  const homeRoute = isAppAuth ? "/install" : "/";

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
          navigate(dashboardRoute, { replace: true });
        }
      } catch {
        clearStoredToken();
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [adminRoute, dashboardRoute, navigate, superuserRoute]);

  // "request" = entering identifier, "verify" = entering OTP
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ─── OTP input helpers ────────────────────────────────────────────────────

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  // ─── Step 1: Request OTP ──────────────────────────────────────────────────

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setMaskedEmail(data.masked_email || identifier);
        setStep("verify");
        startResendCooldown();
        toast.success("A verification code has been sent.");
      } else {
        toast.error(data.detail || "Could not send code. Please try again.");
      }
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ───────────────────────────────────────────────────

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), code }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setStoredToken(data.access_token);
        toast.success(`Welcome back, ${data.user.name?.split(" ")[0]}!`);
        if (!data.user.setup_complete) {
          navigate(registerRoute, { state: { step: 3, token: data.access_token } });
        } else {
          navigate(dashboardRoute);
        }
      } else {
        toast.error(data.detail || "Invalid code. Please try again.");
      }
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend cooldown ──────────────────────────────────────────────────────

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
        credentials: "include",
      });
      if (res.ok) {
        setOtp(["", "", "", "", "", ""]);
        startResendCooldown();
        toast.success("A new code has been sent.");
      } else {
        toast.error("Could not resend code.");
      }
    } catch {
      toast.error("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="text-slate-600"
          onClick={() => step === "verify" ? setStep("request") : navigate(homeRoute)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === "verify" ? "Back" : "Home"}
        </Button>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-200 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <Logo variant="dark" size="lg" />
            </div>
            {step === "request" ? (
              <>
                <CardTitle className="text-2xl font-bold font-['Manrope'] text-slate-900">
                  Sign In
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Enter your email or phone number to receive a sign-in code
                </CardDescription>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-2">
                  <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-teal-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold font-['Manrope'] text-slate-900">
                  Enter Your Code
                </CardTitle>
                <CardDescription className="text-slate-500">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-slate-700">{maskedEmail}</span>
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">

            {/* ── Step 1: Identifier input ── */}
            {step === "request" && (
              <>
                <Button
                  variant="outline"
                  className="w-full h-12 border-slate-200 hover:bg-slate-50"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative flex items-center">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="px-3 text-sm text-slate-400">or</span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Email or Phone Number</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="+260 9XX XXX XXX or you@example.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="pl-10 h-12 border-slate-200"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white rounded-xl"
                    disabled={loading || !identifier.trim()}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Send Code"
                    )}
                  </Button>
                </form>

                <p className="text-center text-sm text-slate-500">
                  Don't have an account?{" "}
                  <Link to={registerRoute} className="text-teal-600 hover:text-teal-700 font-medium">
                    Create account
                  </Link>
                </p>

                <p className="text-center text-xs text-slate-400">
                  Admin or Superuser?{" "}
                  <Link to={staffLoginRoute} className="text-slate-500 hover:text-slate-700 underline">
                    Staff login
                  </Link>
                </p>
              </>
            )}

            {/* ── Step 2: OTP input ── */}
            {step === "verify" && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white rounded-xl"
                  disabled={loading || otp.join("").length !== 6}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>

                <p className="text-center text-sm text-slate-500">
                  Didn't receive a code?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className={`font-medium ${resendCooldown > 0 ? "text-slate-400 cursor-not-allowed" : "text-teal-600 hover:text-teal-700 cursor-pointer"}`}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </p>
              </form>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
