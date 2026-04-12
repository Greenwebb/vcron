import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  Trash2,
  FileDown,
  UserCheck,
  UserX,
  Settings,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API, authFetch } from "@/lib/api";
import Logo from "@/components/Logo";

// ─── Action metadata ──────────────────────────────────────────────────────────

const ACTION_META = {
  EXPORT_ATTENDANCE_REPORT: { label: "Export Report",       color: "bg-blue-100 text-blue-800",   icon: FileDown },
  EXPORT_USER_LIST:         { label: "Export Users",        color: "bg-blue-100 text-blue-800",   icon: FileDown },
  DOWNLOAD_PDF:             { label: "Download PDF",        color: "bg-blue-100 text-blue-800",   icon: Download },
  DOWNLOAD_SPREADSHEET:     { label: "Download Sheet",      color: "bg-blue-100 text-blue-800",   icon: Download },
  DELETE_USER:              { label: "Delete User",         color: "bg-red-100 text-red-800",     icon: Trash2 },
  APPROVE_DELETION:         { label: "Approve Deletion",    color: "bg-orange-100 text-orange-800", icon: UserX },
  REJECT_DELETION:          { label: "Reject Deletion",     color: "bg-yellow-100 text-yellow-800", icon: UserCheck },
  REQUEST_DELETION:         { label: "Request Deletion",    color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  ASSIGN_ADMIN:             { label: "Assign Admin",        color: "bg-purple-100 text-purple-800", icon: UserCheck },
  REVOKE_ADMIN:             { label: "Revoke Admin",        color: "bg-orange-100 text-orange-800", icon: UserX },
  UPDATE_ADMIN_SCOPE:       { label: "Update Scope",        color: "bg-purple-100 text-purple-800", icon: Settings },
  CREATE_USER:              { label: "Create User",         color: "bg-green-100 text-green-800",  icon: UserCheck },
  UPDATE_USER:              { label: "Update User",         color: "bg-slate-100 text-slate-800",  icon: Settings },
  UPDATE_SHIFT_CONFIG:      { label: "Update Shifts",       color: "bg-teal-100 text-teal-800",    icon: Settings },
  CREATE_MINISTRY:          { label: "Create Ministry",     color: "bg-green-100 text-green-800",  icon: Settings },
  UPDATE_MINISTRY:          { label: "Update Ministry",     color: "bg-slate-100 text-slate-800",  icon: Settings },
  ACTIVATE_MINISTRY:        { label: "Activate Ministry",   color: "bg-green-100 text-green-800",  icon: Settings },
  DEACTIVATE_MINISTRY:      { label: "Deactivate Ministry", color: "bg-orange-100 text-orange-800", icon: Settings },
  CREATE_ORG_UNIT:          { label: "Create Org Unit",     color: "bg-green-100 text-green-800",  icon: Settings },
  UPDATE_ORG_UNIT:          { label: "Update Org Unit",     color: "bg-slate-100 text-slate-800",  icon: Settings },
  DELETE_ORG_UNIT:          { label: "Delete Org Unit",     color: "bg-red-100 text-red-800",      icon: Trash2 },
  STAFF_LOGIN:              { label: "Staff Login",         color: "bg-slate-100 text-slate-700",  icon: Shield },
  STAFF_LOGOUT:             { label: "Staff Logout",        color: "bg-slate-100 text-slate-700",  icon: Shield },
};

const getActionMeta = (action) =>
  ACTION_META[action] || { label: action, color: "bg-slate-100 text-slate-700", icon: Shield };

// ─── Component ────────────────────────────────────────────────────────────────

const AuditTrail = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 25;

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (search)       params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      if (roleFilter)   params.set("role", roleFilter);
      if (dateFrom)     params.set("date_from", dateFrom);
      if (dateTo)       params.set("date_to", dateTo);

      const res = await authFetch(`${API}/superuser/audit?${params}`);
      if (!res.ok) throw new Error("Failed to load audit logs");
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error("Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, roleFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, roleFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / LIMIT);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-ZM", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatMetadata = (meta) => {
    if (!meta) return null;
    return Object.entries(meta)
      .filter(([, v]) => v !== null && v !== undefined && v !== "all")
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(" · ");
  };

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
            <Shield className="w-5 h-5 text-amber-700" />
            <span className="text-sm font-semibold text-amber-700">Audit Trail</span>
            <Badge className="bg-amber-900/40 text-amber-300 border-amber-700 text-xs ml-1">
              Superuser Only
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-900"
            onClick={fetchLogs}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Stats bar */}
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>
            <span className="text-slate-900 font-semibold">{total.toLocaleString()}</span> total events
          </span>
          <span className="text-slate-600">·</span>
          <span>Page {page} of {totalPages || 1}</span>
        </div>

        {/* Filters */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search actor name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Action filter */}
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">All Actions</option>
                {Object.entries(ACTION_META).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="superuser">Superuser</option>
              </select>

              {/* Date range */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-2 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  title="From date"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-2 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  title="To date"
                />
              </div>
            </div>

            {/* Clear filters */}
            {(search || actionFilter || roleFilter || dateFrom || dateTo) && (
              <button
                onClick={() => { setSearch(""); setActionFilter(""); setRoleFilter(""); setDateFrom(""); setDateTo(""); }}
                className="mt-3 text-xs text-teal-400 hover:text-teal-300 underline"
              >
                Clear all filters
              </button>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">Timestamp</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">Actor</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">Role</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">Action</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">Target</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading audit logs…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No audit events found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const meta = getActionMeta(log.action);
                    const Icon = meta.icon;
                    const metaStr = formatMetadata(log.metadata);
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-slate-200/60 hover:bg-slate-100/30 transition-colors"
                      >
                        {/* Timestamp */}
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-xs">
                          {formatDate(log.created_at)}
                        </td>

                        {/* Actor */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-slate-700">{log.actor_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{log.actor_id}</div>
                        </td>

                        {/* Role badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            log.actor_role === "superuser"
                              ? "bg-amber-900/40 text-amber-300"
                              : "bg-purple-900/40 text-purple-300"
                          }`}>
                            {log.actor_role}
                          </span>
                        </td>

                        {/* Action badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.color}`}>
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                        </td>

                        {/* Target */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.target_type && (
                            <div className="text-slate-600 text-xs">
                              <span className="text-slate-500">{log.target_type}</span>
                              {log.target_id && (
                                <span className="ml-1 font-mono text-slate-400">#{log.target_id.slice(0, 8)}</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Details / metadata */}
                        <td className="px-4 py-3 max-w-xs">
                          {metaStr && (
                            <p className="text-xs text-slate-500 truncate" title={metaStr}>
                              {metaStr}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white h-8 w-8 p-0"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white h-8 w-8 p-0"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default AuditTrail;
