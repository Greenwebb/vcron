import { useState, useEffect, useMemo } from "react";
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
  X
} from "lucide-react";
import { API } from "@/App";
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

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facilitiesRes, positionsRes] = await Promise.all([
          fetch(`${API}/facilities`),
          fetch(`${API}/positions`)
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
  const fetchRealtime = async () => {
    try {
      const response = await fetch(`${API}/admin/attendance/realtime`, {
        credentials: "include"
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
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (facilityFilter !== "all") params.append("facility", facilityFilter);
      
      const response = await fetch(`${API}/admin/users?${params}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch attendance
  const fetchAttendance = async () => {
    try {
      const params = new URLSearchParams();
      if (facilityFilter !== "all") params.append("facility", facilityFilter);
      if (selectedDate) params.append("date", selectedDate.toISOString());
      if (searchQuery) params.append("user_name", searchQuery);
      
      const response = await fetch(`${API}/admin/attendance?${params}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.records || []);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/admin/notifications?limit=50`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setNotifCount(data.unread_count || 0);
      }
    } catch (e) { console.error("Error fetching notifications:", e); }
  };

  const markNotifRead = async (id) => {
    await fetch(`${API}/admin/notifications/${id}/read`, { method: "PUT", credentials: "include" });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch(`${API}/admin/notifications/read-all`, { method: "PUT", credentials: "include" });
    fetchNotifications();
  };

  useEffect(() => {
    fetchRealtime();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "attendance") fetchAttendance();
    if (activeTab === "notifications") fetchNotifications();
  }, [activeTab, facilityFilter, selectedDate, searchQuery]);

  // Auto-refresh realtime data
  useEffect(() => {
    if (activeTab === "realtime") {
      const interval = setInterval(fetchRealtime, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Update user
  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await fetch(`${API}/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include"
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

      const response = await fetch(`${API}/admin/export?${params}`, {
        credentials: "include"
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

      const response = await fetch(`${API}/admin/send-backup?${params}`, {
        method: "POST",
        credentials: "include"
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
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 font-['Manrope']">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">V-Chron Management</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="realtime" data-testid="tab-realtime">
              <Activity className="w-4 h-4 mr-2" />
              Real-time
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance">
              <Clock className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications" className="relative">
              <Bell className="w-4 h-4 mr-2" />
              Alerts
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifCount}</span>
              )}
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
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                                    On Duty
                                  </Badge>
                                  <p className="text-xs text-slate-500 mt-1 font-mono">
                                    {loginTime.toLocaleTimeString()}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {hoursOnDuty}h {minsOnDuty}m
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
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-500">
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
        </Tabs>
      </main>
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
        const res = await fetch(`${API}/admin/shifts`, { credentials: "include" });
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
      const res = await fetch(`${API}/admin/users/${user.user_id}/shift`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include"
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

export default AdminDashboard;
