import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  ArrowLeft, 
  LogIn, 
  LogOut, 
  MapPin,
  Calendar
} from "lucide-react";
import { API } from "@/App";

const History = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API}/attendance/me?limit=100`, {
          credentials: "include"
        });
        
        if (response.ok) {
          const data = await response.json();
          setRecords(data.records || []);
          setTotal(data.total || 0);
        } else if (response.status === 401) {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  // Group records by date
  const groupedRecords = records.reduce((groups, record) => {
    const date = new Date(record.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {});

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
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
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
              <Clock className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 font-['Manrope']">Attendance History</h1>
              <p className="text-xs text-slate-500">{total} total records</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {records.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">No attendance records yet</h3>
              <p className="text-slate-500 text-sm">
                Your attendance history will appear here once you start reporting for duty.
              </p>
              <Button 
                className="mt-6 bg-teal-700 hover:bg-teal-800"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="space-y-6">
              {Object.entries(groupedRecords).map(([date, dayRecords]) => (
                <div key={date}>
                  <h2 className="text-sm font-medium text-slate-500 mb-3 sticky top-0 bg-slate-50 py-2">
                    {date}
                  </h2>
                  <div className="space-y-3">
                    {dayRecords.map((record) => (
                      <Card 
                        key={record.attendance_id} 
                        className="border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                        data-testid={`record-${record.attendance_id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                record.action === "login" 
                                  ? "bg-emerald-50" 
                                  : "bg-red-50"
                              }`}>
                                {record.action === "login" ? (
                                  <LogIn className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <LogOut className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {record.action === "login" ? "Reported for Duty" : "Ended Shift"}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                  {record.facility}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant="outline" 
                                className={record.action === "login" 
                                  ? "border-emerald-200 text-emerald-700 bg-emerald-50" 
                                  : "border-red-200 text-red-700 bg-red-50"
                                }
                              >
                                {record.action === "login" ? "LOGIN" : "LOGOUT"}
                              </Badge>
                              <p className="text-sm font-mono text-slate-600 mt-2">
                                {new Date(record.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          {/* Location */}
                          {record.latitude && record.longitude && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" />
                              <span className="font-mono">
                                {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                              </span>
                              {!record.synced && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  Pending sync
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
};

export default History;
