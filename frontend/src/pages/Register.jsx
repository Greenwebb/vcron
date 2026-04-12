import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { API, authFetch, clearStoredToken, setStoredToken } from '../lib/api'
import PrivacyPolicy from './PrivacyPolicy'
import TermsAndConditions from './TermsAndConditions'

// ─── Searchable Dropdown Component ───────────────────────────────────────────

function SearchableSelect({ label, placeholder, options, value, onChange, disabled, loading, getLabel, getValue }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const getOptionLabel = getLabel || ((o) => (typeof o === 'string' ? o : o.name))
  const getOptionValue = getValue || ((o) => (typeof o === 'string' ? o : o.id))

  const filtered = options.filter((o) =>
    getOptionLabel(o).toLowerCase().includes(query.toLowerCase())
  )

  const selected = options.find((o) => getOptionValue(o) === value)
  const displayValue = selected ? getOptionLabel(selected) : ''

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="space-y-1" ref={ref}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full h-12 px-4 border rounded-xl text-sm transition-all outline-none
            ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 cursor-pointer'}
            ${value ? 'text-slate-900' : 'text-slate-400'}
          `}
          placeholder={disabled ? 'Select previous field first' : placeholder}
          value={open ? query : displayValue}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (!disabled) { setQuery(''); setOpen(true) } }}
          readOnly={!open}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {value && !loading && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
            onClick={(e) => { e.stopPropagation(); onChange(null); setQuery('') }}
          >
            ×
          </button>
        )}
        {open && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">No results found</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={getOptionValue(o)}
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors
                    ${getOptionValue(o) === value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'}
                  `}
                  onClick={() => { onChange(getOptionValue(o)); setQuery(''); setOpen(false) }}
                >
                  {getOptionLabel(o)}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {value && selected && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200">
            ✓ {getOptionLabel(selected)}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  const steps = ['Credentials', 'Verify', 'Setup']
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${done ? 'bg-teal-600 text-white' : active ? 'bg-teal-700 text-white ring-4 ring-teal-100' : 'bg-slate-100 text-slate-400'}
              `}>
                {done ? '✓' : step}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? 'text-teal-700' : done ? 'text-teal-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-1 mb-5 ${done ? 'bg-teal-500' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({ value, onChange }) {
  const inputs = useRef([])
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6)

  function handleKey(e, i) {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i) + value.slice(i + 1)
      onChange(next)
      if (i > 0) inputs.current[i - 1]?.focus()
    } else if (e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      const next = value.slice(0, i) + e.key + value.slice(i + 1)
      onChange(next.slice(0, 6))
      if (i < 5) inputs.current[i + 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
            ${d ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-900'}
            focus:border-teal-500 focus:ring-2 focus:ring-teal-100
          `}
        />
      ))}
    </div>
  )
}

// ─── Main Register Component ──────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAppAuth = useMemo(() => location.pathname.startsWith('/app/'), [location.pathname])
  const loginRoute = isAppAuth ? '/app/login' : '/login'
  const dashboardRoute = isAppAuth ? '/app/dashboard' : '/dashboard'
  const [step, setStep] = useState(() => location.state?.step || 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 state — no password (OTP-only auth for regular users)
  const [creds, setCreds] = useState({ name: '', email: '', phone_number: '' })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(null) // 'privacy' | 'terms' | null

  // Step 2 state
  const [otp, setOtp] = useState('')
  const [setupToken, setSetupToken] = useState(() => location.state?.token || '')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Step 3 state
  const [ministries, setMinistries] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [orgUnits, setOrgUnits] = useState([])
  const [positions, setPositions] = useState([])

  const [selectedMinistry, setSelectedMinistry] = useState(null)
  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedOrgUnit, setSelectedOrgUnit] = useState(null)
  const [selectedPosition, setSelectedPosition] = useState(null)

  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingOrgUnits, setLoadingOrgUnits] = useState(false)

  const ministryObj = ministries.find((m) => m.id === selectedMinistry)
  const unitTerm = ministryObj?.unit_term || 'Facility'

  useEffect(() => {
    let cancelled = false

    const checkSession = async () => {
      try {
        const res = await authFetch(`${API}/auth/me`)
        if (!res.ok) {
          clearStoredToken()
          return
        }

        const data = await res.json()
        const user = data?.user ?? data
        if (!cancelled && user?.user_id && user?.setup_complete) {
          navigate(dashboardRoute, { replace: true })
        }
      } catch {
        clearStoredToken()
      }
    }

    checkSession()
    return () => { cancelled = true }
  }, [dashboardRoute, navigate])

  useEffect(() => {
    if (step !== 3) return
    Promise.all([
      fetch(`${API}/data/ministries`).then((r) => r.json()),
      fetch(`${API}/data/provinces`).then((r) => r.json()),
    ]).then(([mData, pData]) => {
      setMinistries(mData.ministries || [])
      setProvinces(pData.provinces || [])
    }).catch(() => {})
  }, [step])

  useEffect(() => {
    if (!selectedMinistry) { setPositions([]); return }
    fetch(`${API}/data/positions?ministry_id=${selectedMinistry}`)
      .then((r) => r.json())
      .then((d) => setPositions(d.positions || []))
      .catch(() => {})
  }, [selectedMinistry])

  useEffect(() => {
    if (!selectedProvince) { setDistricts([]); setSelectedDistrict(null); setOrgUnits([]); setSelectedOrgUnit(null); return }
    setLoadingDistricts(true)
    fetch(`${API}/data/districts?province_id=${selectedProvince}`)
      .then((r) => r.json())
      .then((d) => { setDistricts(d.districts || []); setLoadingDistricts(false) })
      .catch(() => setLoadingDistricts(false))
  }, [selectedProvince])

  useEffect(() => {
    if (!selectedDistrict || !selectedMinistry) { setOrgUnits([]); setSelectedOrgUnit(null); return }
    setLoadingOrgUnits(true)
    fetch(`${API}/data/org-units?district_id=${selectedDistrict}&ministry_id=${selectedMinistry}`)
      .then((r) => r.json())
      .then((d) => { setOrgUnits(d.org_units || []); setLoadingOrgUnits(false) })
      .catch(() => setLoadingOrgUnits(false))
  }, [selectedDistrict, selectedMinistry])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  async function handleStep1(e) {
    e.preventDefault()
    setError('')
    if (!creds.name || !creds.email || !creds.phone_number) {
      setError('All fields are required'); return
    }
    if (!agreedToTerms) {
      setError('You must agree to the Privacy Policy and Terms & Conditions to continue'); return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/register/step1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: creds.name, email: creds.email, phone_number: creds.phone_number }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Registration failed'); return }
      setResendCooldown(60)
      setStep(2)
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  async function handleStep2(e) {
    e.preventDefault()
    if (otp.length !== 6) { setError('Please enter the complete 6-digit code'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/register/step2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: creds.email, code: otp }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Verification failed'); return }
      setSetupToken(data.setup_token)
      setStoredToken(data.setup_token)
      setStep(3)
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/register/step1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: creds.name, email: creds.email, phone_number: creds.phone_number }),
        credentials: 'include',
      })
      if (res.ok) { setOtp(''); setResendCooldown(60) }
    } catch { setError('Failed to resend. Please try again.') }
    finally { setLoading(false) }
  }

  async function handleStep3(e) {
    e.preventDefault()
    if (!selectedMinistry || !selectedOrgUnit || !selectedPosition) {
      setError('Please complete all required fields'); return
    }
    setError('')
    setLoading(true)
    try {
      const token = setupToken || localStorage.getItem('vchron_token')
      const positionName = positions.find((p) => p.id === selectedPosition)?.name || String(selectedPosition)
      const res = await fetch(`${API}/auth/register/step3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ministry_id: selectedMinistry, org_unit_id: selectedOrgUnit, position: positionName }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Setup failed'); return }
      setStoredToken(data.access_token)
      navigate(dashboardRoute)
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <img src="/logo192.png" alt="VChron" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-2xl font-bold text-teal-800">VChron</span>
          </div>
          <p className="text-slate-500 text-sm">Verified Workforce Intelligence</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
          <StepIndicator current={step} />

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Create your account</h2>
              <p className="text-slate-500 text-sm mb-6">Enter your details to get started</p>
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input type="text" required placeholder="George Munganga"
                    value={creds.name} onChange={(e) => setCreds({ ...creds, name: e.target.value })}
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input type="tel" required placeholder="+260972827372"
                    value={creds.phone_number} onChange={(e) => setCreds({ ...creds, phone_number: e.target.value })}
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" required placeholder="you@example.com"
                    value={creds.email} onChange={(e) => setCreds({ ...creds, email: e.target.value })}
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" />
                </div>

                {/* T&C Checkbox */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-teal-600 cursor-pointer flex-shrink-0"
                  />
                  <label htmlFor="agree-terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                    I have read and agree to the{' '}
                    <button type="button" onClick={() => setShowPolicyModal('privacy')}
                      className="text-teal-600 hover:text-teal-700 font-medium underline">
                      Privacy Policy
                    </button>{' '}and{' '}
                    <button type="button" onClick={() => setShowPolicyModal('terms')}
                      className="text-teal-600 hover:text-teal-700 font-medium underline">
                      Terms &amp; Conditions
                    </button>.
                    I understand that my attendance data will be processed by VChron on behalf of my employer.
                  </label>
                </div>

                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading || !agreedToTerms}
                  className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Continue →'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Verify your account</h2>
                <p className="text-slate-500 text-sm">
                  We've sent a 6-digit code to<br />
                  <span className="font-medium text-slate-700">{creds.email}</span>
                </p>
              </div>
              <form onSubmit={handleStep2} className="space-y-6">
                <OtpInput value={otp} onChange={setOtp} />
                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg text-center">{error}</p>}
                <button type="submit" disabled={loading || otp.length !== 6}
                  className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify Code'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                    className="text-sm text-teal-600 hover:text-teal-700 disabled:text-slate-400 disabled:cursor-not-allowed">
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Complete your profile</h2>
              <p className="text-slate-500 text-sm mb-6">Tell us where you work</p>
              <form onSubmit={handleStep3} className="space-y-4">
                <SearchableSelect
                  label="Ministry"
                  placeholder="Search ministry (e.g. Health, Education)"
                  options={ministries}
                  value={selectedMinistry}
                  onChange={(v) => { setSelectedMinistry(v); setSelectedOrgUnit(null); setSelectedPosition(null) }}
                  getLabel={(o) => o.name}
                  getValue={(o) => o.id}
                />
                <SearchableSelect
                  label="Position / Role"
                  placeholder="Search your position"
                  options={positions}
                  value={selectedPosition}
                  onChange={setSelectedPosition}
                  disabled={!selectedMinistry}
                  getLabel={(o) => o.name}
                  getValue={(o) => o.id}
                />
                <SearchableSelect
                  label="Province"
                  placeholder="Search your province"
                  options={provinces}
                  value={selectedProvince}
                  onChange={(v) => { setSelectedProvince(v); setSelectedDistrict(null); setOrgUnits([]); setSelectedOrgUnit(null) }}
                  getLabel={(o) => o.name}
                  getValue={(o) => o.id}
                />
                <SearchableSelect
                  label="District"
                  placeholder="Search your district"
                  options={districts}
                  value={selectedDistrict}
                  onChange={(v) => { setSelectedDistrict(v); setOrgUnits([]); setSelectedOrgUnit(null) }}
                  disabled={!selectedProvince}
                  loading={loadingDistricts}
                  getLabel={(o) => o.name}
                  getValue={(o) => o.id}
                />
                <SearchableSelect
                  label={unitTerm || 'Facility / School / Office'}
                  placeholder={`Search your ${(unitTerm || 'facility').toLowerCase()}`}
                  options={orgUnits}
                  value={selectedOrgUnit}
                  onChange={setSelectedOrgUnit}
                  disabled={!selectedDistrict || !selectedMinistry}
                  loading={loadingOrgUnits}
                  getLabel={(o) => o.name}
                  getValue={(o) => o.id}
                />
                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading || !selectedMinistry || !selectedOrgUnit || !selectedPosition}
                  className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Complete Registration'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to={loginRoute} className="text-teal-600 hover:text-teal-700 font-medium">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          A product of <span className="font-medium text-slate-500">GreenWebb</span>
        </p>
      </div>

      {/* Policy / T&C Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {showPolicyModal === 'privacy'
              ? <PrivacyPolicy modal onClose={() => setShowPolicyModal(null)} />
              : <TermsAndConditions modal onClose={() => setShowPolicyModal(null)} />
            }
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
              <button
                onClick={() => { setAgreedToTerms(true); setShowPolicyModal(null) }}
                className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors">
                I Agree &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
