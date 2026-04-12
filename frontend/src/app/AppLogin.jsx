import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API, setStoredToken } from '../lib/api'

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const digits = 6
  const arr = value.split('').concat(Array(digits).fill('')).slice(0, digits)

  const handleChange = (i, v) => {
    const clean = v.replace(/\D/g, '').slice(-1)
    const next = arr.map((d, idx) => (idx === i ? clean : d)).join('')
    onChange(next)
    if (clean && i < digits - 1) {
      document.getElementById(`otp-${i + 1}`)?.focus()
    }
  }
  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !arr[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus()
    }
  }
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digits)
    if (pasted) { onChange(pasted); e.preventDefault() }
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {arr.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl bg-slate-800 text-white
            border-slate-600 focus:border-teal-400 focus:outline-none transition-colors"
        />
      ))}
    </div>
  )
}

// ─── AppLogin ─────────────────────────────────────────────────────────────────
export default function AppLogin() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = enter email/phone, 2 = enter OTP
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('vchron_token')
    if (token) navigate('/app/dashboard', { replace: true })
  }, [navigate])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/login/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP')
      setStep(2)
      setResendCooldown(60)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/login/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), otp }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Invalid code')
      setStoredToken(data.access_token || data.token)
      // Redirect based on role
      const role = data.user?.role?.toLowerCase()
      if (role === 'superuser') navigate('/app/superuser', { replace: true })
      else if (role === 'admin') navigate('/app/admin', { replace: true })
      else navigate('/app/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/login/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to resend')
      setResendCooldown(60)
      setOtp('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Splash top */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6">
        <img src="/logo192.png" alt="VChron" className="w-20 h-20 rounded-2xl mb-4 shadow-2xl" />
        <h1 className="text-2xl font-bold text-white mb-1">VChron</h1>
        <p className="text-slate-400 text-sm mb-8">Verified Workforce Intelligence</p>

        <div className="w-full max-w-sm">
          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="you@example.com or +260..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full h-14 px-4 bg-slate-800 border border-slate-600 rounded-xl text-white text-base
                    placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full h-14 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl
                  transition-colors flex items-center justify-center gap-2 text-base"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-teal-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-300 text-sm">
                  Code sent to<br />
                  <span className="text-white font-semibold">{identifier}</span>
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} />

              {error && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-14 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl
                  transition-colors flex items-center justify-center gap-2 text-base"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Verify & Sign In'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError('') }}
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  ← Change
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sm text-teal-400 hover:text-teal-300 disabled:text-slate-500 transition-colors"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer links */}
      <div className="px-6 pb-8 text-center space-y-3">
        <p className="text-slate-500 text-sm">
          Don't have an account?{' '}
          <Link to="/app/register" className="text-teal-400 hover:text-teal-300 font-medium">
            Register
          </Link>
        </p>
        <p className="text-slate-600 text-xs">
          Admin or Superuser?{' '}
          <Link to="/app/staff-login" className="text-slate-400 hover:text-slate-300">
            Staff Login
          </Link>
        </p>
        <p className="text-slate-700 text-xs">
          A product of{' '}
          <span className="text-slate-500 font-medium">GreenWebb Technologies</span>
        </p>
      </div>
    </div>
  )
}
