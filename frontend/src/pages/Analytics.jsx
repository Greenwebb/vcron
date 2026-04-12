import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { API, authFetch } from "@/lib/api";
import Logo from "@/components/Logo";

// Zambia provinces (static — used for filter dropdown)
const PROVINCES = [
  "Central", "Copperbelt", "Eastern", "Luapula", "Lusaka",
  "Muchinga", "Northern", "North-Western", "Southern", "Western",
];

const PERIOD_OPTIONS = [
  { value: "daily",   label: "Today" },
  { value: "weekly",  label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "custom",  label: "Custom Range" },
];

const PIE_COLORS = {
  early:   "#0d9488", // teal-600
  on_time: "#16a34a", // green-600
  late:    "#dc2626", // red-600
};

// ─── Component ────────────────────────────────────────────────────────────────

const Analytics = () => {
  const navigate = useNavigate();

  // Filter state
  const [period, setPeriod]       = useState("daily");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [province, setProvince]   = useState("");
  const [district, setDistrict]   = useState("");
  const [districts, setDistricts] = useState([]);
  const [facility, setFacility]   = useState("");
  const [facilities, setFacilities] = useState([]);

  // Data state
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  // Late details pagination
  const [latePage, setLatePage] = useState(1);
  const LATE_PAGE_SIZE = 10;

  // ── Load districts when province changes ──────────────────────────────────
  useEffect(() => {
    if (!province) { setDistricts([]); setDistrict(""); setFacilities([]); setFacility(""); return; }
    authFetch(`${API}/superuser/districts?province=${encodeURIComponent(province)}`)
      .then((r) => r.json())
      .then((d) => setDistricts(d.districts || []))
      .catch(() => {});
    setDistrict("");
    setFacilities([]);
    setFacility("");
  }, [province]);

  // ── Load facilities when district changes ─────────────────────────────────
  useEffect(() => {
    if (!district) { setFacilities([]); setFacility(""); return; }
    authFetch(`${API}/superuser/facilities?district=${encodeURIComponent(district)}`)
      .then((r) => r.json())
      .then((d) => setFacilities(d.facilities || []))
      .catch(() => {});
    setFacility("");
  }, [district]);

  // ── Fetch analytics ───────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setLatePage(1);
    try {
      const params = new URLSearchParams();
      if (period !== "custom") params.set("period", period);
      if (period === "custom" && dateFrom) params.set("date_from", dateFrom);
      if (period === "custom" && dateTo)   params.set("date_to",   dateTo);
      if (province) params.set("province", province);
      if (district) params.set("district", district);
      if (facility) params.set("facility", facility);

      const res = await authFetch(`${API}/superuser/analytics?${params}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [period, dateFrom, dateTo, province, district, facility]);

  // Auto-fetch on mount and when period/filters change
  useEffect(() => {
    if (period !== "custom" || (dateFrom && dateTo)) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, period, dateFrom, dateTo]);

  // ── Derived values ────────────────────────────────────────────────────────
  const pieData = data
    ? [
        { name: "Early",   value: data.early.count,   key: "early" },
        { name: "On Time", value: data.on_time.count, key: "on_time" },
        { name: "Late",    value: data.late.count,    key: "late" },
      ].filter((d) => d.value > 0)
    : [];

  const lateDetails = data?.late_details || [];
  const lateTotalPages = Math.ceil(lateDetails.length / LATE_PAGE_SIZE);
  const latePageItems = lateDetails.slice(
    (latePage - 1) * LATE_PAGE_SIZE,
    latePage * LATE_PAGE_SIZE
  );

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-ZM", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-900"
              onClick={() => navigate("/superuser")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <Logo variant="light" size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-700" />
            <span className="text-sm font-semibold text-amber-700">Analytics</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-900"
            onClick={fetchAnalytics}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            {/* Period selector */}
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    period === opt.value
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-slate-100 text-slate-400 border border-slate-200 hover:text-slate-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            {period === "custom" && (
              <div className="flex gap-3 items-center">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-slate-500 text-sm">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={fetchAnalytics}
                  disabled={!dateFrom || !dateTo}
                >
                  Apply
                </Button>
              </div>
            )}

            {/* Geographic filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">All Provinces</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>

              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!province}
                className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
              >
                <option value="">All Districts</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                disabled={!district}
                className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
              >
                <option value="">All Facilities</option>
                {facilities.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {(province || district || facility) && (
              <button
                onClick={() => { setProvince(""); setDistrict(""); setFacility(""); }}
                className="text-xs text-amber-700 hover:text-amber-800 underline"
              >
                Clear geographic filters
              </button>
            )}
          </CardContent>
        </Card>

        {/* ── Summary cards ────────────────────────────────────────────────── */}
        {data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total */}
              <Card className="bg-white border-slate-200">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{data.total_logins}</p>
                      <p className="text-xs text-slate-500">Total Check-ins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Early */}
              <Card className="bg-white border-teal-800/40">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-900/40 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-teal-400">{data.early.percent}%</p>
                      <p className="text-xs text-slate-500">Early ({data.early.count})</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${data.early.percent}%` }} />
                  </div>
                </CardContent>
              </Card>

              {/* On Time */}
              <Card className="bg-white border-green-800/40">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-900/40 rounded-lg">
                      <Clock className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">{data.on_time.percent}%</p>
                      <p className="text-xs text-slate-500">On Time ({data.on_time.count})</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${data.on_time.percent}%` }} />
                  </div>
                </CardContent>
              </Card>

              {/* Late */}
              <Card className="bg-white border-red-800/40">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-900/40 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-400">{data.late.percent}%</p>
                      <p className="text-xs text-slate-500">Late ({data.late.count})</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${data.late.percent}%` }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Charts ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Bar chart — daily breakdown */}
              {data.daily_breakdown?.length > 0 && (
                <Card className="bg-white border-slate-200 lg:col-span-2">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold text-slate-600">Daily Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.daily_breakdown} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          tickFormatter={(d) => d.slice(5)} // MM-DD
                        />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                          labelStyle={{ color: "#e2e8f0" }}
                          itemStyle={{ color: "#cbd5e1" }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                        <Bar dataKey="early"   name="Early"   fill="#0d9488" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="on_time" name="On Time" fill="#16a34a" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="late"    name="Late"    fill="#dc2626" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Pie chart — overall distribution */}
              {pieData.length > 0 && (
                <Card className="bg-white border-slate-200">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold text-slate-600">Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pb-4">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.key} fill={PIE_COLORS[entry.key]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                          itemStyle={{ color: "#cbd5e1" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-1">
                      {pieData.map((entry) => (
                        <div key={entry.key} className="flex items-center gap-1.5 text-xs text-slate-400">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[entry.key] }} />
                          {entry.name}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ── Late details table ─────────────────────────────────────── */}
            {lateDetails.length > 0 && (
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Late Arrivals — {lateDetails.length} records
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Facility</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Shift</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Check-in</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Late By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latePageItems.map((r, i) => (
                        <tr key={i} className="border-b border-slate-200/60 hover:bg-slate-100/30">
                          <td className="px-4 py-3 text-slate-700 font-medium">{r.user_name}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{r.facility}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">
                              {r.shift_type?.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                            {new Date(r.timestamp).toLocaleTimeString("en-ZM")}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold text-red-400 text-sm">
                              {r.late_by}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {lateTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                    <span className="text-xs text-slate-500">
                      {(latePage - 1) * LATE_PAGE_SIZE + 1}–{Math.min(latePage * LATE_PAGE_SIZE, lateDetails.length)} of {lateDetails.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400" disabled={latePage === 1} onClick={() => setLatePage((p) => p - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-slate-600">{latePage} / {lateTotalPages}</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400" disabled={latePage === lateTotalPages} onClick={() => setLatePage((p) => p + 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Empty state */}
            {data.total_logins === 0 && (
              <Card className="bg-white border-slate-200">
                <CardContent className="py-16 text-center text-slate-500">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No attendance records found for the selected period and filters.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Loading state */}
        {loading && !data && (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-16 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              Loading analytics…
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Analytics;
