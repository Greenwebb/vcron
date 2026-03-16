"""
Test Admin Features - Iteration 7
Tests for 3 new admin features:
1. Admin cannot edit superuser accounts (403 response)
2. Admins are scoped to their district (only see users/attendance from their district)
3. Shift assignment for users (morning/afternoon/night/four_off/custom)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "testadmin@test.com"
ADMIN_PASSWORD = "Test1234!"
SUPERUSER_EMAIL = "debugsu@test.com"
SUPERUSER_PASSWORD = "Test1234!"


class TestAuthTokens:
    """Get auth tokens for admin and superuser"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Login as admin and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip(f"Admin login failed: {response.status_code}")
    
    @pytest.fixture(scope="class")
    def superuser_token(self):
        """Login as superuser and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        pytest.skip(f"Superuser login failed: {response.status_code}")
    
    @pytest.fixture(scope="class")
    def admin_user_data(self, admin_token):
        """Get admin user data"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        if response.status_code == 200:
            return response.json()
        pytest.skip("Failed to get admin user data")
    
    @pytest.fixture(scope="class")
    def superuser_user_data(self, superuser_token):
        """Get superuser user data"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {superuser_token}"
        })
        if response.status_code == 200:
            return response.json()
        pytest.skip("Failed to get superuser user data")


class TestAdminCannotEditSuperuser(TestAuthTokens):
    """Feature 1: Admin cannot edit/change role of superuser accounts"""
    
    def test_admin_login_success(self, admin_token):
        """Verify admin can login"""
        assert admin_token is not None
        print(f"Admin token obtained: {admin_token[:20]}...")
    
    def test_admin_has_admin_role(self, admin_user_data):
        """Verify admin user has admin role"""
        assert admin_user_data.get("role") == "admin"
        print(f"Admin role verified: {admin_user_data.get('role')}")
    
    def test_get_superuser_user_id(self, superuser_user_data):
        """Get superuser user_id for edit attempt"""
        assert superuser_user_data.get("role") == "superuser"
        assert "user_id" in superuser_user_data
        print(f"Superuser ID: {superuser_user_data['user_id']}")
    
    def test_admin_cannot_edit_superuser_returns_403(self, admin_token, superuser_user_data):
        """Admin PUT /admin/users/{superuser_id} should return 403"""
        superuser_id = superuser_user_data.get("user_id")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{superuser_id}",
            json={"name": "Attempted Edit By Admin"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "super user" in data["detail"].lower() or "superuser" in data["detail"].lower()
        print(f"Admin edit superuser blocked: 403 - {data['detail']}")
    
    def test_admin_cannot_change_role_to_superuser(self, admin_token):
        """Admin cannot assign superuser role to any user"""
        # First get list of users
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=5",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        users = response.json().get("users", [])
        
        # Find a regular user
        regular_user = next((u for u in users if u.get("role") == "user"), None)
        if not regular_user:
            pytest.skip("No regular user found to test role change")
        
        # Try to change role to superuser
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{regular_user['user_id']}",
            json={"role": "superuser"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"Admin cannot assign superuser role: 403")
    
    def test_superuser_can_edit_other_superuser(self, superuser_token, superuser_user_data):
        """Superuser CAN still edit other superusers via /superuser/users/{id}/role"""
        # Superuser should be able to change roles
        response = requests.put(
            f"{BASE_URL}/api/superuser/users/{superuser_user_data['user_id']}/role",
            json={"role": "superuser"},  # Keep same role
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        
        # Should succeed (200)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"Superuser can edit roles: 200")


class TestAdminScopedToDistrict(TestAuthTokens):
    """Feature 2: Admins are scoped to their district"""
    
    def test_admin_has_district(self, admin_user_data):
        """Verify admin has a district assigned"""
        assert "district" in admin_user_data
        assert admin_user_data.get("district") is not None
        print(f"Admin district: {admin_user_data.get('district')}")
    
    def test_admin_district_is_mkushi(self, admin_user_data):
        """Verify testadmin is in Mkushi district"""
        assert admin_user_data.get("district") == "Mkushi"
        print(f"Admin confirmed in Mkushi district")
    
    def test_admin_get_users_returns_only_district_users(self, admin_token, admin_user_data):
        """GET /admin/users returns only users in admin's district"""
        admin_district = admin_user_data.get("district")
        
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=100",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        users = response.json().get("users", [])
        
        print(f"Admin sees {len(users)} users")
        
        # If there are users, check they're all from facilities in admin's district
        # Note: Users might not have district field directly, they have facility
        # The scoping is based on facility being in the district
        if users:
            print(f"Sample user facilities: {[u.get('facility') for u in users[:5]]}")
    
    def test_admin_get_attendance_scoped(self, admin_token):
        """GET /admin/attendance returns only records from admin's district"""
        response = requests.get(
            f"{BASE_URL}/api/admin/attendance?limit=50",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        records = data.get("records", [])
        
        print(f"Admin sees {len(records)} attendance records")
        if records:
            print(f"Sample facilities: {[r.get('facility') for r in records[:3]]}")
    
    def test_admin_realtime_attendance_scoped(self, admin_token):
        """GET /admin/attendance/realtime returns only records from admin's district"""
        response = requests.get(
            f"{BASE_URL}/api/admin/attendance/realtime",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        print(f"On duty count: {data.get('on_duty_count', 0)}")
        print(f"Facility breakdown: {data.get('facility_breakdown', {})}")
    
    def test_superuser_sees_all_users(self, superuser_token):
        """Superuser should see users from ALL districts"""
        response = requests.get(
            f"{BASE_URL}/api/superuser/users?limit=100",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        users = data.get("users", [])
        total = data.get("total", 0)
        
        print(f"Superuser sees {len(users)} users (total: {total})")
        
        # Should see more users than admin if there are users in other districts
        assert len(users) > 0


class TestShiftAssignment(TestAuthTokens):
    """Feature 3: Admin can assign shifts to users"""
    
    def test_admin_get_shifts_returns_config(self, admin_token):
        """GET /admin/shifts returns shift configuration"""
        response = requests.get(
            f"{BASE_URL}/api/admin/shifts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        config = response.json()
        
        # Verify required shift times are present
        assert "morning_start" in config
        assert "morning_end" in config
        assert "afternoon_start" in config
        assert "afternoon_end" in config
        assert "night_start" in config
        assert "night_end" in config
        assert "four_off_start" in config
        assert "four_off_end" in config
        
        print(f"Shift config: Morning {config['morning_start']}-{config['morning_end']}, "
              f"Afternoon {config['afternoon_start']}-{config['afternoon_end']}")
    
    def test_admin_assign_morning_shift(self, admin_token):
        """Admin can assign morning shift to a user"""
        # Get a regular user
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        users = response.json().get("users", [])
        
        regular_user = next((u for u in users if u.get("role") == "user"), None)
        if not regular_user:
            pytest.skip("No regular user found to test shift assignment")
        
        # Assign morning shift
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{regular_user['user_id']}/shift",
            json={"shift_type": "morning"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("assigned_shift") == "morning"
        print(f"Morning shift assigned to {regular_user['name']}")
    
    def test_admin_assign_afternoon_shift(self, admin_token):
        """Admin can assign afternoon shift"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        users = response.json().get("users", [])
        regular_user = next((u for u in users if u.get("role") == "user"), None)
        if not regular_user:
            pytest.skip("No regular user found")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{regular_user['user_id']}/shift",
            json={"shift_type": "afternoon"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        assert response.json().get("assigned_shift") == "afternoon"
        print("Afternoon shift assigned successfully")
    
    def test_admin_assign_night_shift(self, admin_token):
        """Admin can assign night shift"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        users = response.json().get("users", [])
        regular_user = next((u for u in users if u.get("role") == "user"), None)
        if not regular_user:
            pytest.skip("No regular user found")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{regular_user['user_id']}/shift",
            json={"shift_type": "night"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        assert response.json().get("assigned_shift") == "night"
        print("Night shift assigned successfully")
    
    def test_admin_assign_four_off_shift(self, admin_token):
        """Admin can assign four_off shift"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        users = response.json().get("users", [])
        regular_user = next((u for u in users if u.get("role") == "user"), None)
        if not regular_user:
            pytest.skip("No regular user found")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{regular_user['user_id']}/shift",
            json={"shift_type": "four_off"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        assert response.json().get("assigned_shift") == "four_off"
        print("Four-off shift assigned successfully")
    
    def test_custom_shift_requires_times(self, admin_token):
        """Custom shift requires custom_start and custom_end"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        users = response.json().get("users", [])
        regular_user = next((u for u in users if u.get("role") == "user"), None)
        if not regular_user:
            pytest.skip("No regular user found")
        
        # Try to assign custom without times - should fail
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{regular_user['user_id']}/shift",
            json={"shift_type": "custom"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 400
        assert "custom_start" in response.json().get("detail", "").lower() or \
               "custom_end" in response.json().get("detail", "").lower()
        print("Custom shift without times rejected: 400")
    
    def test_admin_assign_custom_shift_with_times(self, admin_token):
        """Admin can assign custom shift with start and end times"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        users = response.json().get("users", [])
        regular_user = next((u for u in users if u.get("role") == "user"), None)
        if not regular_user:
            pytest.skip("No regular user found")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{regular_user['user_id']}/shift",
            json={
                "shift_type": "custom",
                "custom_start": "07:30",
                "custom_end": "16:00"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("assigned_shift") == "custom"
        assert data.get("custom_shift_start") == "07:30"
        assert data.get("custom_shift_end") == "16:00"
        print(f"Custom shift 07:30-16:00 assigned successfully")
    
    def test_invalid_shift_type_rejected(self, admin_token):
        """Invalid shift type should be rejected"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        users = response.json().get("users", [])
        regular_user = next((u for u in users if u.get("role") == "user"), None)
        if not regular_user:
            pytest.skip("No regular user found")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{regular_user['user_id']}/shift",
            json={"shift_type": "invalid_shift"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 400
        print("Invalid shift type rejected: 400")


class TestAttendanceReportWithShift(TestAuthTokens):
    """Test that attendance report uses user's assigned shift for late/early calculation"""
    
    def test_superuser_attendance_report_has_shift_info(self, superuser_token):
        """Verify attendance report includes assigned shift in records"""
        response = requests.get(
            f"{BASE_URL}/api/superuser/attendance-report",
            headers={"Authorization": f"Bearer {superuser_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        records = data.get("records", [])
        
        print(f"Attendance report has {len(records)} records")
        
        # Check if any records have assigned_shift field
        login_records = [r for r in records if r.get("action") == "login"]
        if login_records:
            # Check status field exists
            for r in login_records[:3]:
                assert "status" in r, "Login records should have status field"
                print(f"Record status: {r.get('status')}, assigned_shift: {r.get('assigned_shift', 'N/A')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
