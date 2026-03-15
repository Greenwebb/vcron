import { useState, useEffect, useCallback } from "react";
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
  ChevronRight, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Plus
} from "lucide-react";
import { API } from "@/App";

const SuperUserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Check superuser access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch(`${API}/auth/me`, { credentials: "include" });
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-white hover:bg-slate-800" data-testid="su-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white font-['Manrope']">Super User Panel</h1>
                <p className="text-xs text-slate-500">{currentUser?.email}</p>
              </div>
            </div>
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">SUPERUSER</Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400" data-testid="su-tab-overview">
              <BarChart3 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400" data-testid="su-tab-users">
              <Users className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="facilities" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400" data-testid="su-tab-facilities">
              <Building2 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Facilities</span>
            </TabsTrigger>
            <TabsTrigger value="shifts" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400" data-testid="su-tab-shifts">
              <Clock className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Shifts</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400" data-testid="su-tab-reports">
              <Activity className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="users"><UsersTab currentUser={currentUser} /></TabsContent>
          <TabsContent value="facilities"><FacilitiesTab /></TabsContent>
          <TabsContent value="shifts"><ShiftsTab /></TabsContent>
          <TabsContent value="reports"><ReportsTab /></TabsContent>
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
        const res = await fetch(`${API}/superuser/stats`, { credentials: "include" });
        if (res.ok) setStats(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats?.total_users || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Admins", value: stats?.total_admins || 0, icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Super Users", value: stats?.total_superusers || 0, icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Facilities", value: stats?.total_facilities || 0, icon: Building2, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Today's Logins", value: stats?.today_logins || 0, icon: Activity, color: "text-teal-400", bg: "bg-teal-500/10" },
    { label: "Currently On Duty", value: stats?.currently_on_duty || 0, icon: Clock, color: "text-green-400", bg: "bg-green-500/10" },
  ];

  return (
    <div className="space-y-6" data-testid="su-overview">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="bg-slate-900 border-slate-800">
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
      const res = await fetch(`${API}/superuser/users?${params}`, { credentials: "include" });
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
      const res = await fetch(`${API}/superuser/users/${userId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) { toast.success("User deleted"); fetchUsers(); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to delete user"); }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await fetch(`${API}/superuser/users/${userId}/role`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }), credentials: "include"
      });
      if (res.ok) { toast.success("Role updated"); fetchUsers(); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to update role"); }
  };

  const handleResetPassword = async (userId, newPassword) => {
    try {
      const res = await fetch(`${API}/superuser/users/${userId}/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }), credentials: "include"
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
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-slate-900 border-slate-700 text-white" data-testid="su-user-search" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white" data-testid="su-role-filter">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="superuser">Super User</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchUsers} className="border-slate-700 text-slate-300 hover:bg-slate-800" data-testid="su-refresh-users">
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <p className="text-sm text-slate-500">{total} user(s) found</p>

      {/* Users Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Phone</TableHead>
                  <TableHead className="text-slate-400">Position</TableHead>
                  <TableHead className="text-slate-400">Facility</TableHead>
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-white">{u.name}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{u.email}</TableCell>
                    <TableCell className="text-slate-400">{u.phone_number || "-"}</TableCell>
                    <TableCell className="text-slate-400">{u.position || "-"}</TableCell>
                    <TableCell className="text-slate-400 text-sm max-w-[150px] truncate">{u.facility || "-"}</TableCell>
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
  const [newFacility, setNewFacility] = useState({ name: "", district: "", province: "" });
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState({});
  const [adding, setAdding] = useState(false);

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await fetch(`${API}/superuser/facilities`, { credentials: "include" });
      if (res.ok) { const data = await res.json(); setFacilities(data.facilities || []); }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchFacilities();
    const fetchLocations = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          fetch(`${API}/superuser/provinces`, { credentials: "include" }),
          fetch(`${API}/superuser/districts`, { credentials: "include" })
        ]);
        if (pRes.ok) { const d = await pRes.json(); setProvinces(d.provinces || []); }
        if (dRes.ok) { const d = await dRes.json(); setDistricts(d.districts || {}); }
      } catch (e) { console.error(e); }
    };
    fetchLocations();
  }, [fetchFacilities]);

  const handleAddFacility = async () => {
    if (!newFacility.name || !newFacility.district || !newFacility.province) {
      toast.error("All fields are required"); return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API}/superuser/facilities`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFacility), credentials: "include"
      });
      if (res.ok) { toast.success("Facility added"); setNewFacility({ name: "", district: "", province: "" }); fetchFacilities(); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to add facility"); }
    finally { setAdding(false); }
  };

  const handleDeleteFacility = async (facilityId) => {
    try {
      const res = await fetch(`${API}/superuser/facilities/${facilityId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) { toast.success("Facility deleted"); fetchFacilities(); }
      else { const e = await res.json(); toast.error(e.detail); }
    } catch { toast.error("Failed to delete facility"); }
  };

  const selectedProvinceDistricts = districts[newFacility.province] || [];

  return (
    <div className="space-y-6" data-testid="su-facilities">
      {/* Add Facility */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-['Manrope'] text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" /> Add New Facility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={newFacility.province} onValueChange={(v) => setNewFacility(p => ({ ...p, province: v, district: "" }))}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="su-fac-province">
                <SelectValue placeholder="Province" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={newFacility.district} onValueChange={(v) => setNewFacility(p => ({ ...p, district: v }))}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="su-fac-district">
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                {selectedProvinceDistricts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Facility name" value={newFacility.name} onChange={(e) => setNewFacility(p => ({ ...p, name: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" data-testid="su-fac-name" />
            <Button onClick={handleAddFacility} disabled={adding} className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="su-add-facility-btn">
              <Plus className="w-4 h-4 mr-2" />{adding ? "Adding..." : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Facilities List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-['Manrope'] text-white">{facilities.length} Facilities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">District</TableHead>
                  <TableHead className="text-slate-400">Province</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities.map((f) => (
                  <TableRow key={f.facility_id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-white font-medium">{f.name}</TableCell>
                    <TableCell className="text-slate-400">{f.district}</TableCell>
                    <TableCell className="text-slate-400">{f.province}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteFacility(f.facility_id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`su-del-fac-${f.facility_id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {facilities.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500">No facilities. Add one above.</TableCell></TableRow>
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
        const res = await fetch(`${API}/superuser/shifts`, { credentials: "include" });
        if (res.ok) setConfig(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/superuser/shifts`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config), credentials: "include"
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
  ];

  return (
    <div className="space-y-6" data-testid="su-shifts">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-['Manrope'] text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> Shift Time Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {shiftFields.map((s) => (
            <div key={s.label} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <Label className={`font-medium ${s.color}`}>{s.label}</Label>
              <div className="flex items-center gap-2">
                <Label className="text-slate-500 text-sm w-12">Start</Label>
                <Input type="time" value={config[s.startKey] || ""} onChange={(e) => setConfig(p => ({ ...p, [s.startKey]: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" data-testid={`su-shift-${s.startKey}`} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-slate-500 text-sm w-12">End</Label>
                <Input type="time" value={config[s.endKey] || ""} onChange={(e) => setConfig(p => ({ ...p, [s.endKey]: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" data-testid={`su-shift-${s.endKey}`} />
              </div>
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-4 border-t border-slate-800">
            <Label className="text-slate-300 font-medium">Grace Period</Label>
            <div className="flex items-center gap-2 md:col-span-2">
              <Input type="number" value={config.grace_period_minutes || 15} onChange={(e) => setConfig(p => ({ ...p, grace_period_minutes: parseInt(e.target.value) || 0 }))} className="bg-slate-800 border-slate-700 text-white w-24" data-testid="su-shift-grace" />
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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [facilityFilter, setFacilityFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.append("date", new Date(date).toISOString());
      if (facilityFilter) params.append("facility", facilityFilter);
      if (districtFilter) params.append("district", districtFilter);
      const res = await fetch(`${API}/superuser/attendance-report?${params}`, { credentials: "include" });
      if (res.ok) setReport(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [date, facilityFilter, districtFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams();
      if (date) params.append("date", new Date(date).toISOString());
      if (facilityFilter) params.append("facility", facilityFilter);
      if (districtFilter) params.append("district", districtFilter);
      params.append("format", format);
      const res = await fetch(`${API}/superuser/export?${params}`, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `report_${date || "all"}.${format === "csv" ? "csv" : "xlsx"}`;
        document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
        toast.success(`Exported as ${format.toUpperCase()}`);
      }
    } catch { toast.error("Export failed"); }
  };

  return (
    <div className="space-y-4" data-testid="su-reports">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-slate-400 text-sm mb-1 block">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-900 border-slate-700 text-white w-44" data-testid="su-report-date" />
        </div>
        <div>
          <Label className="text-slate-400 text-sm mb-1 block">Facility</Label>
          <Input placeholder="Filter by facility" value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)} className="bg-slate-900 border-slate-700 text-white w-48" data-testid="su-report-facility" />
        </div>
        <Button variant="outline" onClick={fetchReport} className="border-slate-700 text-slate-300 hover:bg-slate-800" data-testid="su-report-refresh">
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")} className="border-slate-700 text-slate-300 hover:bg-slate-800" data-testid="su-export-csv">
            <Download className="w-4 h-4 mr-2" />CSV
          </Button>
          <Button onClick={() => handleExport("xlsx")} className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="su-export-xlsx">
            <Download className="w-4 h-4 mr-2" />Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {report?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{report.summary.total}</p>
              <p className="text-xs text-slate-500">Total Logins</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-950 border-emerald-900">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{report.summary.early}</p>
              <p className="text-xs text-emerald-500">Early</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-950 border-blue-900">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{report.summary.on_time}</p>
              <p className="text-xs text-blue-500">On Time</p>
            </CardContent>
          </Card>
          <Card className="bg-red-950 border-red-900">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{report.summary.late}</p>
              <p className="text-xs text-red-500">Late</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Records Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Facility</TableHead>
                  <TableHead className="text-slate-400">Action</TableHead>
                  <TableHead className="text-slate-400">Time</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Loading...</TableCell></TableRow>
                ) : report?.records?.length ? (
                  report.records.map((r, i) => (
                    <TableRow key={i} className={`border-slate-800 ${r.status === "late" ? "bg-red-950/30" : r.status === "early" ? "bg-emerald-950/30" : ""}`}>
                      <TableCell className="text-white font-medium">{r.user_name}</TableCell>
                      <TableCell className="text-slate-400 text-sm">{r.facility}</TableCell>
                      <TableCell>
                        <Badge className={r.action === "login" ? "bg-emerald-500/20 text-emerald-400 border-0" : "bg-red-500/20 text-red-400 border-0"}>
                          {r.action.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-400">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} minutesLate={r.minutes_late} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">No records for selected filters</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ SMALL COMPONENTS ============
const RoleBadge = ({ role }) => {
  const styles = {
    superuser: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    user: "bg-slate-700/50 text-slate-400 border-slate-600"
  };
  return <Badge className={styles[role] || styles.user}>{role}</Badge>;
};

const StatusBadge = ({ status, minutesLate }) => {
  if (status === "early") return <span className="flex items-center gap-1 text-emerald-400 text-sm"><CheckCircle2 className="w-3.5 h-3.5" />Early</span>;
  if (status === "on_time") return <span className="flex items-center gap-1 text-blue-400 text-sm"><CheckCircle2 className="w-3.5 h-3.5" />On Time</span>;
  if (status === "late") return <span className="flex items-center gap-1 text-red-400 text-sm"><AlertTriangle className="w-3.5 h-3.5" />Late{minutesLate ? ` (${minutesLate}m)` : ""}</span>;
  if (status === "logout") return <span className="text-slate-500 text-sm">Logout</span>;
  return <span className="text-slate-600 text-sm">-</span>;
};

// Dialog: Change Role
const RoleChangeDialog = ({ user, onRoleChange }) => {
  const [role, setRole] = useState(user.role);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" data-testid={`su-role-btn-${user.user_id}`}>
          <Shield className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Change Role: {user.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-400">{user.email}</p>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-slate-800 border-slate-700" data-testid={`su-role-select-${user.user_id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="superuser">Super User</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-slate-700 text-slate-300">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => onRoleChange(user.user_id, role)} className="bg-amber-600 hover:bg-amber-700" data-testid={`su-role-save-${user.user_id}`}>Save</Button>
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
        <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" data-testid={`su-resetpwd-btn-${user.user_id}`}>
          <KeyRound className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Reset Password: {user.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-400">{user.email}</p>
          <Input type="password" placeholder="New password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="bg-slate-800 border-slate-700 text-white" data-testid={`su-newpwd-${user.user_id}`} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-slate-700 text-slate-300">Cancel</Button>
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
    <DialogContent className="bg-slate-900 border-slate-800 text-white">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" /> Delete User
        </DialogTitle>
      </DialogHeader>
      <p className="text-slate-400 py-4">
        Are you sure you want to delete <span className="text-white font-medium">{user.name}</span> ({user.email})?
        This action cannot be undone.
      </p>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" className="border-slate-700 text-slate-300">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button onClick={() => onDelete(user.user_id)} className="bg-red-600 hover:bg-red-700" data-testid={`su-confirm-delete-${user.user_id}`}>Delete</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default SuperUserDashboard;
