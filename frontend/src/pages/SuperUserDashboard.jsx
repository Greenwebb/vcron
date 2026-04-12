import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Users, Activity, Download, Search, Shield, Building2,
  Edit, Trash2, KeyRound, UserPlus, Clock, Settings, BarChart3,
  ChevronRight, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Plus,
  Landmark, Network, ChevronDown, User2, Phone, Mail, X, CalendarDays, ExternalLink, ClipboardList,
  Hospital, Truck, Presentation
} from "lucide-react";
import { API, authFetch } from "@/lib/api";
import Logo from "@/components/Logo";

const SuperUserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Check superuser access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await authFetch(`${API}/auth/me`, { });
        if (res.ok) {
          const user = await res.json();
          if (user.role !== "superuser") {
            toast.error("Super User access required");
            navigate("/dashboard");
            return;
          }
          setCurrentUser(user);
        } else {
          navigate("/login");
        }
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAccess();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100" data-testid="su-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Logo variant="dark" size="sm" />
              <span className="text-xs text-slate-500 hidden sm:block">{currentUser?.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs"
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs"
              onClick={() => navigate('/admin-scoping')}
            >
              <Building2 className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Admin Scope</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 text-xs"
              onClick={() => navigate('/audit-trail')}
            >
              <Shield className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Audit Trail</span>
            </Button>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">SUPERUSER</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 grid grid-cols-7 w-full max-w-4xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800" data-testid="su-tab-overview">
              <BarChart3 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800" data-testid="su-tab-users">
              <Users className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="facilities" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800" data-testid="su-tab-facilities">
              <Building2 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Facilities</span>
            </TabsTrigger>
            <TabsTrigger value="shifts" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800" data-testid="su-tab-shifts">
              <Clock className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Shifts</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800" data-testid="su-tab-reports">
              <Activity className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="ministries" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800" data-testid="su-tab-ministries">
              <Landmark className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Ministries</span>
            </TabsTrigger>
            <TabsTrigger value="org-tree" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800" data-testid="su-tab-org-tree">
              <Network className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Org Tree</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="users"><UsersTab currentUser={currentUser} /></TabsContent>
          <TabsContent value="facilities"><FacilitiesTab /></TabsContent>
          <TabsContent value="shifts"><ShiftsTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
          <TabsContent value="ministries"><MinistriesTab /></TabsContent>
          <TabsContent value="org-tree"><OrgTreeTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// ============ OVERVIEW TAB ============
const OverviewTab = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authFetch(`${API}/superuser/stats`, { });
        if (res.ok) setStats(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, []);

  const topCards = [
    { label: "Total Users", value: stats?.total_users || 0, icon: Users, color: "text-blue-700", bg: "bg-blue-100" },
    { label: "Admins", value: stats?.total_admins || 0, icon: Shield, color: "text-emerald-700", bg: "bg-emerald-100" },
    { label: "Super Users", value: stats?.total_superusers || 0, icon: Shield, color: "text-amber-800", bg: "bg-amber-100" },
    { label: "Facilities", value: stats?.total_facilities || 0, icon: Building2, color: "text-purple-700", bg: "bg-purple-100" },
    { label: "Today's Logins", value: stats?.today_logins || 0, icon: Activity, color: "text-teal-700", bg: "bg-teal-100" },
    { label: "Currently On Duty", value: stats?.currently_on_duty || 0, icon: Clock, color: "text-green-700", bg: "bg-green-100" },
  ];

  return (
    <div className="space-y-6" data-testid="su-overview">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {topCards.map((c) => (
          <Card key={c.label} className="bg-white border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{c.label}</p>
                  <p className={`text-3xl font-bold font-['Manrope'] ${c.color}`}>{c.value}</p>
                </div>
                <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <c.icon className={`w-6 h-6 ${c.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's punctuality breakdown */}
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3">Today's Punctuality</p>
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Late Today</p>
                  <p className="text-3xl font-bold font-['Manrope'] text-red-600">{stats?.today_late ?? 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600">On Time Today</p>
                  <p className="text-3xl font-bold font-['Manrope'] text-emerald-600">{stats?.today_on_time ?? 0}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-sky-50 border-sky-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-sky-600">Early Today</p>
                  <p className="text-3xl font-bold font-['Manrope'] text-sky-600">{stats?.today_early ?? 0}</p>
                </div>
                <CalendarDays className="w-8 h-8 text-sky-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All-time punctuality breakdown */}
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3">All-Time Punctuality (Historical)</p>
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white border-red-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-500">Total Late</p>
                  <p className="text-3xl font-bold font-['Manrope'] text-red-500">{stats?.all_late ?? 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-emerald-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-500">Total On Time</p>
                  <p className="text-3xl font-bold font-['Manrope'] text-emerald-500">{stats?.all_on_time ?? 0}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-sky-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-sky-500">Total Early</p>
                  <p className="text-3xl font-bold font-['Manrope'] text-sky-500">{stats?.all_early ?? 0}</p>
                </div>
                <CalendarDays className="w-8 h-8 text-sky-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Location Type Breakdown */}
      <SuperUserLocationBreakdown locationBreakdown={stats?.location_breakdown} />
    </div>
  );
};

// ============ SUPERUSER LOCATION BREAKDOWN ============
const SU_LOCATION_CONFIG = {
  'Facility': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800', Icon: Hospital },
  'Outreach': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', Icon: Truck },
  'Workshop or Meeting': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', Icon: Presentation },
};

const SuperUserLocationBreakdown = ({ locationBreakdown }) => {
  const [expandedType, setExpandedType] = useState(null);
  if (!locationBreakdown) return null;
  const hasAny = Object.values(locationBreakdown).some(v => v.count > 0);

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5 text-amber-700" />
        <h3 className="text-base font-semibold text-slate-800 font-['Manrope']">Live Location Breakdown</h3>
        {!hasAny && <span className="text-xs text-slate-500 ml-1">— no staff currently on duty</span>}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {Object.entries(locationBreakdown).map(([lt, data]) => {
          const cfg = SU_LOCATION_CONFIG[lt] || SU_LOCATION_CONFIG['Facility'];
          return (
            <button
              key={lt}
              onClick={() => setExpandedType(expandedType === lt ? null : lt)}
              className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border} text-left transition-all hover:opacity-90 ${expandedType === lt ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-white' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                {cfg.Icon && <cfg.Icon className={`w-5 h-5 ${cfg.text}`} />}
                <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>{data.count} on duty</span>
              </div>
              <p className={`text-2xl font-bold font-['Manrope'] ${cfg.text}`}>{data.count}</p>
              <p className={`text-xs ${cfg.text} font-medium mt-0.5`}>{lt}</p>
              {data.count > 0 && (
                <p className="text-xs text-slate-500 mt-1">{expandedType === lt ? 'Collapse ▲' : 'View staff ▼'}</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded staff list */}
      {expandedType && locationBreakdown[expandedType]?.staff?.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className={`px-4 py-2 ${SU_LOCATION_CONFIG[expandedType]?.bg || 'bg-slate-50'} border-b border-slate-200`}>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              {SU_LOCATION_CONFIG[expandedType]?.Icon && React.createElement(SU_LOCATION_CONFIG[expandedType].Icon, { className: `w-4 h-4 ${SU_LOCATION_CONFIG[expandedType]?.text}` })}
              {expandedType} — {locationBreakdown[expandedType].count} staff currently on duty
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {locationBreakdown[expandedType].staff.map((s, i) => {
              const loginTime = new Date(s.timestamp);
              const now = new Date();
              const diffMs = now - loginTime;
              const h = Math.floor(diffMs / 3600000);
              const m = Math.floor((diffMs % 3600000) / 60000);
              return (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.user_name}</p>
                    <p className="text-xs text-slate-400">{s.position} · {s.facility}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-mono">{loginTime.toLocaleTimeString()}</p>
                    <p className="text-xs text-slate-500">{h > 0 ? `${h}h ` : ''}{m}m on duty</p>
                    {s.status === 'late' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900 text-red-300">Late</span>}
                    {s.status === 'on_time' && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300">On Time</span>}
                    {s.status === 'early' && <span className="text-xs px-2 py-0.5 rounded-full bg-sky-900 text-sky-300">Early</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ USERS TAB ============
const UsersTab = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      params.append("limit", "100");
      const res = await authFetch(`${API}/superuser/users?${params}`, { });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (e) { console.error(e); }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (userId) => {
    try {
      const res = await authFetch(`${API}/superuser/users/${userId}`, { method: "DELETE" });
      if (res.ok) { toast.success("User deleted"); fetchUsers(); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to delete user"); }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await authFetch(`${API}/superuser/users/${userId}/role`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (res.ok) { toast.success("Role updated"); fetchUsers(); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to update role"); }
  };

  const handleResetPassword = async (userId, newPassword) => {
    try {
      const res = await authFetch(`${API}/superuser/users/${userId}/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword })
      });
      if (res.ok) { toast.success("Password reset"); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to reset password"); }
  };

  return (
    <div className="space-y-4" data-testid="su-users">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white border-slate-200 text-slate-900" data-testid="su-user-search" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 bg-white border-slate-200 text-slate-900" data-testid="su-role-filter">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="superuser">Super User</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchUsers} className="border-slate-200 text-slate-600 hover:bg-slate-100" data-testid="su-refresh-users">
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <p className="text-sm text-slate-500">{total} user(s) found</p>

      {/* Users Table */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-500">Name</TableHead>
                  <TableHead className="text-slate-500">Email</TableHead>
                  <TableHead className="text-slate-500">Phone</TableHead>
                  <TableHead className="text-slate-500">Position</TableHead>
                  <TableHead className="text-slate-500">Facility</TableHead>
                  <TableHead className="text-slate-500">Role</TableHead>
                  <TableHead className="text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id} className="border-slate-200 hover:bg-slate-50/80">
                    <TableCell className="font-medium text-slate-900">{u.name}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{u.email}</TableCell>
                    <TableCell className="text-slate-500">{u.phone_number || "-"}</TableCell>
                    <TableCell className="text-slate-500">{u.position || "-"}</TableCell>
                    <TableCell className="text-slate-500 text-sm max-w-[150px] truncate">{u.facility || "-"}</TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Role Change */}
                        <RoleChangeDialog user={u} onRoleChange={handleRoleChange} />
                        {/* Reset Password */}
                        <ResetPasswordDialog user={u} onReset={handleResetPassword} />
                        {/* Delete */}
                        {u.user_id !== currentUser?.user_id && (
                          <DeleteUserDialog user={u} onDelete={handleDelete} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500">No users found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ FACILITIES TAB ============
const FacilitiesTab = () => {
  const [facilities, setFacilities] = useState([]);
  const [provinces, setProvinces] = useState([]);  // [{id, name}]
  const [allDistricts, setAllDistricts] = useState([]); // [{id, name, province_id}]
  const [newFac, setNewFac] = useState({ name: "", province_id: "", district_id: "" });
  const [adding, setAdding] = useState(false);
  const [facilitySearch, setFacilitySearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await authFetch(`${API}/superuser/facilities`);
      if (res.ok) { const data = await res.json(); setFacilities(data.facilities || []); }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchFacilities();
    // Fetch provinces and districts from org-tree geography
    authFetch(`${API}/superuser/org-tree`)
      .then(r => r.ok ? r.json() : { tree: [] })
      .then(d => {
        const provs = (d.tree || []).map(p => ({ id: p.id, name: p.name }));
        const dists = (d.tree || []).flatMap(p =>
          (p.districts || []).map(dist => ({ id: dist.id, name: dist.name, province_id: p.id }))
        );
        setProvinces(provs);
        setAllDistricts(dists);
      })
      .catch(() => {});
  }, [fetchFacilities]);

  const handleAddFacility = async () => {
    if (!newFac.name || !newFac.district_id) {
      toast.error("Facility name and district are required"); return;
    }
    setAdding(true);
    try {
      const res = await authFetch(`${API}/superuser/facilities`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFac.name, district_id: newFac.district_id })
      });
      if (res.ok) { toast.success("Facility added"); setNewFac({ name: "", province_id: "", district_id: "" }); fetchFacilities(); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to add facility"); }
    finally { setAdding(false); }
  };

  const handleDeleteFacility = async (id) => {
    try {
      const res = await authFetch(`${API}/superuser/facilities/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Facility deleted"); fetchFacilities(); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to delete facility"); }
  };

  const filteredDistricts = newFac.province_id
    ? allDistricts.filter(d => String(d.province_id) === String(newFac.province_id))
    : allDistricts;

  const filteredFacilities = facilities.filter((f) => {
    const matchesSearch = !facilitySearch ||
      f.name.toLowerCase().includes(facilitySearch.toLowerCase()) ||
      f.district?.toLowerCase().includes(facilitySearch.toLowerCase());
    const matchesProvince = provinceFilter === "all" || f.province === provinces.find(p => String(p.id) === provinceFilter)?.name;
    const matchesDistrict = districtFilter === "all" || f.district === allDistricts.find(d => String(d.id) === districtFilter)?.name;
    return matchesSearch && matchesProvince && matchesDistrict;
  });

  const districtFilterList = provinceFilter === "all"
    ? allDistricts
    : allDistricts.filter(d => String(d.province_id) === provinceFilter);

  return (
    <div className="space-y-6" data-testid="su-facilities">
      {/* Add Facility */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-['Manrope'] text-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-500" /> Add New Facility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={newFac.province_id} onValueChange={(v) => setNewFac(p => ({ ...p, province_id: v, district_id: "" }))}>
              <SelectTrigger className="bg-slate-100 border-slate-200 text-slate-900">
                <SelectValue placeholder="Province (optional)" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={newFac.district_id} onValueChange={(v) => setNewFac(p => ({ ...p, district_id: v }))}>
              <SelectTrigger className="bg-slate-100 border-slate-200 text-slate-900">
                <SelectValue placeholder="District *" />
              </SelectTrigger>
              <SelectContent>
                {filteredDistricts.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="Facility name *"
              value={newFac.name}
              onChange={(e) => setNewFac(p => ({ ...p, name: e.target.value }))}
              className="bg-slate-100 border-slate-200 text-slate-900"
            />
            <Button onClick={handleAddFacility} disabled={adding} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-4 h-4 mr-2" />{adding ? "Adding..." : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or district…"
            value={facilitySearch}
            onChange={(e) => setFacilitySearch(e.target.value)}
            className="pl-9 bg-white border-slate-200 text-slate-900"
          />
        </div>
        <Select value={provinceFilter} onValueChange={(v) => { setProvinceFilter(v); setDistrictFilter("all"); }}>
          <SelectTrigger className="w-44 bg-white border-slate-200 text-slate-900">
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinces</SelectItem>
            {provinces.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-44 bg-white border-slate-200 text-slate-900">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districtFilterList.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Facilities Table */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-['Manrope'] text-slate-900">
            {filteredFacilities.length} of {facilities.length} Facilities
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[520px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-500">Name</TableHead>
                  <TableHead className="text-slate-500">District</TableHead>
                  <TableHead className="text-slate-500">Province</TableHead>
                  <TableHead className="text-slate-500">Ministry</TableHead>
                  <TableHead className="text-slate-500 text-center">Staff</TableHead>
                  <TableHead className="text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacilities.map((f) => (
                  <TableRow key={f.id} className="border-slate-200 hover:bg-slate-50">
                    <TableCell className="text-slate-900 font-medium">{f.name}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{f.district || "—"}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{f.province || "—"}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{f.ministry || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={f.staff_count > 0 ? "bg-teal-100 text-teal-700 border-0" : "bg-slate-100 text-slate-500 border-0"}>
                        <Users className="w-3 h-3 mr-1" />{f.staff_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleDeleteFacility(f.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title={f.staff_count > 0 ? "Cannot delete: staff assigned" : "Delete facility"}
                        disabled={f.staff_count > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFacilities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      {facilities.length === 0 ? "Loading facilities…" : "No facilities match your search."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ SHIFTS TAB ============
const ShiftsTab = () => {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await authFetch(`${API}/superuser/shifts`, { });
        if (res.ok) setConfig(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`${API}/superuser/shifts`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (res.ok) { toast.success("Shift configuration saved"); setConfig(await res.json()); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (!config) return <div className="text-slate-500 text-center py-12">Loading shift config...</div>;

  const shiftFields = [
    { label: "Morning Shift", startKey: "morning_start", endKey: "morning_end", color: "text-yellow-400" },
    { label: "Afternoon Shift", startKey: "afternoon_start", endKey: "afternoon_end", color: "text-orange-400" },
    { label: "Night Shift", startKey: "night_start", endKey: "night_end", color: "text-indigo-400" },
    { label: "4-Off Shift", startKey: "four_off_start", endKey: "four_off_end", color: "text-cyan-400" },
    { label: "On Call", startKey: "on_call_start", endKey: "on_call_end", color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6" data-testid="su-shifts">
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-['Manrope'] text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-700" /> Shift Time Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {shiftFields.map((s) => (
            <div key={s.label} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <Label className={`font-medium ${s.color}`}>{s.label}</Label>
              <div className="flex items-center gap-2">
                <Label className="text-slate-500 text-sm w-12">Start</Label>
                <Input type="time" value={config[s.startKey] || ""} onChange={(e) => setConfig(p => ({ ...p, [s.startKey]: e.target.value }))} className="bg-slate-100 border-slate-200 text-slate-900" data-testid={`su-shift-${s.startKey}`} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-slate-500 text-sm w-12">End</Label>
                <Input type="time" value={config[s.endKey] || ""} onChange={(e) => setConfig(p => ({ ...p, [s.endKey]: e.target.value }))} className="bg-slate-100 border-slate-200 text-slate-900" data-testid={`su-shift-${s.endKey}`} />
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-4 border-t border-slate-200">
            <Label className="text-slate-600 font-medium">Grace Period</Label>
            <div className="flex items-center gap-2 md:col-span-2">
              <Input type="number" value={config.grace_period_minutes || 15} onChange={(e) => setConfig(p => ({ ...p, grace_period_minutes: parseInt(e.target.value) || 0 }))} className="bg-slate-100 border-slate-200 text-slate-900 w-24" data-testid="su-shift-grace" />
              <span className="text-slate-500 text-sm">minutes</span>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white w-full md:w-auto" data-testid="su-save-shifts-btn">
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ REPORTS TAB ============
const ReportsTab = () => {
  const [report, setReport] = useState(null);
  const [date, setDate] = useState(""); // empty = no date filter, show all records
  const [taskModal, setTaskModal] = useState({ open: false, loading: false, data: null });
  const [provinceFilter, setProvinceFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Location data for dropdowns
  const [provinces, setProvinces] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [facilitiesList, setFacilitiesList] = useState([]);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await authFetch(`${API}/data/provinces`);
        if (res.ok) { const d = await res.json(); setProvinces(d.provinces || []); }
      } catch (e) { console.error(e); }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!provinceFilter) { setDistrictsList([]); setDistrictFilter(""); setFacilitiesList([]); setFacilityFilter(""); return; }
    const fetchDistricts = async () => {
      try {
        const res = await authFetch(`${API}/data/districts/${encodeURIComponent(provinceFilter)}`);
        if (res.ok) { const d = await res.json(); setDistrictsList(d.districts || []); }
      } catch (e) { console.error(e); }
    };
    fetchDistricts();
    setDistrictFilter("");
    setFacilityFilter("");
    setFacilitiesList([]);
  }, [provinceFilter]);

  // Fetch facilities when district changes
  useEffect(() => {
    if (!districtFilter) { setFacilitiesList([]); setFacilityFilter(""); return; }
    const fetchFacilities = async () => {
      try {
        const res = await authFetch(`${API}/data/facilities/${encodeURIComponent(districtFilter)}`);
        if (res.ok) { const d = await res.json(); setFacilitiesList(d.facilities || []); }
      } catch (e) { console.error(e); }
    };
    fetchFacilities();
    setFacilityFilter("");
  }, [districtFilter]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.append("date", new Date(date).toISOString());
      if (provinceFilter) params.append("province", provinceFilter);
      if (districtFilter) params.append("district", districtFilter);
      if (facilityFilter) params.append("facility", facilityFilter);
      const res = await authFetch(`${API}/superuser/attendance-report?${params}`, { });
      if (res.ok) setReport(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [date, provinceFilter, districtFilter, facilityFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const fetchTasks = useCallback(async (attendanceId) => {
    setTaskModal({ open: true, loading: true, data: null });
    try {
      const res = await authFetch(`${API}/superuser/tasks/${attendanceId}`);
      if (res.ok) {
        const data = await res.json();
        setTaskModal({ open: true, loading: false, data });
      } else {
        setTaskModal({ open: true, loading: false, data: { has_tasks: false, tasks: [] } });
      }
    } catch {
      setTaskModal({ open: true, loading: false, data: { has_tasks: false, tasks: [] } });
    }
  }, []);

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams();
      if (date) params.append("date", new Date(date).toISOString());
      if (provinceFilter) params.append("province", provinceFilter);
      if (districtFilter) params.append("district", districtFilter);
      if (facilityFilter) params.append("facility", facilityFilter);
      params.append("format", format);
      const res = await authFetch(`${API}/superuser/export?${params}`, { });
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const mimeType = format === "csv"
          ? "text/csv"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        const blob = new Blob([arrayBuffer], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `attendance_report_${date || "all"}.${format === "csv" ? "csv" : "xlsx"}`;
        document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
        toast.success(`Exported as ${format.toUpperCase()}`);
      } else {
        toast.error("Export failed");
      }
    } catch { toast.error("Export failed"); }
  };

  const handleClearFilters = () => {
    setProvinceFilter("");
    setDistrictFilter("");
    setFacilityFilter("");
    setSearchQuery("");
    setDate(""); // clear date filter to show all records
  };

  // Client-side search filter on loaded records
  const filteredRecords = (report?.records || []).filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.user_name?.toLowerCase().includes(q) ||
      r.facility?.toLowerCase().includes(q) ||
      r.position?.toLowerCase().includes(q) ||
      r.area_of_allocation?.toLowerCase().includes(q)
    );
  });

  // Recalc summary from filtered records
  const filteredSummary = {
    total: filteredRecords.filter(r => r.action === "login").length,
    late: filteredRecords.filter(r => r.status === "late").length,
    early: filteredRecords.filter(r => r.status === "early").length,
    on_time: filteredRecords.filter(r => r.status === "on_time").length,
  };

  const activeFilterCount = [provinceFilter, districtFilter, facilityFilter].filter(Boolean).length;

  return (
    <div className="space-y-4" data-testid="su-reports">
      {/* Location Filters Row */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-amber-700" />
            <span className="text-sm font-medium text-slate-600">Filter by Location</span>
            {activeFilterCount > 0 && (
              <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">{activeFilterCount} active</Badge>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Province */}
            <div>
              <Label className="text-slate-500 text-xs mb-1 block">Province</Label>
              <Select value={provinceFilter || "_none"} onValueChange={(v) => setProvinceFilter(v === "_none" ? "" : v)}>
                <SelectTrigger className="bg-slate-100 border-slate-200 text-slate-900" data-testid="su-report-province">
                  <SelectValue placeholder="All Provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">All Provinces</SelectItem>
                  {provinces.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* District */}
            <div>
              <Label className="text-slate-500 text-xs mb-1 block">District</Label>
              <Select value={districtFilter || "_none"} onValueChange={(v) => setDistrictFilter(v === "_none" ? "" : v)} disabled={!provinceFilter}>
                <SelectTrigger className="bg-slate-100 border-slate-200 text-slate-900" data-testid="su-report-district">
                  <SelectValue placeholder={provinceFilter ? "All Districts" : "Select province first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">All Districts</SelectItem>
                  {districtsList.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Facility */}
            <div>
              <Label className="text-slate-500 text-xs mb-1 block">Facility</Label>
              <Select value={facilityFilter || "_none"} onValueChange={(v) => setFacilityFilter(v === "_none" ? "" : v)} disabled={!districtFilter}>
                <SelectTrigger className="bg-slate-100 border-slate-200 text-slate-900" data-testid="su-report-facility">
                  <SelectValue placeholder={districtFilter ? "All Facilities" : "Select district first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">All Facilities</SelectItem>
                  {facilitiesList.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Date */}
            <div>
              <Label className="text-slate-500 text-xs mb-1 block">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-100 border-slate-200 text-slate-900" data-testid="su-report-date" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search + Actions Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search by staff name, facility, position..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-white border-slate-200 text-slate-900" data-testid="su-report-search" />
        </div>
        <Button variant="outline" onClick={handleClearFilters} className="border-slate-200 text-slate-600 hover:bg-slate-100" data-testid="su-report-clear">
          <XCircle className="w-4 h-4 mr-2" />Clear
        </Button>
        <Button variant="outline" onClick={fetchReport} className="border-slate-200 text-slate-600 hover:bg-slate-100" data-testid="su-report-refresh">
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")} className="border-slate-200 text-slate-600 hover:bg-slate-100" data-testid="su-export-csv">
            <Download className="w-4 h-4 mr-2" />CSV
          </Button>
          <Button onClick={() => handleExport("xlsx")} className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="su-export-xlsx">
            <Download className="w-4 h-4 mr-2" />Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{filteredSummary.total}</p>
            <p className="text-xs text-slate-500">Total Logins</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{filteredSummary.early}</p>
            <p className="text-xs text-emerald-600">Early</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{filteredSummary.on_time}</p>
            <p className="text-xs text-blue-600">On Time</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{filteredSummary.late}</p>
            <p className="text-xs text-red-600">Late</p>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500 font-normal">
            Showing {filteredRecords.length} of {report?.records?.length || 0} records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-500">Name</TableHead>
                  <TableHead className="text-slate-500">Facility</TableHead>
                  <TableHead className="text-slate-500">Action</TableHead>
                  <TableHead className="text-slate-500">Time</TableHead>
                  <TableHead className="text-slate-500">Status</TableHead>
                  <TableHead className="text-slate-500">Tasks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Loading...</TableCell></TableRow>
                ) : filteredRecords.length ? (
                  filteredRecords.map((r, i) => (
                    <TableRow key={i} className={`border-slate-200 ${r.status === "late" ? "bg-red-50" : r.status === "early" ? "bg-emerald-50" : ""}`}>
                      <TableCell className="text-slate-900 font-medium">{r.user_name}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{r.facility}</TableCell>
                      <TableCell>
                        <Badge className={r.action === "login" ? "bg-emerald-100 text-emerald-800 border-0" : "bg-red-100 text-red-700 border-0"}>
                          {r.action.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-500">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} minutesLate={r.minutes_late} lateDisplay={r.late_display} />
                      </TableCell>
                      <TableCell>
                        {r.action === "logout" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-700 border-amber-200 hover:bg-amber-50 text-xs h-7 px-2"
                            onClick={() => fetchTasks(r.attendance_id)}
                          >
                            <ClipboardList className="w-3 h-3 mr-1" />
                            Tasks
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">No records for selected filters</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      {/* Task View Modal */}
      <Dialog open={taskModal.open} onOpenChange={(open) => setTaskModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              Tasks Completed During Shift
            </DialogTitle>
            {taskModal.data?.user_name && (
              <p className="text-sm text-slate-500">{taskModal.data.user_name} &mdash; {taskModal.data.facility}</p>
            )}
            {taskModal.data?.submitted_at && (
              <p className="text-xs text-slate-400">Submitted: {new Date(taskModal.data.submitted_at).toLocaleString()}</p>
            )}
          </DialogHeader>
          {taskModal.loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : taskModal.data?.has_tasks ? (
            <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
              {(Array.isArray(taskModal.data.tasks) ? taskModal.data.tasks : []).map((task, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-amber-500 font-mono text-xs mt-0.5 shrink-0">{task.order || i + 1}.</span>
                  <span className="text-sm text-slate-700 flex-1 break-words">{task.text || task}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tasks were submitted for this shift.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ SMALL COMPONENTS ============
const RoleBadge = ({ role }) => {
  const styles = {
    superuser: "bg-amber-100 text-amber-800 border-amber-200",
    admin: "bg-blue-100 text-blue-800 border-blue-200",
    user: "bg-slate-100 text-slate-600 border-slate-200"
  };
  return <Badge className={styles[role] || styles.user}>{role}</Badge>;
};

const StatusBadge = ({ status, minutesLate, lateDisplay }) => {
  if (status === "early") return <span className="flex items-center gap-1 text-emerald-700 text-sm"><CheckCircle2 className="w-3.5 h-3.5" />Early</span>;
  if (status === "on_time") return <span className="flex items-center gap-1 text-blue-700 text-sm"><CheckCircle2 className="w-3.5 h-3.5" />On Time</span>;
  if (status === "late") return <span className="flex items-center gap-1 text-red-600 text-sm"><AlertTriangle className="w-3.5 h-3.5" />Late{lateDisplay ? ` (${lateDisplay})` : minutesLate ? ` (${minutesLate}m)` : ""}</span>;
  if (status === "logout") return <span className="text-slate-500 text-sm">Logout</span>;
  return <span className="text-slate-600 text-sm">-</span>;
};

// Dialog: Change Role + Jurisdiction Assignment
const RoleChangeDialog = ({ user, onRoleChange }) => {
  const [role, setRole] = useState(user.role);
  const [jurisdictionType, setJurisdictionType] = useState(user.assigned_jurisdiction?.type || "district");
  const [jurisdictionValue, setJurisdictionValue] = useState(user.assigned_jurisdiction?.value || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      onRoleChange(user.user_id, role);
      // If admin, also assign jurisdiction
      if (role === "admin" && jurisdictionValue) {
        await authFetch(`${API}/superuser/users/${user.user_id}/jurisdiction`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: jurisdictionType, value: jurisdictionValue })
        });
        toast.success("Jurisdiction assigned");
      }
    } finally { setSaving(false); }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800 hover:bg-blue-50" data-testid={`su-role-btn-${user.user_id}`}>
          <Shield className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle>Change Role: {user.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-500">{user.email}</p>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-slate-100 border-slate-200" data-testid={`su-role-select-${user.user_id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="superuser">Super User</SelectItem>
            </SelectContent>
          </Select>

          {/* Jurisdiction assignment for admins */}
          {role === "admin" && (
            <div className="space-y-3 border-t border-slate-200 pt-3">
              <Label className="text-slate-500 text-sm">Assign Jurisdiction</Label>
              <Select value={jurisdictionType} onValueChange={setJurisdictionType}>
                <SelectTrigger className="bg-slate-100 border-slate-200" data-testid={`su-juris-type-${user.user_id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facility">Facility</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                  <SelectItem value="province">Province</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={`Enter ${jurisdictionType} name...`}
                value={jurisdictionValue}
                onChange={(e) => setJurisdictionValue(e.target.value)}
                className="bg-slate-100 border-slate-200 text-slate-900"
                data-testid={`su-juris-value-${user.user_id}`}
              />
              {user.assigned_jurisdiction && (
                <p className="text-xs text-slate-500">
                  Current: {user.assigned_jurisdiction.type} → {user.assigned_jurisdiction.value}
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-slate-200 text-slate-600">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700" data-testid={`su-role-save-${user.user_id}`}>{saving ? "Saving..." : "Save"}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Dialog: Reset Password
const ResetPasswordDialog = ({ user, onReset }) => {
  const [pwd, setPwd] = useState("");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-800 hover:bg-amber-50" data-testid={`su-resetpwd-btn-${user.user_id}`}>
          <KeyRound className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle>Reset Password: {user.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-500">{user.email}</p>
          <Input type="password" placeholder="New password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="bg-slate-100 border-slate-200 text-slate-900" data-testid={`su-newpwd-${user.user_id}`} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-slate-200 text-slate-600">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => { onReset(user.user_id, pwd); setPwd(""); }} className="bg-amber-600 hover:bg-amber-700" data-testid={`su-resetpwd-save-${user.user_id}`}>Reset</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Dialog: Delete User
const DeleteUserDialog = ({ user, onDelete }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`su-delete-btn-${user.user_id}`}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </DialogTrigger>
    <DialogContent className="bg-white border-slate-200 text-slate-900">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" /> Delete User
        </DialogTitle>
      </DialogHeader>
      <p className="text-slate-500 py-4">
        Are you sure you want to delete <span className="text-slate-900 font-medium">{user.name}</span> ({user.email})?
        This action cannot be undone.
      </p>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" className="border-slate-200 text-slate-600">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button onClick={() => onDelete(user.user_id)} className="bg-red-600 hover:bg-red-700" data-testid={`su-confirm-delete-${user.user_id}`}>Delete</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ============ MINISTRIES TAB ============
const MinistriesTab = () => {
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: "", unit_term: "Facility", is_active: false });
  const [saving, setSaving] = useState(false);

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API}/superuser/ministries`);
      if (res.ok) { const d = await res.json(); setMinistries(d.ministries || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMinistries(); }, []);

  const openCreate = () => { setEditTarget(null); setForm({ name: "", unit_term: "Facility", is_active: false }); setShowForm(true); };
  const openEdit = (m) => { setEditTarget(m); setForm({ name: m.name, unit_term: m.unit_term, is_active: m.is_active }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Ministry name is required"); return; }
    setSaving(true);
    try {
      let res;
      if (editTarget) {
        res = await authFetch(`${API}/superuser/ministries/${editTarget.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, unit_term: form.unit_term }),
        });
      } else {
        res = await authFetch(`${API}/superuser/ministries`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      if (res.ok) {
        toast.success(editTarget ? "Ministry updated" : "Ministry created");
        setShowForm(false);
        fetchMinistries();
      } else {
        const e = await res.json();
        toast.error(e.detail || "Failed to save");
      }
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleToggle = async (m) => {
    const action = m.is_active ? "deactivate" : "activate";
    try {
      const res = await authFetch(`${API}/superuser/ministries/${m.id}/${action}`, { method: "PATCH" });
      if (res.ok) { toast.success(`Ministry ${action}d`); fetchMinistries(); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete "${m.name}"? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`${API}/superuser/ministries/${m.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Ministry deleted"); fetchMinistries(); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-4" data-testid="su-ministries">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 font-['Manrope']">Government Ministries</h2>
          <p className="text-sm text-slate-500">Manage ministries available for staff registration. Active ministries appear in the signup flow.</p>
        </div>
        <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="su-add-ministry-btn">
          <Plus className="w-4 h-4 mr-2" />Add Ministry
        </Button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="bg-slate-50 border-amber-200">
          <CardHeader><CardTitle className="text-base text-amber-800">{editTarget ? "Edit Ministry" : "New Ministry"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Label className="text-slate-500 text-sm mb-1 block">Ministry Name</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ministry of Health" className="bg-white border-slate-200 text-slate-900" data-testid="su-ministry-name" />
              </div>
              <div>
                <Label className="text-slate-500 text-sm mb-1 block">Unit Term</Label>
                <Input value={form.unit_term} onChange={(e) => setForm(p => ({ ...p, unit_term: e.target.value }))} placeholder="e.g. Facility, School, Office" className="bg-white border-slate-200 text-slate-900" data-testid="su-ministry-unit-term" />
                <p className="text-xs text-slate-500 mt-1">What org units are called in this ministry</p>
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm text-slate-600">Active (visible in signup)</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700" data-testid="su-ministry-save">{saving ? "Saving..." : "Save"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-200 text-slate-600">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ministries Table */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-500">Ministry Name</TableHead>
                <TableHead className="text-slate-500">Unit Term</TableHead>
                <TableHead className="text-slate-500">Status</TableHead>
                <TableHead className="text-slate-500">Created</TableHead>
                <TableHead className="text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Loading...</TableCell></TableRow>
              ) : ministries.length ? (
                ministries.map((m) => (
                  <TableRow key={m.id} className="border-slate-200 hover:bg-slate-50/80">
                    <TableCell className="font-medium text-slate-900">{m.name}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{m.unit_term}</TableCell>
                    <TableCell>
                      <Badge className={m.is_active ? "bg-emerald-100 text-emerald-800 border-0" : "bg-slate-100 text-slate-600 border-0"}>
                        {m.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)} className="text-blue-700 hover:text-blue-800 hover:bg-blue-50" data-testid={`su-edit-ministry-${m.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggle(m)} className={m.is_active ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"} data-testid={`su-toggle-ministry-${m.id}`}>
                          {m.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`su-delete-ministry-${m.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">No ministries found. Click "Add Ministry" to create one.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ ORG TREE TAB ============
// ── Staff Profile Panel (shared by both org tree components) ──────────────────
const StaffProfilePanel = ({ user, onClose }) => {
  if (!user) return null;
  const initials = user.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white shadow-2xl border-l border-slate-200 h-full overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 font-['Manrope']">Staff Profile</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 px-5 py-6 bg-slate-50 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-teal-600 font-['Manrope']">{initials}</span>
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 text-lg">{user.name}</p>
            <p className="text-sm text-slate-500">{user.position || "—"}</p>
            <Badge className={`mt-1 text-xs capitalize ${
              user.role === "admin" ? "bg-purple-100 text-purple-700 border-0" :
              user.role === "superuser" ? "bg-amber-100 text-amber-700 border-0" :
              "bg-teal-100 text-teal-700 border-0"
            }`}>{user.role || "staff"}</Badge>
          </div>
        </div>
        {/* Details */}
        <div className="flex-1 px-5 py-4 space-y-4">
          {user.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Email</p>
                <p className="text-sm text-slate-700 break-all">{user.email}</p>
              </div>
            </div>
          )}
          {user.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Phone</p>
                <p className="text-sm text-slate-700">{user.phone}</p>
              </div>
            </div>
          )}
          {user.facility && (
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Facility</p>
                <p className="text-sm text-slate-700">{user.facility}</p>
              </div>
            </div>
          )}
          {user.assigned_shift && (
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Assigned Shift</p>
                <p className="text-sm text-slate-700 capitalize">{user.assigned_shift.replace(/_/g, " ")}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Joined</p>
              <p className="text-sm text-slate-700">{joinDate}</p>
            </div>
          </div>
        </div>
        {/* Footer action */}
        <div className="px-5 py-4 border-t border-slate-100">
          <a
            href={`/superuser?user=${user.user_id}`}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Full Profile
          </a>
        </div>
      </div>
    </div>
  );
};

const OrgTreeTab = () => {
  const [tree, setTree] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [ministryFilter, setMinistryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    authFetch(`${API}/superuser/ministries`)
      .then(r => r.ok ? r.json() : { ministries: [] })
      .then(d => setMinistries(d.ministries || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = ministryFilter ? `?ministry_id=${ministryFilter}` : "";
    authFetch(`${API}/superuser/org-tree${params}`)
      .then(r => r.ok ? r.json() : { tree: [] })
      .then(d => { setTree(d.tree || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ministryFilter]);

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  // ── Search filtering ──────────────────────────────────────────────────────
  const q = search.toLowerCase().trim();
  const filteredTree = q === "" ? tree : tree
    .map(prov => ({
      ...prov,
      districts: prov.districts
        .map(dist => ({
          ...dist,
          org_units: dist.org_units
            .map(unit => ({
              ...unit,
              users: unit.users.filter(u =>
                u.name?.toLowerCase().includes(q) ||
                u.position?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q)
              )
            }))
            .filter(unit => unit.users.length > 0 ||
              unit.name?.toLowerCase().includes(q))
        }))
        .filter(dist => dist.org_units.length > 0 ||
          dist.name?.toLowerCase().includes(q))
    }))
    .filter(prov => prov.districts.length > 0 ||
      prov.name?.toLowerCase().includes(q));

  // Auto-expand all when searching
  useEffect(() => {
    if (q) {
      const keys = {};
      filteredTree.forEach(prov => {
        keys[`prov-${prov.id}`] = true;
        prov.districts.forEach(dist => {
          keys[`dist-${dist.id}`] = true;
          dist.org_units.forEach(unit => { keys[`unit-${unit.id}`] = true; });
        });
      });
      setExpanded(keys);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const totalUsers = tree.reduce((s, p) => s + p.user_count, 0);

  return (
    <div className="space-y-4" data-testid="su-org-tree">
      {/* Header + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 font-['Manrope']">Organisation Structure</h2>
          <p className="text-sm text-slate-500">{totalUsers} staff assigned across {tree.length} provinces</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search name, role, position…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-56 bg-white border-slate-200 text-slate-900 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Ministry filter */}
          <Select value={ministryFilter || "_all"} onValueChange={(v) => setMinistryFilter(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-52 bg-slate-100 border-slate-200 text-slate-900">
              <SelectValue placeholder="All Ministries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Ministries</SelectItem>
              {ministries.filter(m => m.is_active).map(m => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading organisation tree...</div>
      ) : filteredTree.length === 0 ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="py-12 text-center text-slate-500">
            <Network className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>{q ? `No results for "${search}"` : "No organisation data found. Seed geography data or assign staff to facilities."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTree.map((prov) => (
            <Card key={prov.id} className="bg-white border-slate-200">
              {/* Province Row */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50/80 transition-colors"
                onClick={() => toggle(`prov-${prov.id}`)}
              >
                <div className="flex items-center gap-3">
                  {expanded[`prov-${prov.id}`] ? <ChevronDown className="w-4 h-4 text-amber-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span className="font-semibold text-slate-900">{prov.name}</span>
                  <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">{prov.districts.length} districts</Badge>
                </div>
                <Badge className={prov.user_count > 0 ? "bg-teal-100 text-teal-700 border-0" : "bg-slate-100 text-slate-500 border-0"}>
                  <User2 className="w-3 h-3 mr-1" />{prov.user_count} staff
                </Badge>
              </button>

              {/* Districts */}
              {expanded[`prov-${prov.id}`] && (
                <div className="border-t border-slate-100">
                  {prov.districts.map((dist) => (
                    <div key={dist.id}>
                      <button
                        className="w-full flex items-center justify-between px-8 py-2.5 hover:bg-slate-50 transition-colors"
                        onClick={() => toggle(`dist-${dist.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          {expanded[`dist-${dist.id}`] ? <ChevronDown className="w-3.5 h-3.5 text-blue-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="text-slate-700 text-sm">{dist.name}</span>
                          <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">{dist.org_units.length} facilities</Badge>
                        </div>
                        <Badge className={dist.user_count > 0 ? "bg-blue-100 text-blue-700 border-0 text-xs" : "bg-slate-100 text-slate-500 border-0 text-xs"}>
                          <User2 className="w-3 h-3 mr-1" />{dist.user_count}
                        </Badge>
                      </button>

                      {/* Org Units / Facilities */}
                      {expanded[`dist-${dist.id}`] && (
                        <div className="border-t border-slate-50">
                          {dist.org_units.length === 0 ? (
                            <p className="px-16 py-2 text-xs text-slate-400">No facilities</p>
                          ) : dist.org_units.map((unit) => (
                            <div key={unit.id}>
                              <button
                                className="w-full flex items-center justify-between px-14 py-2 hover:bg-slate-50 transition-colors"
                                onClick={() => toggle(`unit-${unit.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  {expanded[`unit-${unit.id}`] ? <ChevronDown className="w-3 h-3 text-teal-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-slate-600 text-sm">{unit.name}</span>
                                </div>
                                <Badge className={unit.users.length > 0 ? "bg-teal-100 text-teal-700 border-0 text-xs" : "bg-slate-100 text-slate-500 border-0 text-xs"}>
                                  <User2 className="w-3 h-3 mr-1" />{unit.users.length}
                                </Badge>
                              </button>

                              {/* Users in this facility */}
                              {expanded[`unit-${unit.id}`] && (
                                <div className="px-20 py-1 space-y-0.5 border-t border-slate-50">
                                  {unit.users.length === 0 ? (
                                    <p className="text-xs text-slate-400 py-1">No staff assigned</p>
                                  ) : unit.users.map((u) => (
                                    <button
                                      key={u.user_id}
                                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-teal-50 transition-colors text-left group"
                                      onClick={() => setSelectedUser(u)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                          <span className="text-xs font-semibold text-teal-700">{u.name?.[0]?.toUpperCase() || "?"}</span>
                                        </div>
                                        <span className="text-sm text-slate-700 group-hover:text-teal-700">{u.name}</span>
                                        <span className="text-xs text-slate-400">{u.position}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-slate-100 text-slate-500 border-0 text-xs capitalize">{u.assigned_shift?.replace(/_/g, " ") || "—"}</Badge>
                                        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-teal-500" />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Staff Profile Panel */}
      {selectedUser && <StaffProfilePanel user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
};

export default SuperUserDashboard;
