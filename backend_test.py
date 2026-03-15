import requests
import json
import sys
from datetime import datetime
import uuid

class VChronAPITester:
    def __init__(self, base_url="https://health-duty-track.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.session_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        # Add auth headers
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if self.session_token:
            test_headers['Cookie'] = f'session_token={self.session_token}'
            
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}

    def test_basic_endpoints(self):
        """Test basic unauthenticated endpoints"""
        self.log("=== Testing Basic Endpoints ===")
        
        # Test root
        self.run_test("API Root", "GET", "", 200)
        
        # Test health check
        self.run_test("Health Check", "GET", "health", 200)
        
        # Test facilities endpoint
        success, facilities_data = self.run_test("Get Facilities", "GET", "facilities", 200)
        if success and isinstance(facilities_data, dict):
            facilities = facilities_data.get('facilities', [])
            self.log(f"   Found {len(facilities)} facilities")
            if len(facilities) == 47:
                self.log(f"   ✅ All 47 facilities present")
            else:
                self.log(f"   ❌ Expected 47 facilities, got {len(facilities)}")
        
        # Test positions endpoint  
        success, positions_data = self.run_test("Get Positions", "GET", "positions", 200)
        if success and isinstance(positions_data, dict):
            positions = positions_data.get('positions', [])
            self.log(f"   Found {len(positions)} positions")
            if len(positions) >= 10:
                self.log(f"   ✅ Good number of positions available")
            else:
                self.log(f"   ⚠️  Only {len(positions)} positions available")
                
    def test_user_registration(self):
        """Test user registration"""
        self.log("=== Testing User Registration ===")
        
        # Create unique test user
        timestamp = int(datetime.now().timestamp())
        test_email = f"test.user.{timestamp}@example.com"
        
        user_data = {
            "name": "Test User VChron",
            "email": test_email,
            "password": "TestPass123!",
            "position": "Nurse",
            "facility": "Mkushi District Hospital"
        }
        
        success, response = self.run_test(
            "User Registration", 
            "POST", 
            "auth/register", 
            200, 
            user_data
        )
        
        if success and isinstance(response, dict):
            self.token = response.get('access_token')
            user = response.get('user', {})
            self.test_user_id = user.get('user_id')
            self.log(f"   ✅ User created with ID: {self.test_user_id}")
            self.log(f"   ✅ Auth token received")
            return True
        else:
            self.log(f"   ❌ Registration failed")
            return False
            
    def test_user_login(self):
        """Test user login with the registered user"""
        self.log("=== Testing User Login ===")
        
        if not self.test_user_id:
            self.log("   ❌ No test user available for login test")
            return False
            
        # We'll create a new user for login test since we already have one registered
        timestamp = int(datetime.now().timestamp()) + 1
        test_email = f"test.login.{timestamp}@example.com"
        
        # First register a user for login test
        user_data = {
            "name": "Test Login User",
            "email": test_email,
            "password": "LoginPass123!",
            "position": "Clinical Officer", 
            "facility": "Chalata Rural Health Centre"
        }
        
        reg_success, _ = self.run_test(
            "Register Login Test User",
            "POST",
            "auth/register", 
            200,
            user_data
        )
        
        if not reg_success:
            return False
            
        # Now test login
        login_data = {
            "email": test_email,
            "password": "LoginPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            login_data
        )
        
        if success and isinstance(response, dict):
            login_token = response.get('access_token')
            user = response.get('user', {})
            self.log(f"   ✅ Login successful for user: {user.get('name')}")
            self.log(f"   ✅ Login token received")
            return True
        else:
            self.log(f"   ❌ Login failed")
            return False
            
    def test_authenticated_endpoints(self):
        """Test authenticated endpoints"""
        self.log("=== Testing Authenticated Endpoints ===")
        
        if not self.token:
            self.log("   ❌ No auth token available")
            return False
            
        # Test get current user
        success, user_data = self.run_test(
            "Get Current User",
            "GET",
            "auth/me", 
            200
        )
        
        if success:
            self.log(f"   ✅ User data retrieved: {user_data.get('name', 'Unknown')}")
            
        # Test attendance status
        self.run_test(
            "Get Attendance Status",
            "GET", 
            "attendance/status",
            200
        )
        
        # Test attendance history
        self.run_test(
            "Get Attendance History", 
            "GET",
            "attendance/me",
            200
        )
        
        # Test create attendance (login)
        attendance_data = {
            "action": "login",
            "latitude": -13.5317,
            "longitude": 28.5542
        }
        
        success, attendance_response = self.run_test(
            "Create Attendance (Login)",
            "POST",
            "attendance",
            200,
            attendance_data
        )
        
        if success:
            self.log(f"   ✅ Attendance record created")
            
        # Test create attendance (logout)
        logout_data = {
            "action": "logout", 
            "latitude": -13.5317,
            "longitude": 28.5542
        }
        
        self.run_test(
            "Create Attendance (Logout)",
            "POST", 
            "attendance",
            200,
            logout_data
        )
        
    def test_admin_endpoints(self):
        """Test admin endpoints (will likely fail for regular user)"""
        self.log("=== Testing Admin Endpoints (Expected to fail for regular user) ===")
        
        if not self.token:
            self.log("   ❌ No auth token available")
            return False
            
        # These should return 403 for regular users
        self.run_test(
            "Admin Get Users (Should fail)",
            "GET",
            "admin/users",
            403  # Expecting 403 Forbidden
        )
        
        self.run_test(
            "Admin Get Attendance (Should fail)", 
            "GET",
            "admin/attendance",
            403  # Expecting 403 Forbidden
        )
        
        self.run_test(
            "Admin Realtime (Should fail)",
            "GET", 
            "admin/attendance/realtime",
            403  # Expecting 403 Forbidden
        )

    def test_error_cases(self):
        """Test various error cases"""
        self.log("=== Testing Error Cases ===")
        
        # Test registration with invalid data
        invalid_user = {
            "name": "Test",
            "email": "invalid-email",
            "password": "123", 
            "position": "Invalid Position",
            "facility": "Invalid Facility"
        }
        
        self.run_test(
            "Registration with Invalid Data",
            "POST",
            "auth/register", 
            422,  # Expecting validation error
            invalid_user
        )
        
        # Test login with wrong credentials
        wrong_creds = {
            "email": "nonexistent@example.com",
            "password": "wrongpass"
        }
        
        self.run_test(
            "Login with Wrong Credentials",
            "POST",
            "auth/login",
            401,  # Expecting unauthorized
            wrong_creds
        )
        
        # Test protected endpoint without auth
        original_token = self.token
        self.token = None
        
        self.run_test(
            "Protected Endpoint Without Auth",
            "GET",
            "auth/me",
            401  # Expecting unauthorized
        )
        
        # Restore token
        self.token = original_token

    def run_all_tests(self):
        """Run all tests"""
        self.log("🚀 Starting V-Chron API Tests")
        self.log(f"🎯 Testing against: {self.base_url}")
        
        try:
            self.test_basic_endpoints()
            
            if self.test_user_registration():
                self.test_user_login()
                self.test_authenticated_endpoints()
                self.test_admin_endpoints()
                
            self.test_error_cases()
            
        except KeyboardInterrupt:
            self.log("❌ Tests interrupted by user")
        except Exception as e:
            self.log(f"❌ Test suite failed with error: {str(e)}")
            
        finally:
            # Print summary
            self.log("=" * 50)
            self.log(f"📊 TEST SUMMARY")
            self.log(f"   Tests Run: {self.tests_run}")
            self.log(f"   Tests Passed: {self.tests_passed}")
            self.log(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0.0%")
            
            if self.tests_passed == self.tests_run:
                self.log("🎉 All tests passed!")
                return 0
            else:
                self.log("⚠️  Some tests failed")
                return 1

def main():
    tester = VChronAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())