/**
 * AppRegister — Mobile-first 3-step registration wizard for /app/register
 * Step 1: Credentials (name, phone, email) + T&C checkbox
 * Step 2: OTP verification
 * Step 3: Complete setup (ministry, position, province, district, org unit)
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Check } from 'lucide-react'
import { API, setStoredToken } from '../lib/api'

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepDots({ current }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className={`rounded-full transition-all ${
          s < current ? 'w-6 h-2 bg-teal-500' :
          s === current ? 'w-8 h-2 bg-teal-400' :
          'w-2 h-2 bg-slate-600'
        }`} />
      ))}
    </div>
  )
}

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const digits = 6
  const arr = value.split('').concat(Array(digits).fill('')).slice(0, digits)
  const handleChange = (i, v) => {
    const clean = v.replace(/\D/g, '').slice(-1)
    const next = arr.map((d, idx) => (idx === i ? clean : d)).join('')
    onChange(next)
    if (clean && i < digits - 1) document.getElementById(`reg-otp-${i + 1}`)?.focus()
  }
  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !arr[i] && i > 0) document.getElementById(`reg-otp-${i - 1}`)?.focus()
  }
  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digits)
    if (p) { onChange(p); e.preventDefault() }
  }
  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {arr.map((d, i) => (
        <input key={i} id={`reg-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKey(i, e)}
          className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl bg-slate-800 text-white
            border-slate-600 focus:border-teal-400 focus:outline-none transition-colors" />
      ))}
    </div>
  )
}

// ─── Searchable Select ────────────────────────────────────────────────────────
function SearchableSelect({ label, placeholder, options, value, onChange, disabled, loading, getLabel, getValue }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const getL = getLabel || ((o) => (typeof o === 'string' ? o : o.name))
  const getV = getValue || ((o) => (typeof o === 'string' ? o : o.id))
  const filtered = options.filter((o) => getL(o).toLowerCase().includes(query.toLowerCase()))
  const selected = options.find((o) => getV(o) === value)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className="space-y-1" ref={ref}>
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full h-14 px-4 border-2 rounded-xl text-base transition-all outline-none
            ${disabled ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border-slate-700'
              : 'bg-slate-800 border-slate-600 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 cursor-pointer text-white'}
            ${value && !open ? 'text-teal-300 font-medium' : ''}`}
          placeholder={disabled ? 'Select previous field first' : placeholder}
          value={open ? query : (selected ? getL(selected) : '')}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (!disabled) { setQuery(''); setOpen(true) } }}
          readOnly={!open}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        )}
        {value && !open && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {open && filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
            {filtered.map((o) => (
              <button key={getV(o)} type="button"
                className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700 transition-colors
                  ${getV(o) === value ? 'text-teal-400 bg-slate-700/50' : 'text-slate-200'}`}
                onMouseDown={() => { onChange(getV(o)); setOpen(false); setQuery('') }}>
                {getL(o)}
              </button>
            ))}
          </div>
        )}
        {open && filtered.length === 0 && !loading && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl p-3 text-slate-400 text-sm text-center">
            No results found
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AppRegister() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [creds, setCreds] = useState({ name: '', phone_number: '', email: '' })
  const [otp, setOtp] = useState('')
  const [setupToken, setSetupToken] = useState('')
  const [setup, setSetup] = useState({ ministry_id: '', position_id: '', province_id: '', district_id: '', org_unit_id: '' })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Data lists
  const [ministries, setMinistries] = useState([])
  const [positions, setPositions] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [orgUnits, setOrgUnits] = useState([])

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // Load ministries and provinces on step 3
  useEffect(() => {
    if (step !== 3) return
    fetch(`${API}/data/ministries`).then((r) => r.json()).then((d) => setMinistries(d.ministries || []))
    fetch(`${API}/data/provinces`).then((r) => r.json()).then((d) => setProvinces(d.provinces || []))
  }, [step])

  // Load positions when ministry selected
  useEffect(() => {
    if (!setup.ministry_id) { setPositions([]); return }
    fetch(`${API}/data/positions?ministry_id=${setup.ministry_id}`)
      .then((r) => r.json()).then((d) => setPositions(d.positions || []))
  }, [setup.ministry_id])

  // Load districts when province selected
  useEffect(() => {
    if (!setup.province_id) { setDistricts([]); return }
    fetch(`${API}/data/districts?province_id=${setup.province_id}`)
      .then((r) => r.json()).then((d) => setDistricts(d.districts || []))
  }, [setup.province_id])

  // Load org units when district + ministry selected
  useEffect(() => {
    if (!setup.district_id || !setup.ministry_id) { setOrgUnits([]); return }
    fetch(`${API}/data/org-units?district_id=${setup.district_id}&ministry_id=${setup.ministry_id}`)
      .then((r) => r.json()).then((d) => setOrgUnits(d.org_units || []))
  }, [setup.district_id, setup.ministry_id])

  // Get unit term label from selected ministry
  const selectedMinistry = ministries.find((m) => m.id === setup.ministry_id)
  const unitTerm = selectedMinistry?.unit_term || 'Facility'

  const handleStep1 = async (e) => {
    e.preventDefault()
    if (!agreedToTerms) { setError('Please accept the Terms & Conditions to continue.'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch(`${API}/auth/register/step1`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')
      setStep(2); setResendCooldown(60)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setError(''); setLoading(true)
    try {
      const res = await fetch(`${API}/auth/register/step2`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: creds.email, otp }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Invalid code')
      setSetupToken(data.setup_token); setStep(3)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleStep3 = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch(`${API}/auth/register/step3`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setup_token: setupToken, ...setup }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Setup failed')
      setStoredToken(data.access_token || data.token || data.setup_token)
      navigate('/app/dashboard', { replace: true })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4 gap-3">
        {step > 1 ? (
          <button onClick={() => { setStep(step - 1); setError('') }}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link to="/app/login" className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="flex items-center gap-2">
          <img src="/logo192.png" alt="VChron" className="w-7 h-7 rounded-lg" />
          <span className="text-white font-semibold text-sm">Create Account</span>
        </div>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        <StepDots current={step} />

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Your Details</h2>
              <p className="text-slate-400 text-sm mb-5">Enter your personal information to get started</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input type="text" required placeholder="George Munganga"
                value={creds.name} onChange={(e) => setCreds({ ...creds, name: e.target.value })}
                className="w-full h-14 px-4 bg-slate-800 border-2 border-slate-600 rounded-xl text-white text-base placeholder-slate-500 focus:border-teal-400 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
              <input type="tel" required placeholder="+260972827372"
                value={creds.phone_number} onChange={(e) => setCreds({ ...creds, phone_number: e.target.value })}
                className="w-full h-14 px-4 bg-slate-800 border-2 border-slate-600 rounded-xl text-white text-base placeholder-slate-500 focus:border-teal-400 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input type="email" required placeholder="you@example.com"
                value={creds.email} onChange={(e) => setCreds({ ...creds, email: e.target.value })}
                className="w-full h-14 px-4 bg-slate-800 border-2 border-slate-600 rounded-xl text-white text-base placeholder-slate-500 focus:border-teal-400 focus:outline-none transition-all" />
            </div>

            {/* T&C */}
            <div className="flex items-start gap-3 p-4 bg-slate-800 rounded-xl border border-slate-600">
              <input type="checkbox" id="agree" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-teal-500 cursor-pointer flex-shrink-0" />
              <label htmlFor="agree" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                I agree to the{' '}
                <Link to="/app/privacy-policy" className="text-teal-400 underline">Privacy Policy</Link>
                {' '}and{' '}
                <Link to="/app/terms" className="text-teal-400 underline">Terms & Conditions</Link>.
                I understand my attendance data will be processed by VChron on behalf of my employer.
              </label>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading || !agreedToTerms}
              className="w-full h-14 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-base">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Continue →'}
            </button>

            <p className="text-center text-slate-500 text-sm">
              Already have an account?{' '}
              <Link to="/app/login" className="text-teal-400 hover:text-teal-300">Sign in</Link>
            </p>
          </form>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Verify Your Account</h2>
              <p className="text-slate-400 text-sm">
                We've sent a 6-digit code to<br />
                <span className="text-white font-semibold">{creds.email}</span>
              </p>
            </div>

            <OtpInput value={otp} onChange={setOtp} />

            {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg text-center">{error}</p>}

            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full h-14 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-base">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify →'}
            </button>

            <div className="flex justify-between items-center">
              <p className="text-slate-500 text-sm">Didn't receive it?</p>
              <button type="button" onClick={async () => {
                if (resendCooldown > 0) return
                setLoading(true)
                await fetch(`${API}/auth/register/step1`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(creds),
                  credentials: 'include',
                })
                setResendCooldown(60); setOtp(''); setLoading(false)
              }} disabled={resendCooldown > 0}
                className="text-sm text-teal-400 hover:text-teal-300 disabled:text-slate-500 transition-colors">
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Complete Your Profile</h2>
              <p className="text-slate-400 text-sm mb-5">Tell us where you work</p>
            </div>

            <SearchableSelect label="Ministry" placeholder="Search ministry..."
              options={ministries} value={setup.ministry_id}
              onChange={(v) => setSetup({ ...setup, ministry_id: v, position_id: '', org_unit_id: '' })}
              getLabel={(o) => o.name} getValue={(o) => o.id} />

            <SearchableSelect label="Position / Job Title" placeholder="Search your position..."
              options={positions} value={setup.position_id}
              onChange={(v) => setSetup({ ...setup, position_id: v })}
              disabled={!setup.ministry_id} loading={setup.ministry_id && positions.length === 0}
              getLabel={(o) => o.title} getValue={(o) => o.id} />

            <SearchableSelect label="Province" placeholder="Search province..."
              options={provinces} value={setup.province_id}
              onChange={(v) => setSetup({ ...setup, province_id: v, district_id: '', org_unit_id: '' })}
              getLabel={(o) => o.name} getValue={(o) => o.id} />

            <SearchableSelect label="District" placeholder="Search district..."
              options={districts} value={setup.district_id}
              onChange={(v) => setSetup({ ...setup, district_id: v, org_unit_id: '' })}
              disabled={!setup.province_id} loading={setup.province_id && districts.length === 0}
              getLabel={(o) => o.name} getValue={(o) => o.id} />

            <SearchableSelect label={unitTerm} placeholder={`Search ${unitTerm.toLowerCase()}...`}
              options={orgUnits} value={setup.org_unit_id}
              onChange={(v) => setSetup({ ...setup, org_unit_id: v })}
              disabled={!setup.district_id || !setup.ministry_id}
              loading={setup.district_id && setup.ministry_id && orgUnits.length === 0}
              getLabel={(o) => o.name} getValue={(o) => o.id} />

            {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit"
              disabled={loading || !setup.ministry_id || !setup.position_id || !setup.province_id || !setup.district_id || !setup.org_unit_id}
              className="w-full h-14 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-base mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Complete Registration ✓'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
