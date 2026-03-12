import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Clock, Mail, Lock, User, Building2, Briefcase, ArrowLeft, MapPin, Phone } from "lucide-react";
import { API } from "@/App";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [positions, setPositions] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    email: "",
    password: "",
    confirmPassword: "",
    position: "",
    province: "",
    district: "",
    facility: ""
  });

  // Fetch provinces and positions on mount
  useEffect(() => {
    const fetchData = async () => {
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
    
    fetchData();
  }, []);

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
        // Reset district and facility when province changes
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
        // Reset facility when district changes
        setFormData(prev => ({ ...prev, facility: "" }));
      } catch (error) {
        console.error("Error fetching facilities:", error);
      }
    };
    
    fetchFacilities();
  }, [formData.district]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone_number: formData.phone_number,
          email: formData.email,
          password: formData.password,
          position: formData.position,
          province: formData.province,
          district: formData.district,
          facility: formData.facility
        }),
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("vchron_token", data.access_token);
        toast.success("Account created successfully!");
        navigate("/dashboard", { state: { user: data.user } });
      } else {
        toast.error(data.detail || "Registration failed");
      }
    } catch (error) {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Button 
          variant="ghost" 
          className="text-slate-600"
          onClick={() => navigate('/')}
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 pb-8">
        <Card className="w-full max-w-md border-slate-200 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold font-['Manrope'] text-slate-900">
              Create Account
            </CardTitle>
            <CardDescription className="text-slate-500">
              Join V-Chron healthcare attendance system
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google Sign Up */}
            <Button 
              variant="outline" 
              className="w-full h-12 border-slate-200 hover:bg-slate-50"
              onClick={handleGoogleSignup}
              data-testid="google-signup-btn"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-slate-400">
                or
              </span>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 h-12 border-slate-200"
                    required
                    data-testid="name-input"
                  />
                </div>
              </div>

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
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-12 border-slate-200"
                    required
                    data-testid="email-input"
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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 h-12 border-slate-200"
                    required
                    data-testid="password-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 h-12 border-slate-200"
                    required
                    data-testid="confirm-password-input"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-teal-700 hover:bg-teal-800 text-white rounded-xl"
                disabled={loading || !formData.position || !formData.province || !formData.district || !formData.facility}
                data-testid="register-submit-btn"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className="text-teal-600 hover:text-teal-700 font-medium"
                data-testid="login-link"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
