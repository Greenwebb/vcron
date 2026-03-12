import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Building2, Briefcase } from "lucide-react";
import { API } from "@/App";

const CompleteRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
  
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [formData, setFormData] = useState({
    position: "",
    facility: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch facilities and positions
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
  }, [user, navigate]);

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/complete-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile completed!");
        navigate("/dashboard", { state: { user: data }, replace: true });
      } else {
        toast.error(data.detail || "Failed to complete registration");
      }
    } catch (error) {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-teal-600" />
          </div>
          <CardTitle className="text-2xl font-bold font-['Manrope'] text-slate-900">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-slate-500">
            Hi {user?.name}, please select your position and facility to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="position" className="text-slate-700">Position/Designation</Label>
              <Select 
                value={formData.position} 
                onValueChange={(value) => handleSelectChange("position", value)}
                required
              >
                <SelectTrigger className="h-12 border-slate-200" data-testid="position-select">
                  <Briefcase className="w-5 h-5 text-slate-400 mr-2" />
                  <SelectValue placeholder="Select your position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facility" className="text-slate-700">Facility</Label>
              <Select 
                value={formData.facility} 
                onValueChange={(value) => handleSelectChange("facility", value)}
                required
              >
                <SelectTrigger className="h-12 border-slate-200" data-testid="facility-select">
                  <Building2 className="w-5 h-5 text-slate-400 mr-2" />
                  <SelectValue placeholder="Select your facility" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {facilities.map((facility) => (
                    <SelectItem key={facility} value={facility}>
                      {facility}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white rounded-xl"
              disabled={loading || !formData.position || !formData.facility}
              data-testid="complete-registration-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Continue to Dashboard"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteRegistration;
