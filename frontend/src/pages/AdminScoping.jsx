import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Shield,
  Building2,
  MapPin,
  Search,
  ChevronDown,
  Check,
  RefreshCw,
  Globe,
  Edit2,
  X,
  Map,
  Hospital,
} from "lucide-react";
import { API, authFetch } from "@/lib/api";
import Logo from "@/components/Logo";

const PROVINCES = [
  "Central", "Copperbelt", "Eastern", "Luapula", "Lusaka",
  "Muchinga", "Northern", "North-Western", "Southern", "Western",
];

const SCOPE_TYPE_ICONS = {
  national: Globe,
  province: Map,
  district: MapPin,
  facility: Hospital,
};

const SCOPE_TYPES = [
  { value: "national",  label: "National",  Icon: Globe,    desc: "Access to all data across all provinces" },
  { value: "province",  label: "Province",  Icon: Map,      desc: "Access limited to a specific province" },
  { value: "district",  label: "District",  Icon: MapPin,   desc: "Access limited to a specific district" },
  { value: "facility",  label: "Facility",  Icon: Hospital, desc: "Access limited to a specific facility" },
];

// ─── Scope badge ──────────────────────────────────────────────────────────────
const ScopeBadge = ({ jurisdiction }) => {
  if (!jurisdiction) return <Badge variant="outline" className="text-slate-500 border-slate-200">Not Set</Badge>;
  const { type, value } = jurisdiction;
  const colors = {
    national: "bg-purple-100 text-purple-700 border-purple-200",
    province: "bg-blue-100 text-blue-700 border-blue-200",
    district: "bg-teal-100 text-teal-700 border-teal-200",
    facility: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <Badge className={`${colors[type] || ""} border text-xs capitalize`}>
      {type === "national" ? "National" : `${type}: ${value}`}
    </Badge>
  );
};

// ─── Edit scope modal ─────────────────────────────────────────────────────────
const EditScopeModal = ({ admin, ministries, onClose, onSave }) => {
  const [scopeType, setScopeType]     = useState(admin.assigned_jurisdiction?.type || "national");
  const [scopeValue, setScopeValue]   = useState(admin.assigned_jurisdiction?.value || "");
  const [ministryId, setMinistryId]   = useState(admin.ministry_id || "");
  const [districts, setDistricts]     = useState([]);
  const [facilities, setFacilities]   = useState([]);
  const [province, setProvince]       = useState("");
  const [saving, setSaving]           = useState(false);

  // Load districts when province is selected (for district/facility scope)
  useEffect(() => {
    if (scopeType === "district" || scopeType === "facility") {
      const prov = scopeType === "district" ? scopeValue.split(" / ")[0] : province;
      if (!prov) return;
      authFetch(`${API}/superuser/districts?province=${encodeURIComponent(prov)}`)
        .then((r) => r.json())
        .then((d) => setDistricts(d.districts || []))
        .catch(() => {});
    }
  }, [scopeType, province, scopeValue]);

  // Load facilities when district is selected
  useEffect(() => {
    if (scopeType === "facility" && scopeValue) {
      authFetch(`${API}/superuser/facilities?district=${encodeURIComponent(scopeValue)}`)
        .then((r) => r.json())
        .then((d) => setFacilities(d.facilities || []))
        .catch(() => {});
    }
  }, [scopeType, scopeValue]);

  const handleSave = async () => {
    if (scopeType !== "national" && !scopeValue) {
      toast.error("Please select a scope value");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`${API}/superuser/admins/${admin.user_id}/scope`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ministry_id: ministryId || null,
          scope_type: scopeType,
          scope_value: scopeType === "national" ? "all" : scopeValue,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to save");
      }
      const updated = await res.json();
      toast.success(`Scope updated for ${admin.name}`);
      onSave(updated);
    } catch (e) {
      toast.error(e.message || "Failed to update scope");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Edit Admin Scope</h2>
            <p className="text-xs text-slate-400 mt-0.5">{admin.name} · {admin.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Ministry assignment */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Assigned Ministry</label>
            <select
              value={ministryId}
              onChange={(e) => setMinistryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">No specific ministry (all)</option>
              {ministries.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Scope type */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Geographic Scope</label>
            <div className="grid grid-cols-2 gap-2">
              {SCOPE_TYPES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setScopeType(s.value); setScopeValue(""); setProvince(""); }}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    scopeType === s.value
                      ? "bg-amber-50 border-amber-400 text-amber-700"
                      : "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-900"
                  }`}
                >
                  <s.Icon className="w-4 h-4 mb-0.5" />
                  <div className="text-xs font-medium">{s.label}</div>
                  <div className="text-xs opacity-60 leading-tight">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Province selector */}
          {(scopeType === "province" || scopeType === "district" || scopeType === "facility") && (
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Province</label>
              <select
                value={scopeType === "province" ? scopeValue : province}
                onChange={(e) => {
                  if (scopeType === "province") setScopeValue(e.target.value);
                  else { setProvince(e.target.value); setScopeValue(""); }
                }}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Select province…</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {/* District selector */}
          {(scopeType === "district" || scopeType === "facility") && (
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">District</label>
              <select
                value={scopeType === "district" ? scopeValue : scopeValue}
                onChange={(e) => setScopeValue(e.target.value)}
                disabled={!province && !districts.length}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
              >
                <option value="">Select district…</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {/* Facility selector */}
          {scopeType === "facility" && (
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Facility / School</label>
              <select
                value={scopeValue}
                onChange={(e) => setScopeValue(e.target.value)}
                disabled={!facilities.length}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
              >
                <option value="">Select facility…</option>
                {facilities.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-200">
          <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 hover:text-slate-900" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Save Scope
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const AdminScoping = () => {
  const navigate = useNavigate();
  const [admins, setAdmins]         = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [editAdmin, setEditAdmin]   = useState(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API}/superuser/admins`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAdmins(data.admins || []);
      setMinistries(data.ministries || []);
    } catch {
      toast.error("Failed to load admin list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleScopeUpdated = (updated) => {
    setAdmins((prev) =>
      prev.map((a) => a.user_id === updated.user_id ? { ...a, ...updated } : a)
    );
    setEditAdmin(null);
  };

  const filtered = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
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
            <span className="text-sm font-semibold text-amber-700">Admin Scoping</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-900"
            onClick={fetchAdmins}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Intro */}
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-4 pb-4 px-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-900/30 rounded-lg mt-0.5">
                <Globe className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Ministry & Geographic Scope Assignment</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Assign each administrator to a specific ministry and limit their data access to a
                  national, province, district, or facility level. Admins will only see attendance
                  data within their assigned scope.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search admins by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Admin list */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            Loading admins…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No admins found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((admin) => (
              <Card key={admin.user_id} className="bg-white border-slate-200 hover:border-slate-200 transition-colors">
                <CardContent className="pt-4 pb-4 px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-amber-700">
                          {admin.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-900 text-sm">{admin.name}</p>
                          <Badge
                            className={`text-xs capitalize ${
                              admin.role === "superuser"
                                ? "bg-purple-900/40 text-purple-300 border-purple-700/40"
                                : "bg-blue-900/40 text-blue-300 border-blue-700/40"
                            } border`}
                          >
                            {admin.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{admin.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {admin.ministry_name ? (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Building2 className="w-3 h-3" />
                              <span>{admin.ministry_name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Building2 className="w-3 h-3" />
                              <span>No ministry</span>
                            </div>
                          )}
                          <span className="text-slate-700">·</span>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <MapPin className="w-3 h-3" />
                            <ScopeBadge jurisdiction={admin.assigned_jurisdiction} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex-shrink-0"
                      onClick={() => setEditAdmin(admin)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Edit Scope
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Edit modal */}
      {editAdmin && (
        <EditScopeModal
          admin={editAdmin}
          ministries={ministries}
          onClose={() => setEditAdmin(null)}
          onSave={handleScopeUpdated}
        />
      )}
    </div>
  );
};

export default AdminScoping;
