import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Building2, Briefcase, MapPin, Phone } from "lucide-react";
import { API } from "@/App";

const CompleteRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
  
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [formData, setFormData] = useState({
    phone_number: "",
    position: "",
    province: "",
    district: "",
    facility: ""
  });

  useEffect(() => {
    // Check if user is already authenticated via cookie
    const checkAndFetch = async () => {
      if (!user) {
        try {
          const response = await fetch(`${API}/auth/me`, {
            credentials: "include"
          });
          if (!response.ok) {
            navigate("/login");
            return;
          }
        } catch (error) {
          navigate("/login");
          return;
        }
      }

      // Fetch provinces and positions
      try {
        const [provincesRes, positionsRes] = await Promise.all([
          fetch(`${API}/provinces`),
          fetch(`${API}/positions`)
        ]);
        
        const provincesData = await provincesRes.json();
        const positionsData = await positionsRes.json();
        
        setProvinces(provincesData.provinces || []);
        setPositions(positionsData.positions || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    checkAndFetch();
  }, [user, navigate]);

  // Fetch districts when province changes
  useEffect(() => {
    if (!formData.province) {
      setDistricts([]);
      setFacilities([]);
      return;
    }

    const fetchDistricts = async () => {
      try {
        const response = await fetch(`${API}/districts/${encodeURIComponent(formData.province)}`);
        const data = await response.json();
        setDistricts(data.districts || []);
        setFormData(prev => ({ ...prev, district: "", facility: "" }));
        setFacilities([]);
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    
    fetchDistricts();
  }, [formData.province]);

  // Fetch facilities when district changes
  useEffect(() => {
    if (!formData.district) {
      setFacilities([]);
      return;
    }

    const fetchFacilities = async () => {
      try {
        const response = await fetch(`${API}/facilities/${encodeURIComponent(formData.district)}`);
        const data = await response.json();
        setFacilities(data.facilities || []);
        setFormData(prev => ({ ...prev, facility: "" }));
      } catch (error) {
        console.error("Error fetching facilities:", error);
      }
    };
    
    fetchFacilities();
  }, [formData.district]);

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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
        window.location.href = "/dashboard";
      } else {
        toast.error(data.detail || "Failed to complete registration");
        setLoading(false);
      }
    } catch (error) {
      toast.error("Connection error. Please try again.");
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
            Hi {user?.name || "there"}, please complete your profile to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-slate-700">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  placeholder="+260 97X XXX XXX"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="pl-10 h-12 border-slate-200"
                  required
                  data-testid="phone-input"
                />
              </div>
            </div>

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
              <Label htmlFor="province" className="text-slate-700">Province</Label>
              <Select 
                value={formData.province} 
                onValueChange={(value) => handleSelectChange("province", value)}
                required
              >
                <SelectTrigger className="h-12 border-slate-200" data-testid="province-select">
                  <MapPin className="w-5 h-5 text-slate-400 mr-2" />
                  <SelectValue placeholder="Select your province" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.name}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="text-slate-700">District</Label>
              <Select 
                value={formData.district} 
                onValueChange={(value) => handleSelectChange("district", value)}
                disabled={!formData.province || districts.length === 0}
                required
              >
                <SelectTrigger className="h-12 border-slate-200" data-testid="district-select">
                  <MapPin className="w-5 h-5 text-slate-400 mr-2" />
                  <SelectValue placeholder={formData.province ? (districts.length ? "Select your district" : "No districts available") : "Select province first"} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
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
                disabled={!formData.district || facilities.length === 0}
                required
              >
                <SelectTrigger className="h-12 border-slate-200" data-testid="facility-select">
                  <Building2 className="w-5 h-5 text-slate-400 mr-2" />
                  <SelectValue placeholder={formData.district ? (facilities.length ? "Select your facility" : "No facilities available") : "Select district first"} />
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
              disabled={loading || !formData.phone_number || !formData.position || !formData.province || !formData.district || !formData.facility}
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
