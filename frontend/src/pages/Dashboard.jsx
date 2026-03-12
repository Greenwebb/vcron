import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Clock, 
  MapPin, 
  LogIn, 
  LogOut, 
  History, 
  Settings, 
  User, 
  Wifi, 
  WifiOff,
  Building2,
  Briefcase,
  Menu,
  X
} from "lucide-react";
import { API } from "@/App";
import localforage from "localforage";

// Initialize localforage for offline storage
const offlineStore = localforage.createInstance({
  name: "vchron-offline"
});

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineRecords();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Always fetch fresh user data from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: "include"
        });
        
        if (response.ok) {
          const userData = await response.json();
          // Check if user needs to complete registration
          if (!userData.position || !userData.facility) {
            navigate("/complete-registration", { state: { user: userData } });
            return;
          }
          setUser(userData);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Fetch attendance status
  const fetchStatus = useCallback(async () => {
    if (!isOnline) return;
    
    try {
      const response = await fetch(`${API}/attendance/status`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  }, [isOnline]);

  useEffect(() => {
    if (user) {
      fetchStatus();
    }
  }, [user, fetchStatus]);

  // Get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Request location on mount
  useEffect(() => {
    getCurrentLocation()
      .then(setCurrentLocation)
      .catch((error) => {
        console.error("Location error:", error);
        setLocationError(error.message);
      });
  }, []);

  // Sync offline records
  const syncOfflineRecords = async () => {
    try {
      const offlineRecords = await offlineStore.getItem("pendingRecords") || [];
      
      if (offlineRecords.length === 0) return;

      const response = await fetch(`${API}/attendance/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: offlineRecords }),
        credentials: "include"
      });

      if (response.ok) {
        await offlineStore.setItem("pendingRecords", []);
        setPendingSync(0);
        toast.success(`Synced ${offlineRecords.length} offline record(s)`);
        fetchStatus();
      }
    } catch (error) {
      console.error("Sync error:", error);
    }
  };

  // Check pending sync count
  useEffect(() => {
    const checkPending = async () => {
      const records = await offlineStore.getItem("pendingRecords") || [];
      setPendingSync(records.length);
    };
    checkPending();
  }, []);

  // Handle attendance action
  const handleAttendance = async (action) => {
    setActionLoading(true);

    try {
      // Get location
      let coords = currentLocation;
      try {
        coords = await getCurrentLocation();
        setCurrentLocation(coords);
      } catch (error) {
        console.warn("Could not get location:", error);
      }

      const record = {
        action,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        offline_id: `offline_${Date.now()}`
      };

      if (isOnline) {
        const response = await fetch(`${API}/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
          credentials: "include"
        });

        if (response.ok) {
          toast.success(
            action === "login" 
              ? "Successfully reported for duty!" 
              : "Shift ended successfully!"
          );
          fetchStatus();
        } else {
          const error = await response.json();
          toast.error(error.detail || "Failed to record attendance");
        }
      } else {
        // Save offline
        const offlineRecords = await offlineStore.getItem("pendingRecords") || [];
        offlineRecords.push(record);
        await offlineStore.setItem("pendingRecords", offlineRecords);
        setPendingSync(offlineRecords.length);
        
        toast.info(
          action === "login"
            ? "Saved offline. Will sync when online."
            : "Saved offline. Will sync when online."
        );

        // Update local status
        setStatus({
          status: action === "login" ? "on_duty" : "off_duty",
          last_action: { action, timestamp: new Date().toISOString() }
        });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Attendance error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("vchron_token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isOnDuty = status?.status === "on_duty";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Changes will sync when connected.</span>
          {pendingSync > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingSync} pending
            </Badge>
          )}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 font-['Manrope']">V-Chron</h1>
              <p className="text-xs text-slate-500">The Truth of Time</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4">
            {isOnline && (
              <div className="flex items-center gap-1 text-emerald-600 text-sm">
                <Wifi className="w-4 h-4" />
                <span>Online</span>
              </div>
            )}
            <Button 
              variant="ghost" 
              className="text-slate-600"
              onClick={() => navigate("/history")}
              data-testid="history-nav-btn"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            {user?.role === "admin" && (
              <Button 
                variant="ghost" 
                className="text-slate-600"
                onClick={() => navigate("/admin")}
                data-testid="admin-nav-btn"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button 
              variant="outline" 
              className="border-slate-200"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-600"
              onClick={() => { navigate("/history"); setMobileMenuOpen(false); }}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            {user?.role === "admin" && (
              <Button 
                variant="ghost" 
                className="w-full justify-start text-slate-600"
                onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-600"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* User Info Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center">
                {user?.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-teal-600" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 font-['Manrope']" data-testid="user-name">
                  {user?.name}
                </h2>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span data-testid="user-position">{user?.position}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span data-testid="user-facility">{user?.facility}</span>
                  </div>
                </div>
              </div>
              <Badge 
                className={isOnDuty ? "status-on-duty" : "status-off-duty"}
                data-testid="status-badge"
              >
                {isOnDuty ? "On Duty" : "Off Duty"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Location Status */}
        <div className="flex items-center gap-2 text-sm text-slate-500 px-2">
          <MapPin className="w-4 h-4" />
          {locationError ? (
            <span className="text-amber-600">Location access denied. Enable for accurate tracking.</span>
          ) : currentLocation ? (
            <span className="font-mono text-xs">
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </span>
          ) : (
            <span>Getting location...</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-4">
          {/* Report for Duty Button */}
          <button
            onClick={() => handleAttendance("login")}
            disabled={actionLoading || isOnDuty}
            className={`action-button-login h-32 md:h-40 flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${isOnDuty ? 'opacity-50' : ''}`}
            data-testid="report-duty-btn"
          >
            {actionLoading ? (
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-10 h-10" />
                <span className="text-xl font-bold font-['Manrope']">Report for Duty</span>
                <span className="text-sm opacity-80">Clock in for your shift</span>
              </>
            )}
          </button>

          {/* End Shift Button */}
          <button
            onClick={() => handleAttendance("logout")}
            disabled={actionLoading || !isOnDuty}
            className={`action-button-logout h-32 md:h-40 flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${!isOnDuty ? 'opacity-50' : ''}`}
            data-testid="end-shift-btn"
          >
            {actionLoading ? (
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogOut className="w-10 h-10" />
                <span className="text-xl font-bold font-['Manrope']">End Shift</span>
                <span className="text-sm opacity-80">Clock out from your shift</span>
              </>
            )}
          </button>
        </div>

        {/* Last Action Info */}
        {status?.last_action && (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">
                Last action: <span className="font-medium text-slate-700">
                  {status.last_action.action === "login" ? "Reported for duty" : "Ended shift"}
                </span> at{" "}
                <span className="font-mono text-xs text-slate-600">
                  {new Date(status.last_action.timestamp).toLocaleString()}
                </span>
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
