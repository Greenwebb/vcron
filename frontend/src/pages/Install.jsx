import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Download, Home, Shield, Smartphone, Wifi } from "lucide-react";
import Logo from "@/components/Logo";

const FEATURES = [
  { icon: Smartphone, title: "Quick access", description: "Open VChron directly from your home screen." },
  { icon: Wifi, title: "Offline attendance", description: "Record attendance offline and sync when you reconnect." },
  { icon: Shield, title: "Secure", description: "Your organization controls access to attendance records." },
];

export default function Install() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/app/");
  const loginRoute = isAppRoute ? "/app/login" : "/login";
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(() =>
    window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true
  );
  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setJustInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    setInstalling(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice?.outcome === "accepted") {
        setInstalled(true);
        setJustInstalled(true);
      }
    } finally {
      setPrompt(null);
      setInstalling(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <Logo size="lg" className="mb-4 max-w-[230px]" />
        <p className="mb-8 text-center text-sm text-slate-500">Verified Workforce Intelligence for attendance and shift management.</p>

        <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {installed || justInstalled ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-teal-600" />
              <div>
                <h1 className="text-xl font-semibold text-teal-800">{justInstalled && !installed ? "VChron is installing" : "VChron is installed"}</h1>
                <p className="mt-2 text-sm text-slate-600">Open VChron from your home screen for the app experience.</p>
              </div>
              <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
                <Home className="h-4 w-4" /> Find VChron on your home screen
              </div>
              <button onClick={() => navigate(loginRoute)} className="text-sm text-slate-500 underline underline-offset-4">Continue in this browser</button>
            </div>
          ) : prompt ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <Download className="h-10 w-10 text-teal-600" />
              <div>
                <h1 className="text-xl font-semibold">Install VChron</h1>
                <p className="mt-1 text-sm text-slate-600">Add VChron to your home screen. No app store is required.</p>
              </div>
              <button onClick={handleInstall} disabled={installing} className="w-full rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
                {installing ? "Waiting for browser..." : "Install app"}
              </button>
              <button onClick={() => navigate(loginRoute)} className="text-sm text-slate-500 underline underline-offset-4">Continue in browser</button>
            </div>
          ) : isIOS && isSafari ? (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Smartphone className="h-8 w-8 text-teal-600" />
                <div>
                  <h1 className="text-xl font-semibold">Add to Home Screen</h1>
                  <p className="text-sm text-slate-600">Install VChron on your iPhone or iPad.</p>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3"><span className="font-bold text-teal-700">1.</span><span>Tap Safari's <strong>Share</strong> button.</span></li>
                <li className="flex gap-3"><span className="font-bold text-teal-700">2.</span><span>Choose <strong>Add to Home Screen</strong>.</span></li>
                <li className="flex gap-3"><span className="font-bold text-teal-700">3.</span><span>Tap <strong>Add</strong> to confirm.</span></li>
              </ol>
              <button onClick={() => navigate(loginRoute)} className="mt-5 text-sm text-slate-500 underline underline-offset-4">Continue in Safari</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <Download className="h-10 w-10 text-teal-600" />
              <div>
                <h1 className="text-xl font-semibold">Install VChron</h1>
                <p className="mt-1 text-sm text-slate-600">On Android, open this page in Chrome and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong> from the browser menu. On iPhone or iPad, use Safari's Share menu.</p>
              </div>
              <button onClick={() => navigate(loginRoute)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">
                Open VChron <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        <div className="mt-6 w-full space-y-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
              <div><h2 className="text-sm font-semibold">{title}</h2><p className="text-xs text-slate-500">{description}</p></div>
            </div>
          ))}
        </div>
        <Link className="mt-6 text-sm font-medium text-teal-700 underline underline-offset-4" to={loginRoute}>Return to sign in</Link>
      </div>
    </main>
  );
}
