import { useCallback, useEffect, useState } from "react";
import { API, authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

async function downloadReport(response, filename) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Unable to download report.");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link);
  link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("monthly");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await authFetch(`${API}/reports/my?page=${page}&limit=20`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to load reports.");
      setReports(data.reports || []); setTotal(data.total || 0);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { load(); }, [load]);
  const runDownload = async (id) => {
    setBusy(true); setError("");
    try {
      const response = id
        ? await authFetch(`${API}/reports/download/${encodeURIComponent(id)}`)
        : await authFetch(`${API}/reports/generate`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period_type: period, send_email: false }),
        });
      await downloadReport(response, "VChron_Report.pdf");
      if (!id) await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return (
    <section className="mx-auto max-w-3xl space-y-5 p-6 text-slate-900">
      <h1 className="text-2xl font-bold">My reports</h1>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="report-period">Period</label>
        <select id="report-period" className="rounded-md border border-slate-300 bg-white p-2" value={period} onChange={(event) => setPeriod(event.target.value)}>
          <option value="daily">Today</option><option value="weekly">This week</option><option value="monthly">This month</option>
        </select>
        <Button disabled={busy} onClick={() => runDownload()}>Generate PDF</Button>
      </div>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {loading ? <p role="status">Loading reports…</p> : reports.length === 0 ? <p className="text-slate-600">No reports yet.</p> : <ul className="space-y-3">
        {reports.map((report) => <li key={report.report_id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
          <div><p className="font-medium">{report.period_label}</p><p className="text-sm text-slate-500">{report.record_count} records</p></div>
          <Button variant="outline" disabled={busy} onClick={() => runDownload(report.report_id)}>Download</Button>
        </li>)}
      </ul>}
      <div className="flex items-center gap-3">
        <Button variant="outline" disabled={loading || page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
        <span>Page {page}</span>
        <Button variant="outline" disabled={loading || page * 20 >= total} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </section>
  );
}
