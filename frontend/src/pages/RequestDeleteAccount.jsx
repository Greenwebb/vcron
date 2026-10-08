import { useCallback, useEffect, useState } from "react";
import { API, authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function RequestDeleteAccount() {
  const [status, setStatus] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${API}/user/deletion-request/status`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to load request status.");
      setStatus(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadStatus(); }, [loadStatus]);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await authFetch(`${API}/user/request-deletion`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to submit request.");
      setMessage(data.message); await loadStatus();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return (
    <section className="mx-auto max-w-2xl space-y-5 p-6 text-slate-900">
      <h1 className="text-2xl font-bold">Request account deletion</h1>
      <p className="text-slate-600">Submit a request for your administrator to review.</p>
      {loading && <p role="status">Loading request status…</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {message && <p role="status" className="text-teal-700">{message}</p>}
      {status?.has_request && <p>Latest request: <strong>{status.status}</strong></p>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block" htmlFor="deletion-reason">Reason (optional)</label>
        <Textarea id="deletion-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button disabled={loading || saving || !status || status?.status === "pending"} type="submit">
          {saving ? "Submitting…" : "Submit deletion request"}
        </Button>
      </form>
    </section>
  );
}
