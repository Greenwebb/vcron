import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

export default function Install() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true);
  useEffect(() => {
    const beforeInstall = (event) => { event.preventDefault(); setPrompt(event); };
    const afterInstall = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", afterInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", afterInstall);
    };
  }, []);
  const install = async () => {
    if (!prompt) return;
    try { await prompt.prompt(); await prompt.userChoice; } finally { setPrompt(null); }
  };
  return (
    <main className="mx-auto max-w-xl space-y-6 p-6 text-slate-900">
      <Logo size="lg" />
      <h1 className="text-2xl font-bold">Install VChron</h1>
      {installed ? <p>VChron is already installed.</p> : <>
        <p className="text-slate-600">Add VChron to your home screen for quick access.</p>
        {prompt ? <Button onClick={install}>Install app</Button> : <p className="text-slate-600">Open your browser menu and select Install app or Add to Home Screen. On iPhone or iPad, open this site in Safari and choose Share, then Add to Home Screen.</p>}
      </>}
      <Link className="block font-medium text-teal-700 underline" to="/app">Open VChron</Link>
    </main>
  );
}
