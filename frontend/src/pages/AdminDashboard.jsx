import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Clock, 
  ArrowLeft, 
  Users, 
  Activity,
  Download,
  Search,
  CalendarIcon,
  MapPin,
  Building2,
  Edit,
  Shield,
  Mail,
  RefreshCw,
  Bell,
  AlertTriangle,
  Navigation,
  X,
  Trash2,
  Network,
  ChevronDown,
  ChevronRight,
  User2,
  Phone,
  CalendarDays,
  ExternalLink,
  CheckCircle2,
  BarChart3,
  ClipboardList,
  Hospital,
  Truck,
  Presentation
} from "lucide-react";
import { API, authFetch } from "@/lib/api";
import Logo from "@/components/Logo";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("realtime");
  const [realtimeData, setRealtimeData] = useState(null);
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [sendingBackup, setSendingBackup] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [selectedStaffMap, setSelectedStaffMap] = useState(null);
  const [taskModal, setTaskModal] = useState({ open: false, loading: false, data: null, attendanceId: null });

  // Fetch tasks for a given attendance record
  const fetchTasks = useCallback(async (attendanceId) => {
    setTaskModal({ open: true, loading: true, data: null, attendanceId });
    try {
      const res = await authFetch(`${API}/admin/tasks/${attendanceId}`);
      if (res.ok) {
        const data = await res.json();
        setTaskModal({ open: true, loading: false, data, attendanceId });
      } else {
        setTaskModal({ open: true, loading: false, data: { has_tasks: false, tasks: [] }, attendanceId });
      }
    } catch {
      setTaskModal({ open: true, loading: false, data: { has_tasks: false, tasks: [] }, attendanceId });
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facilitiesRes, positionsRes] = await Promise.all([
          authFetch(`${API}/facilities`),
          authFetch(`${API}/positions`)
        ]);
        
        const facilitiesData = await facilitiesRes.json();
        const positionsData = await positionsRes.json();
        
        setFacilities(facilitiesData.facilities || []);
        setPositions(positionsData.positions || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, []);

  // Fetch realtime data
  const fetchRealtime = useCallback(async () => {
    try {
      const response = await authFetch(`${API}/admin/attendance/realtime`, {
      });
      
      if (response.ok) {
        const data = await response.json();
        setRealtimeData(data);
      } else if (response.status === 403) {
        toast.error("Admin access required");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching realtime:", error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (facilityFilter !== "all") params.append("facility", facilityFilter);
      
      const response = await authFetch(`${API}/admin/users?${params}`, {
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [facilityFilter]);

  // Fetch attendance
  const fetchAttendance = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (facilityFilter !== "all") params.append("facility", facilityFilter);
      if (selectedDate) params.append("date", selectedDate.toISOString());
      if (searchQuery) params.append("user_name", searchQuery);
      
      const response = await authFetch(`${API}/admin/attendance?${params}`, {
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || data.records || []);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  }, [facilityFilter, selectedDate, searchQuery]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch(`${API}/admin/notifications?limit=50`, { });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setNotifCount(data.unread_count || 0);
      }
    } catch (e) { console.error("Error fetching notifications:", e); }
  }, []);

  const markNotifRead = async (id) => {
    await authFetch(`${API}/admin/notifications/${id}/read`, { method: "PUT" });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await authFetch(`${API}/admin/notifications/read-all`, { method: "PUT" });
    fetchNotifications();
  };

  useEffect(() => {
    fetchRealtime();
    fetchNotifications();
  }, [fetchRealtime, fetchNotifications]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "attendance") fetchAttendance();
    if (activeTab === "notifications") fetchNotifications();
  }, [activeTab, facilityFilter, selectedDate, searchQuery, fetchUsers, fetchAttendance, fetchNotifications]);

  // Auto-refresh realtime data
  useEffect(() => {
    if (activeTab === "realtime") {
      const interval = setInterval(fetchRealtime, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchRealtime]);

  // Update user
  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await authFetch(`${API}/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast.success("User updated successfully");
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to update user");
      }
    } catch (error) {
      toast.error("Error updating user");
    }
  };

  // Export attendance
  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams();
      if (facilityFilter !== "all") params.append("facility", facilityFilter);
      if (selectedDate) params.append("date", selectedDate.toISOString());
      params.append("format", format);

      const response = await authFetch(`${API}/admin/export?${params}`, {
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_${format === "csv" ? "csv" : "xlsx"}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success(`Exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      toast.error("Export failed");
    }
  };

  // Send backup email
  const handleSendBackup = async () => {
    setSendingBackup(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate.toISOString());

      const response = await authFetch(`${API}/admin/send-backup?${params}`, {
        method: "POST"
      });

      if (response.ok) {
        toast.success("Backup email sent successfully");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to send backup");
      }
    } catch (error) {
      toast.error("Error sending backup");
    } finally {
      setSendingBackup(false);
    }
  };

  // Map center calculation
  const mapCenter = useMemo(() => {
    if (!realtimeData?.on_duty_staff?.length) return [-13.5, 28.5]; // Default to Zambia
    
    const validLocations = realtimeData.on_duty_staff.filter(s => s.latitude && s.longitude);
    if (!validLocations.length) return [-13.5, 28.5];
    
    const avgLat = validLocations.reduce((sum, s) => sum + s.latitude, 0) / validLocations.length;
    const avgLng = validLocations.reduce((sum, s) => sum + s.longitude, 0) / validLocations.length;
    
    return [avgLat, avgLng];
  }, [realtimeData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/dashboard")}
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Logo variant="dark" size="sm" />
              <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50">Admin</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/deletion-requests')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Deletion Requests</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRealtime}
              className="hidden md:flex"
              data-testid="refresh-btn"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="realtime" data-testid="tab-realtime">
              <Activity className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Real-time</span>
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance">
              <Clock className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications" className="relative">
              <Bell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Alerts</span>
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="org-tree" data-testid="tab-org-tree">
              <Network className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Org Tree</span>
            </TabsTrigger>
          </TabsList>

          {/* Real-time Tab */}
          <TabsContent value="realtime" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Staff On Duty</p>
                      <p className="text-3xl font-bold text-teal-700 font-['Manrope']" data-testid="on-duty-count">
                        {realtimeData?.on_duty_count || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-teal-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Active Facilities</p>
                      <p className="text-3xl font-bold text-teal-700 font-['Manrope']">
                        {Object.keys(realtimeData?.facility_breakdown || {}).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-teal-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Facilities</p>
                      <p className="text-3xl font-bold text-teal-700 font-['Manrope']">
                        {facilities.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map and Staff List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Map */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-['Manrope']">Location Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 rounded-lg overflow-hidden map-container">
                    <MapContainer 
                      center={mapCenter} 
                      zoom={8} 
                      className="h-full w-full"
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {realtimeData?.on_duty_staff?.map((staff) => (
                        staff.latitude && staff.longitude && (
                          <Marker 
                            key={staff.attendance_id} 
                            position={[staff.latitude, staff.longitude]}
                          >
                            <Popup>
                              <div className="text-sm">
                                <p className="font-semibold">{staff.user_name}</p>
                                <p className="text-slate-500">{staff.position}</p>
                                <p className="text-slate-500">{staff.facility}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )
                      ))}
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Staff List */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-['Manrope']">Currently On Duty</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    {realtimeData?.on_duty_staff?.length ? (
                      <div className="space-y-3">
                        {realtimeData.on_duty_staff.map((staff) => {
                          const loginTime = new Date(staff.timestamp);
                          const now = new Date();
                          const diffMs = now - loginTime;
                          const hoursOnDuty = Math.floor(diffMs / 3600000);
                          const minsOnDuty = Math.floor((diffMs % 3600000) / 60000);
                          
                          return (
                            <div 
                              key={staff.attendance_id}
                              className="p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                              onClick={() => {
                                if (staff.latitude && staff.longitude) {
                                  setSelectedStaffMap(staff);
                                } else {
                                  toast.info("No GPS coordinates available for this check-in");
                                }
                              }}
                              data-testid={`staff-card-${staff.attendance_id}`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-slate-900">{staff.user_name}</p>
                                  <p className="text-sm text-slate-500">{staff.position}</p>
                                  <p className="text-sm text-slate-500">{staff.facility}</p>
                                  {staff.shift_type && (
                                    <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded mt-1 inline-block capitalize">
                                      {staff.shift_type.replace("_", " ")} shift
                                    </span>
                                  )}
                                  {/* Lateness badge */}
                                  {staff.late_display && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                        Late: {staff.late_display}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  {/* Status badge */}
                                  {staff.status === 'late' ? (
                                    <Badge className="bg-red-100 text-red-700 border-0">Late</Badge>
                                  ) : staff.status === 'on_time' ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-0">On Time</Badge>
                                  ) : (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-0">On Duty</Badge>
                                  )}
                                  <p className="text-xs text-slate-500 mt-1 font-mono">
                                    {loginTime.toLocaleTimeString()}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {hoursOnDuty}h {minsOnDuty}m on duty
                                  </p>
                                  {staff.latitude && staff.longitude && (
                                    <div className="flex items-center gap-1 text-xs text-blue-500 mt-1">
                                      <Navigation className="w-3 h-3" /> GPS
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No staff currently on duty</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* GPS Map Dialog */}
            {selectedStaffMap && (
              <Card className="border-blue-200 shadow-lg bg-white">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-['Manrope'] flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    {selectedStaffMap.user_name} - GPS Location
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedStaffMap(null)} data-testid="close-map-btn">
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="h-80 rounded-lg overflow-hidden map-container">
                    <MapContainer
                      key={`map-${selectedStaffMap.attendance_id}`}
                      center={[selectedStaffMap.latitude, selectedStaffMap.longitude]}
                      zoom={16}
                      className="h-full w-full"
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[selectedStaffMap.latitude, selectedStaffMap.longitude]}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{selectedStaffMap.user_name}</p>
                            <p>{selectedStaffMap.position}</p>
                            <p>{selectedStaffMap.facility}</p>
                            <p className="font-mono text-xs mt-1">
                              {selectedStaffMap.latitude.toFixed(6)}, {selectedStaffMap.longitude.toFixed(6)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Reported: {new Date(selectedStaffMap.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center font-mono">
                    {selectedStaffMap.latitude.toFixed(6)}, {selectedStaffMap.longitude.toFixed(6)} | 
                    Reported at {new Date(selectedStaffMap.timestamp).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Facility Breakdown */}
            {realtimeData?.facility_breakdown && Object.keys(realtimeData.facility_breakdown).length > 0 && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-['Manrope']">Staff by Facility</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Object.entries(realtimeData.facility_breakdown).map(([facility, count]) => (
                      <div 
                        key={facility}
                        className="p-3 bg-teal-50 rounded-lg text-center"
                      >
                        <p className="text-2xl font-bold text-teal-700">{count}</p>
                        <p className="text-xs text-teal-600 truncate" title={facility}>{facility}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Type Breakdown */}
            <AdminLocationBreakdown locationBreakdown={realtimeData?.location_breakdown} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                <SelectTrigger className="w-64" data-testid="facility-filter">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by facility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {facilities.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <Table className="attendance-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-slate-500">{user.email}</TableCell>
                        <TableCell className="text-slate-500">{user.phone_number || "-"}</TableCell>
                        <TableCell>{user.position || "-"}</TableCell>
                        <TableCell>{user.facility || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingUser(user)}
                                data-testid={`edit-user-${user.user_id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                              </DialogHeader>
                              <EditUserForm 
                                user={editingUser} 
                                positions={positions}
                                facilities={facilities}
                                onSave={handleUpdateUser}
                              />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-52 justify-start" data-testid="date-picker">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                <SelectTrigger className="w-64" data-testid="facility-filter-attendance">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by facility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {facilities.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="search-input"
                />
              </div>

              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => handleExport("csv")} data-testid="export-csv-btn">
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport("xlsx")} data-testid="export-xlsx-btn">
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button 
                  onClick={handleSendBackup} 
                  disabled={sendingBackup}
                  className="bg-teal-700 hover:bg-teal-800"
                  data-testid="send-backup-btn"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {sendingBackup ? "Sending..." : "Send Backup"}
                </Button>
              </div>
            </div>

            {/* Attendance Table */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <Table className="attendance-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Location Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>GPS Coordinates</TableHead>
                      <TableHead>Tasks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.length ? (
                      attendance.map((record) => (
                        <TableRow key={record.attendance_id}>
                          <TableCell className="font-medium">{record.user_name}</TableCell>
                          <TableCell>{record.position}</TableCell>
                          <TableCell>{record.facility}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-slate-50">
                              {record.area_of_allocation || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={record.action === "login" ? "default" : "destructive"}
                              className={record.action === "login" 
                                ? "bg-emerald-100 text-emerald-700 border-0" 
                                : "bg-red-100 text-red-700 border-0"
                              }
                            >
                              {record.action.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {new Date(record.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {record.latitude && record.longitude 
                              ? `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            {record.action === "logout" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-teal-700 border-teal-200 hover:bg-teal-50 text-xs h-7 px-2"
                                onClick={() => fetchTasks(record.attendance_id)}
                              >
                                <ClipboardList className="w-3 h-3 mr-1" />
                                View Tasks
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-['Manrope']">
                <Bell className="w-5 h-5 inline mr-2 text-amber-600" />
                Notifications
                {notifCount > 0 && <span className="text-red-500 text-sm ml-2">({notifCount} unread)</span>}
              </h2>
              {notifCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllRead} data-testid="mark-all-read-btn">
                  Mark All Read
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {notifications.length > 0 ? notifications.map((n) => (
                <Card key={n.notification_id} className={`border shadow-sm ${n.read ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                  <CardContent className="p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'outside_radius' ? 'bg-red-100' : 'bg-amber-100'}`}>
                        {n.type === 'outside_radius' ? (
                          <Navigation className="w-5 h-5 text-red-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm ${n.read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>{n.message}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {n.facility} | {new Date(n.timestamp).toLocaleString()}
                        </p>
                        {n.distance_meters && (
                          <Badge className="bg-red-100 text-red-700 border-0 text-xs mt-1">{n.distance_meters}m from facility</Badge>
                        )}
                      </div>
                    </div>
                    {!n.read && (
                      <Button variant="ghost" size="sm" onClick={() => markNotifRead(n.notification_id)} className="text-slate-400 hover:text-slate-600 flex-shrink-0" data-testid={`notif-read-${n.notification_id}`}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-12 text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <AdminReportsTab />
          </TabsContent>

          {/* Org Tree Tab */}
          <TabsContent value="org-tree" className="space-y-6">
            <OrgTreeAdminTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Task View Modal */}
      <AdminTaskModal taskModal={taskModal} setTaskModal={setTaskModal} />
    </div>
  );
};

// ============ LOCATION TYPE BREAKDOWN COMPONENT ============
const LOCATION_CONFIG = {
  'Facility': { color: 'teal', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700', Icon: Hospital },
  'Outreach': { color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', Icon: Truck },
  'Workshop or Meeting': { color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', Icon: Presentation },
};

const AdminLocationBreakdown = ({ locationBreakdown }) => {
  const [expandedType, setExpandedType] = useState(null);
  if (!locationBreakdown) return null;
  const hasAny = Object.values(locationBreakdown).some(v => v.count > 0);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" />
          Live Location Breakdown
          {!hasAny && <span className="text-sm font-normal text-slate-400 ml-2">— no staff currently on duty</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary count cards */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(locationBreakdown).map(([lt, data]) => {
            const cfg = LOCATION_CONFIG[lt] || LOCATION_CONFIG['Facility'];
            return (
              <button
                key={lt}
                onClick={() => setExpandedType(expandedType === lt ? null : lt)}
                className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border} text-left transition-all hover:shadow-md ${expandedType === lt ? 'ring-2 ring-offset-1 ring-teal-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  {cfg.Icon && <cfg.Icon className={`w-5 h-5 ${cfg.text}`} />}
                  <Badge className={`${cfg.badge} border-0 text-xs`}>{data.count} on duty</Badge>
                </div>
                <p className={`text-2xl font-bold font-['Manrope'] ${cfg.text}`}>{data.count}</p>
                <p className={`text-xs ${cfg.text} font-medium mt-0.5`}>{lt}</p>
                {data.count > 0 && (
                  <p className="text-xs text-slate-400 mt-1">{expandedType === lt ? 'Click to collapse ▲' : 'Click to see staff ▼'}</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Expanded staff list */}
        {expandedType && locationBreakdown[expandedType]?.staff?.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className={`px-4 py-2 ${LOCATION_CONFIG[expandedType]?.bg || 'bg-slate-50'} border-b border-slate-200`}>
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                {LOCATION_CONFIG[expandedType]?.Icon && React.createElement(LOCATION_CONFIG[expandedType].Icon, { className: `w-4 h-4 ${LOCATION_CONFIG[expandedType]?.text}` })}
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
                      <p className="text-xs text-slate-500">{s.position} · {s.facility}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-mono">{loginTime.toLocaleTimeString()}</p>
                      <p className="text-xs text-slate-400">{h > 0 ? `${h}h ` : ''}{m}m on duty</p>
                      {s.status === 'late' && <Badge className="bg-red-100 text-red-700 border-0 text-xs">Late</Badge>}
                      {s.status === 'on_time' && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">On Time</Badge>}
                      {s.status === 'early' && <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Early</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ ADMIN REPORTS TAB ============
const AdminReportsTab = () => {
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [date, setDate] = useState(""); // empty = no date filter, show all records
  const [facilityFilter, setFacilityFilter] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch stats and facilities on mount
  useEffect(() => {
    authFetch(`${API}/admin/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); });
    authFetch(`${API}/data/facilities`)
      .then(r => r.ok ? r.json() : { facilities: [] })
      .then(d => setFacilities(d.facilities || []));
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.append("date", new Date(date).toISOString());
      if (facilityFilter) params.append("facility", facilityFilter);
      const res = await authFetch(`${API}/admin/attendance-report?${params}`);
      if (res.ok) setReport(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [date, facilityFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Admin attendance-report returns { attendance: [...] }
  const allRecords = report?.attendance || report?.records || [];
  const filteredRecords = allRecords.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.user_name?.toLowerCase().includes(q) || r.facility?.toLowerCase().includes(q) || r.position?.toLowerCase().includes(q);
  });

  // Summary counts from the loaded records
  const reportSummary = {
    late: allRecords.filter(r => r.status === 'late').length,
    on_time: allRecords.filter(r => r.status === 'on_time').length,
    early: allRecords.filter(r => r.status === 'early').length,
  };

  const statCards = [
    { label: "Today's Logins", value: stats?.today_logins ?? 0, icon: Activity, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Currently On Duty", value: stats?.currently_on_duty ?? 0, icon: Clock, color: "text-green-600", bg: "bg-green-50" },
    { label: "Late Today", value: stats?.today_late ?? 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "On Time Today", value: stats?.today_on_time ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Early Today", value: stats?.today_early ?? 0, icon: CalendarDays, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Total Records (All Time)", value: stats?.total_attendance ?? 0, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6" data-testid="admin-reports">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((c) => (
          <Card key={c.label} className="border-slate-200 shadow-sm">
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

      {/* Report summary from loaded records */}
      {allRecords.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-xs text-red-500">Late (in view)</p>
              <p className="text-xl font-bold text-red-600">{reportSummary.late}</p>
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs text-emerald-500">On Time (in view)</p>
              <p className="text-xl font-bold text-emerald-600">{reportSummary.on_time}</p>
            </div>
          </div>
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-sky-500 shrink-0" />
            <div>
              <p className="text-xs text-sky-500">Early (in view)</p>
              <p className="text-xl font-bold text-sky-600">{reportSummary.early}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" data-testid="admin-report-date" />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Facility</Label>
              <Select value={facilityFilter || "_none"} onValueChange={v => setFacilityFilter(v === "_none" ? "" : v)}>
                <SelectTrigger className="w-48" data-testid="admin-report-facility">
                  <SelectValue placeholder="All Facilities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">All Facilities</SelectItem>
                  {facilities.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-48">
              <Label className="text-xs text-slate-500 mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Name, facility..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="admin-report-search" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-['Manrope'] flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            Attendance Records
            {report && <Badge variant="outline" className="ml-2 text-xs">{filteredRecords.length} records</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No attendance records found</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map(r => (
                    <TableRow key={r.attendance_id}>
                      <TableCell className="font-medium">{r.user_name}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{r.position}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{r.facility}</TableCell>
                      <TableCell>
                        <Badge className={r.action === 'login' ? 'bg-teal-100 text-teal-700 border-0' : 'bg-slate-100 text-slate-600 border-0'}>
                          {r.action === 'login' ? 'Clock In' : 'Clock Out'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{new Date(r.timestamp).toLocaleTimeString()}</TableCell>
                      <TableCell className="text-sm capitalize">{r.shift_type?.replace('_', ' ') || '-'}</TableCell>
                      <TableCell>
                        {r.status === 'late' ? (
                          <Badge className="bg-red-100 text-red-700 border-0 text-xs">Late {r.late_display ? `(${r.late_display})` : ''}</Badge>
                        ) : r.status === 'on_time' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">On Time</Badge>
                        ) : r.status === 'early' ? (
                          <Badge className="bg-sky-100 text-sky-700 border-0 text-xs">Early</Badge>
                        ) : <span className="text-slate-400 text-xs">-</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============ ORG TREE (ADMIN SCOPED VIEW) ============
const OrgTreeAdminTab = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    authFetch(`${API}/admin/org-tree`)
      .then(r => r.ok ? r.json() : { tree: [] })
      .then(d => { setTree(d.tree || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));
  const totalUsers = tree.reduce((s, p) => s + (p.user_count || 0), 0);

  // Flatten all users for search
  const allUsers = tree.flatMap(p =>
    (p.districts || []).flatMap(d =>
      (d.org_units || []).flatMap(u =>
        (u.users || []).map(usr => ({
          ...usr,
          province: p.name,
          district: d.name,
          facility: u.name,
        }))
      )
    )
  );

  const q = search.toLowerCase().trim();
  const searchResults = q.length > 1
    ? allUsers.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.position?.toLowerCase().includes(q) ||
        u.facility?.toLowerCase().includes(q) ||
        u.district?.toLowerCase().includes(q)
      )
    : [];

  // Auto-expand nodes that contain search matches
  useEffect(() => {
    if (q.length > 1) {
      const newExp = {};
      tree.forEach(p => {
        (p.districts || []).forEach(d => {
          (d.org_units || []).forEach(u => {
            const hasMatch = (u.users || []).some(usr =>
              usr.name?.toLowerCase().includes(q) ||
              usr.position?.toLowerCase().includes(q)
            );
            if (hasMatch) {
              newExp[`prov-${p.id}`] = true;
              newExp[`dist-${d.id}`] = true;
              newExp[`unit-${u.id}`] = true;
            }
          });
        });
      });
      setExpanded(prev => ({ ...prev, ...newExp }));
    }
  }, [q, tree]);

  if (loading) return <div className="text-center py-12 text-slate-500">Loading organisation tree...</div>;

  if (tree.length === 0) return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="py-12 text-center text-slate-400">
        <Network className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No organisation data within your assigned scope.</p>
        <p className="text-sm mt-1">Contact your super user to assign your jurisdiction.</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Your Organisation Scope</h2>
          <p className="text-sm text-slate-500">{totalUsers} staff across {tree.length} province{tree.length !== 1 ? "s" : ""} in your jurisdiction</p>
        </div>
        <div className="relative sm:ml-auto w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff or roles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {q.length > 1 && (
        <Card className="border-teal-200 bg-teal-50/40">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm text-teal-700">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{search}"</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            {searchResults.length === 0 ? (
              <p className="text-sm text-slate-400">No staff or roles match your search.</p>
            ) : (
              <div className="space-y-1">
                {searchResults.map(u => (
                  <button
                    key={u.user_id}
                    onClick={() => setSelectedUser(u)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-teal-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.position} · {u.facility}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tree */}
      <div className="space-y-2">
        {tree.map((prov) => (
          <Card key={prov.id} className="border-slate-200 shadow-sm">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              onClick={() => toggle(`prov-${prov.id}`)}
            >
              <div className="flex items-center gap-3">
                {expanded[`prov-${prov.id}`] ? <ChevronDown className="w-4 h-4 text-teal-600" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <span className="font-semibold text-slate-800">{prov.name}</span>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{prov.districts?.length || 0} districts</span>
              </div>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <User2 className="w-3.5 h-3.5" />{prov.user_count} staff
              </span>
            </button>

            {expanded[`prov-${prov.id}`] && (
              <div className="border-t border-slate-100">
                {(prov.districts || []).map((dist) => (
                  <div key={dist.id}>
                    <button
                      className="w-full flex items-center justify-between px-8 py-2.5 hover:bg-slate-50 transition-colors"
                      onClick={() => toggle(`dist-${dist.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        {expanded[`dist-${dist.id}`] ? <ChevronDown className="w-3.5 h-3.5 text-teal-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                        <span className="text-slate-700 text-sm">{dist.name}</span>
                        <span className="text-xs text-slate-400">{dist.org_units?.length || 0} facilities</span>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <User2 className="w-3 h-3" />{dist.user_count}
                      </span>
                    </button>

                    {expanded[`dist-${dist.id}`] && (
                      <div className="border-t border-slate-50">
                        {(dist.org_units || []).length === 0 ? (
                          <p className="px-16 py-2 text-xs text-slate-400">No facilities</p>
                        ) : (dist.org_units || []).map((unit) => (
                          <div key={unit.id}>
                            <button
                              className="w-full flex items-center justify-between px-14 py-2 hover:bg-slate-50 transition-colors"
                              onClick={() => toggle(`unit-${unit.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                {expanded[`unit-${unit.id}`] ? <ChevronDown className="w-3 h-3 text-teal-500" /> : <ChevronRight className="w-3 h-3 text-slate-300" />}
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-600 text-sm">{unit.name}</span>
                              </div>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <User2 className="w-3 h-3" />{unit.users?.length || 0}
                              </span>
                            </button>

                            {expanded[`unit-${unit.id}`] && (
                              <div className="px-20 py-1 space-y-1 border-t border-slate-50">
                                {(unit.users || []).length === 0 ? (
                                  <p className="text-xs text-slate-400 py-1">No staff assigned</p>
                                ) : (unit.users || []).map((u) => (
                                  <button
                                    key={u.user_id}
                                    onClick={() => setSelectedUser({ ...u, facility: unit.name, district: dist.name, province: prov.name })}
                                    className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-teal-50 transition-colors text-left group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {u.name?.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-sm text-slate-700">{u.name}</span>
                                      <span className="text-xs text-slate-400">{u.position}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-400 capitalize">{u.assigned_shift?.replace("_", " ") || "—"}</span>
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

      {/* Staff Profile Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30" onClick={() => setSelectedUser(null)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white text-lg font-bold">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">{selectedUser.name}</h3>
                  <p className="text-sm text-teal-600">{selectedUser.position}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Facility</p>
                <p className="font-medium text-slate-800">{selectedUser.facility || "—"}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">District</p>
                <p className="font-medium text-slate-800">{selectedUser.district || "—"}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Province</p>
                <p className="font-medium text-slate-800">{selectedUser.province || "—"}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Shift</p>
                <p className="font-medium text-slate-800 capitalize">{selectedUser.assigned_shift?.replace("_", " ") || "—"}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {selectedUser.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{selectedUser.phone}</span>
                </div>
              )}
              {selectedUser.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{selectedUser.email}</span>
                </div>
              )}
              {selectedUser.created_at && (
                <div className="flex items-center gap-2 text-slate-600">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span>Joined {new Date(selectedUser.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">Employee ID: {selectedUser.user_id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Edit User Form Component
const EditUserForm = ({ user, positions, facilities, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    position: user?.position || "",
    facility: user?.facility || "",
    role: user?.role || "user"
  });
  const [shiftType, setShiftType] = useState(user?.assigned_shift || "morning");
  const [customStart, setCustomStart] = useState(user?.custom_shift_start || "");
  const [customEnd, setCustomEnd] = useState(user?.custom_shift_end || "");
  const [shiftConfig, setShiftConfig] = useState(null);
  const [savingShift, setSavingShift] = useState(false);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await authFetch(`${API}/admin/shifts`, { });
        if (res.ok) setShiftConfig(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchShifts();
  }, []);

  if (!user) return null;

  const isSuperUser = user.role === "superuser";

  const handleAssignShift = async () => {
    setSavingShift(true);
    try {
      const body = { shift_type: shiftType };
      if (shiftType === "custom") {
        body.custom_start = customStart;
        body.custom_end = customEnd;
      }
      const res = await authFetch(`${API}/admin/users/${user.user_id}/shift`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast.success("Shift assigned successfully");
      } else {
        const e = await res.json();
        toast.error(e.detail || "Failed to assign shift");
      }
    } catch {
      toast.error("Error assigning shift");
    } finally {
      setSavingShift(false);
    }
  };

  const shiftLabels = {
    morning: shiftConfig ? `Morning (${shiftConfig.morning_start} - ${shiftConfig.morning_end})` : "Morning",
    afternoon: shiftConfig ? `Afternoon (${shiftConfig.afternoon_start} - ${shiftConfig.afternoon_end})` : "Afternoon",
    night: shiftConfig ? `Night (${shiftConfig.night_start} - ${shiftConfig.night_end})` : "Night",
    four_off: shiftConfig ? `4-Off (${shiftConfig.four_off_start} - ${shiftConfig.four_off_end})` : "4-Off",
    on_call: shiftConfig ? `On Call (${shiftConfig.on_call_start || "00:00"} - ${shiftConfig.on_call_end || "23:59"})` : "On Call",
    self_select: "Allow Staff to Set Own Shift",
    custom: "Custom Times"
  };

  return (
    <div className="space-y-4 pt-4">
      {isSuperUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
          <Shield className="w-4 h-4 inline mr-1" />
          Super User accounts cannot be edited by admins.
        </div>
      )}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          disabled={isSuperUser}
        />
      </div>

      <div className="space-y-2">
        <Label>Position</Label>
        <Select 
          value={formData.position} 
          onValueChange={(v) => setFormData(prev => ({ ...prev, position: v }))}
          disabled={isSuperUser}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {positions.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Facility</Label>
        <Select 
          value={formData.facility} 
          onValueChange={(v) => setFormData(prev => ({ ...prev, facility: v }))}
          disabled={isSuperUser}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {facilities.map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <div className="text-sm text-slate-500 bg-slate-100 p-2 rounded flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="capitalize">{formData.role}</span>
          <span className="text-xs text-slate-400">(Only Super Users can change roles)</span>
        </div>
      </div>

      {!isSuperUser && (
        <Button 
          className="w-full bg-teal-700 hover:bg-teal-800"
          onClick={() => onSave(user.user_id, formData)}
          data-testid="admin-save-user-btn"
        >
          Save Changes
        </Button>
      )}

      {/* Shift Assignment Section */}
      <div className="border-t pt-4 mt-4 space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-600" />
          Assign Shift
        </Label>
        <p className="text-xs text-slate-500">Shift times are defined by the Super User. Select which shift this user should follow.</p>
        <Select value={shiftType} onValueChange={setShiftType}>
          <SelectTrigger data-testid="admin-shift-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(shiftLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {shiftType === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Start Time</Label>
              <Input type="time" value={customStart} onChange={(e) => setCustomStart(e.target.value)} data-testid="admin-custom-shift-start" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">End Time</Label>
              <Input type="time" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} data-testid="admin-custom-shift-end" />
            </div>
          </div>
        )}

        <Button 
          className="w-full bg-teal-600 hover:bg-teal-700"
          onClick={handleAssignShift}
          disabled={savingShift}
          data-testid="admin-assign-shift-btn"
        >
          {savingShift ? "Assigning..." : "Assign Shift"}
        </Button>
      </div>
    </div>
  );
};

// ─── Task View Modal ─────────────────────────────────────────────────────────
function AdminTaskModal({ taskModal, setTaskModal }) {
  return (
    <Dialog open={taskModal.open} onOpenChange={(open) => setTaskModal((prev) => ({ ...prev, open }))}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            Tasks Completed During Shift
          </DialogTitle>
          {taskModal.data?.user_name && (
            <p className="text-sm text-slate-500">
              {taskModal.data.user_name} &mdash; {taskModal.data.facility}
            </p>
          )}
          {taskModal.data?.submitted_at && (
            <p className="text-xs text-slate-400">
              Submitted: {new Date(taskModal.data.submitted_at).toLocaleString()}
            </p>
          )}
        </DialogHeader>

        {taskModal.loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : taskModal.data?.has_tasks ? (
          <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
            {(Array.isArray(taskModal.data.tasks) ? taskModal.data.tasks : []).map((task, i) => (
              <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-teal-600 font-mono text-xs mt-0.5 shrink-0">{task.order || i + 1}.</span>
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
  );
}

export default AdminDashboard;
