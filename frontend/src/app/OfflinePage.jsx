import { useNavigate } from 'react-router-dom'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-teal-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">You're Offline</h1>
        <p className="text-slate-600 text-sm mb-8">
          No internet connection detected. Your attendance data is saved locally and will sync when you're back online.
        </p>
        <button
          onClick={() => { window.location.reload() }}
          className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <button
          onClick={() => navigate('/app/dashboard')}
          className="mt-3 text-slate-600 hover:text-slate-900 text-sm transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
