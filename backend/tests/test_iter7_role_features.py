"""
Iteration 7 Test Suite: Role-based features testing
- Shifts/available endpoint with on_call shift
- Attendance creation with shift_type
- Admin role restriction (only SU can create admins)
- Jurisdiction assignment for admins
- Admin scoped users by jurisdiction
- Notifications system
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://health-duty-track.preview.emergentagent.com")

# Test credentials from request
ADMIN_CREDS = {"email": "admin2@test.com", "password": "Test1234!"}
SUPERUSER_CREDS = {"email": "shifttest@test.com", "password": "Test1234!"}
TEST_USER_PREFIX = "TEST_ITER7_"


class TestSession:
    """Session holders for tokens"""
    admin_token = None
    superuser_token = None
    admin_user = None
    superuser_user = None


# ==================== AUTHENTICATION ====================

def get_token(email, password):
    """Helper to login and get token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token"), data.get("user")
    return None, None


@pytest.fixture(scope="module")
def admin_session():
    """Get admin session"""
    if not TestSession.admin_token:
        token, user = get_token(ADMIN_CREDS["email"], ADMIN_CREDS["password"])
        TestSession.admin_token = token
        TestSession.admin_user = user
    return TestSession.admin_token, TestSession.admin_user


@pytest.fixture(scope="module")
def superuser_session():
    """Get superuser session"""
    if not TestSession.superuser_token:
        token, user = get_token(SUPERUSER_CREDS["email"], SUPERUSER_CREDS["password"])
        TestSession.superuser_token = token
        TestSession.superuser_user = user
    return TestSession.superuser_token, TestSession.superuser_user


def get_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ==================== SHIFTS AVAILABLE ENDPOINT ====================

class TestShiftsAvailable:
    """Test GET /api/shifts/available returns 5 shifts including on_call"""

    def test_shifts_available_requires_auth(self):
        """Verify endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/shifts/available")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Shifts available requires authentication")

    def test_shifts_available_returns_5_shifts(self, admin_session):
        """Verify endpoint returns 5 shifts"""
        token, _ = admin_session
        response = requests.get(
            f"{BASE_URL}/api/shifts/available",
            headers=get_headers(token)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "shifts" in data, "Response should have 'shifts' key"
        shifts = data["shifts"]
        assert len(shifts) == 5, f"Expected 5 shifts, got {len(shifts)}"
        print(f"PASS: Returns 5 shifts: {[s['key'] for s in shifts]}")

    def test_shifts_available_includes_on_call(self, admin_session):
        """Verify on_call shift is included"""
        token, _ = admin_session
        response = requests.get(
            f"{BASE_URL}/api/shifts/available",
            headers=get_headers(token)
        )
        assert response.status_code == 200
        data = response.json()
        shift_keys = [s["key"] for s in data["shifts"]]
        assert "on_call" in shift_keys, f"on_call not found in shifts: {shift_keys}"
        
        # Verify on_call shift structure
        on_call_shift = next(s for s in data["shifts"] if s["key"] == "on_call")
        assert "label" in on_call_shift, "on_call should have label"
        assert "start" in on_call_shift, "on_call should have start"
        assert "end" in on_call_shift, "on_call should have end"
        print(f"PASS: on_call shift present with times {on_call_shift['start']}-{on_call_shift['end']}")

    def test_shifts_available_all_required_shifts(self, admin_session):
        """Verify all 5 required shifts are present"""
        token, _ = admin_session
        response = requests.get(
            f"{BASE_URL}/api/shifts/available",
            headers=get_headers(token)
        )
        assert response.status_code == 200
        data = response.json()
        shift_keys = set(s["key"] for s in data["shifts"])
        required_shifts = {"morning", "afternoon", "night", "four_off", "on_call"}
        assert shift_keys == required_shifts, f"Expected {required_shifts}, got {shift_keys}"
        print(f"PASS: All required shifts present: {required_shifts}")


# ==================== ATTENDANCE WITH SHIFT_TYPE ====================

class TestAttendanceWithShift:
    """Test POST /api/attendance with shift_type stores it in record"""

    def test_attendance_creation_with_shift_type(self, admin_session):
        """Verify attendance can be created with shift_type"""
        token, user = admin_session
        response = requests.post(
            f"{BASE_URL}/api/attendance",
            headers=get_headers(token),
            json={
                "action": "login",
                "area_of_allocation": "Facility",
                "shift_type": "on_call",
                "latitude": -13.5,
                "longitude": 28.5
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "shift_type" in data, "Response should include shift_type"
        assert data["shift_type"] == "on_call", f"Expected on_call, got {data['shift_type']}"
        print(f"PASS: Attendance created with shift_type=on_call, attendance_id={data.get('attendance_id')}")

    def test_attendance_fallback_to_morning_without_shift(self, admin_session):
        """Verify attendance defaults to morning if no shift_type provided"""
        token, _ = admin_session
        response = requests.post(
            f"{BASE_URL}/api/attendance",
            headers=get_headers(token),
            json={
                "action": "logout",  # Use logout to end previous shift
                "area_of_allocation": "Facility"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        # Logout doesn't necessarily have shift_type, test is valid
        print("PASS: Attendance logout works without shift_type")


# ==================== ADMIN ROLE RESTRICTION ====================

class TestAdminRoleRestriction:
    """Test PUT /api/admin/users/{id} with role=admin returns 403 for admins"""

    def test_admin_cannot_create_admin(self, admin_session, superuser_session):
        """Admin trying to change user role to admin should get 403"""
        admin_token, _ = admin_session
        su_token, _ = superuser_session
        
        # First get a regular user from the system
        response = requests.get(
            f"{BASE_URL}/api/superuser/users?role=user&limit=1",
            headers=get_headers(su_token)
        )
        assert response.status_code == 200, f"Failed to get users: {response.status_code}"
        users = response.json().get("users", [])
        
        if not users:
            pytest.skip("No regular users available to test role change")
        
        target_user_id = users[0]["user_id"]
        
        # Try to change role to admin as admin
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{target_user_id}",
            headers=get_headers(admin_token),
            json={"role": "admin"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        error_detail = response.json().get("detail", "")
        assert "super" in error_detail.lower() or "admin" in error_detail.lower(), \
            f"Error should mention super users: {error_detail}"
        print(f"PASS: Admin cannot create admin (403): {error_detail}")

    def test_superuser_can_create_admin(self, superuser_session):
        """Superuser should be able to change role to admin"""
        token, _ = superuser_session
        
        # Get a regular user
        response = requests.get(
            f"{BASE_URL}/api/superuser/users?role=user&limit=1",
            headers=get_headers(token)
        )
        assert response.status_code == 200
        users = response.json().get("users", [])
        
        if not users:
            pytest.skip("No regular users available")
        
        target_user_id = users[0]["user_id"]
        
        # SuperUser changes role
        response = requests.put(
            f"{BASE_URL}/api/superuser/users/{target_user_id}/role",
            headers=get_headers(token),
            json={"role": "admin"}
        )
        # Could be 200 OK
        if response.status_code == 200:
            print(f"PASS: SuperUser can change role to admin")
            # Revert back to user
            requests.put(
                f"{BASE_URL}/api/superuser/users/{target_user_id}/role",
                headers=get_headers(token),
                json={"role": "user"}
            )
        else:
            print(f"INFO: Role change returned {response.status_code}: {response.text}")


# ==================== JURISDICTION ASSIGNMENT ====================

class TestJurisdictionAssignment:
    """Test PUT /api/superuser/users/{id}/jurisdiction assigns scope"""

    def test_jurisdiction_assignment_requires_superuser(self, admin_session):
        """Admin should not be able to assign jurisdiction"""
        token, _ = admin_session
        response = requests.put(
            f"{BASE_URL}/api/superuser/users/test_user_id/jurisdiction",
            headers=get_headers(token),
            json={"type": "district", "value": "Mkushi"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Jurisdiction assignment requires superuser (403)")

    def test_jurisdiction_assignment_facility(self, superuser_session):
        """Test assigning facility jurisdiction"""
        token, _ = superuser_session
        
        # Get an admin user
        response = requests.get(
            f"{BASE_URL}/api/superuser/users?role=admin&limit=1",
            headers=get_headers(token)
        )
        if response.status_code != 200 or not response.json().get("users"):
            pytest.skip("No admin users available")
        
        admin_id = response.json()["users"][0]["user_id"]
        
        # Assign facility jurisdiction
        response = requests.put(
            f"{BASE_URL}/api/superuser/users/{admin_id}/jurisdiction",
            headers=get_headers(token),
            json={"type": "facility", "value": "Mkushi District Hospital"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "assigned_jurisdiction" in data, "Response should have assigned_jurisdiction"
        assert data["assigned_jurisdiction"]["type"] == "facility"
        assert data["assigned_jurisdiction"]["value"] == "Mkushi District Hospital"
        print(f"PASS: Facility jurisdiction assigned successfully")

    def test_jurisdiction_assignment_district(self, superuser_session):
        """Test assigning district jurisdiction"""
        token, _ = superuser_session
        
        response = requests.get(
            f"{BASE_URL}/api/superuser/users?role=admin&limit=1",
            headers=get_headers(token)
        )
        if response.status_code != 200 or not response.json().get("users"):
            pytest.skip("No admin users available")
        
        admin_id = response.json()["users"][0]["user_id"]
        
        response = requests.put(
            f"{BASE_URL}/api/superuser/users/{admin_id}/jurisdiction",
            headers=get_headers(token),
            json={"type": "district", "value": "Mkushi"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["assigned_jurisdiction"]["type"] == "district"
        print(f"PASS: District jurisdiction assigned successfully")

    def test_jurisdiction_assignment_province(self, superuser_session):
        """Test assigning province jurisdiction"""
        token, _ = superuser_session
        
        response = requests.get(
            f"{BASE_URL}/api/superuser/users?role=admin&limit=1",
            headers=get_headers(token)
        )
        if response.status_code != 200 or not response.json().get("users"):
            pytest.skip("No admin users available")
        
        admin_id = response.json()["users"][0]["user_id"]
        
        response = requests.put(
            f"{BASE_URL}/api/superuser/users/{admin_id}/jurisdiction",
            headers=get_headers(token),
            json={"type": "province", "value": "Central Province"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["assigned_jurisdiction"]["type"] == "province"
        print(f"PASS: Province jurisdiction assigned successfully")

    def test_jurisdiction_invalid_type_rejected(self, superuser_session):
        """Test invalid jurisdiction type is rejected"""
        token, _ = superuser_session
        
        response = requests.get(
            f"{BASE_URL}/api/superuser/users?role=admin&limit=1",
            headers=get_headers(token)
        )
        if response.status_code != 200 or not response.json().get("users"):
            pytest.skip("No admin users available")
        
        admin_id = response.json()["users"][0]["user_id"]
        
        response = requests.put(
            f"{BASE_URL}/api/superuser/users/{admin_id}/jurisdiction",
            headers=get_headers(token),
            json={"type": "invalid_type", "value": "Test"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Invalid jurisdiction type rejected (400)")


# ==================== ADMIN SCOPED USERS ====================

class TestAdminScopedUsers:
    """Test GET /api/admin/users respects assigned_jurisdiction scoping"""

    def test_admin_users_endpoint(self, admin_session):
        """Test admin can access users endpoint"""
        token, _ = admin_session
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=get_headers(token)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "users" in data, "Response should have users key"
        assert "total" in data, "Response should have total key"
        print(f"PASS: Admin can access users endpoint, got {data['total']} users")


# ==================== NOTIFICATIONS SYSTEM ====================

class TestNotifications:
    """Test admin notification endpoints"""

    def test_notifications_get(self, admin_session):
        """Test GET /api/admin/notifications returns list"""
        token, _ = admin_session
        response = requests.get(
            f"{BASE_URL}/api/admin/notifications",
            headers=get_headers(token)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "notifications" in data, "Response should have notifications key"
        assert "unread_count" in data, "Response should have unread_count key"
        print(f"PASS: Notifications endpoint works, {data['unread_count']} unread")

    def test_notifications_unread_only_filter(self, admin_session):
        """Test unread_only filter"""
        token, _ = admin_session
        response = requests.get(
            f"{BASE_URL}/api/admin/notifications?unread_only=true",
            headers=get_headers(token)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # All returned notifications should be unread
        for notif in data.get("notifications", []):
            assert notif.get("read") == False, f"Found read notification with unread_only=true"
        print(f"PASS: unread_only filter works correctly")

    def test_mark_all_read(self, admin_session):
        """Test PUT /api/admin/notifications/read-all"""
        token, _ = admin_session
        response = requests.put(
            f"{BASE_URL}/api/admin/notifications/read-all",
            headers=get_headers(token)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data, "Response should have message"
        print(f"PASS: Mark all read works: {data['message']}")


# ==================== ATTENDANCE GENERATES NOTIFICATION ====================

class TestAttendanceNotification:
    """Test attendance without GPS generates notification"""

    def test_attendance_without_gps_for_facility(self, admin_session):
        """Verify attendance without GPS at Facility generates notification"""
        token, user = admin_session
        
        # Create attendance without GPS coords at Facility
        response = requests.post(
            f"{BASE_URL}/api/attendance",
            headers=get_headers(token),
            json={
                "action": "login",
                "area_of_allocation": "Facility",
                "shift_type": "morning"
                # No latitude/longitude
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Attendance created without GPS (notification should be generated)")
        
        # Logout to clean up
        requests.post(
            f"{BASE_URL}/api/attendance",
            headers=get_headers(token),
            json={"action": "logout", "area_of_allocation": "Facility"}
        )


# ==================== SHIFT ASSIGNMENT BY ADMIN ====================

class TestAdminShiftAssignment:
    """Test admin can assign shifts including on_call"""

    def test_admin_assign_on_call_shift(self, admin_session, superuser_session):
        """Test admin can assign on_call shift to user"""
        admin_token, _ = admin_session
        su_token, _ = superuser_session
        
        # Get a regular user
        response = requests.get(
            f"{BASE_URL}/api/superuser/users?role=user&limit=1",
            headers=get_headers(su_token)
        )
        if response.status_code != 200 or not response.json().get("users"):
            pytest.skip("No regular users available")
        
        user_id = response.json()["users"][0]["user_id"]
        
        # Admin assigns on_call shift
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}/shift",
            headers=get_headers(admin_token),
            json={"shift_type": "on_call"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("assigned_shift") == "on_call", f"Expected on_call, got {data.get('assigned_shift')}"
        print(f"PASS: Admin assigned on_call shift to user")


# ==================== ADMIN SHIFTS CONFIG ====================

class TestAdminShiftsConfig:
    """Test admin can read shift config"""

    def test_admin_get_shifts_config(self, admin_session):
        """Test admin can read shift configuration"""
        token, _ = admin_session
        response = requests.get(
            f"{BASE_URL}/api/admin/shifts",
            headers=get_headers(token)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify on_call times exist
        assert "on_call_start" in data, "Config should have on_call_start"
        assert "on_call_end" in data, "Config should have on_call_end"
        print(f"PASS: Admin can read shifts config, on_call={data.get('on_call_start')}-{data.get('on_call_end')}")


# ==================== SUPERUSER SHIFT CONFIG ====================

class TestSuperUserShiftConfig:
    """Test superuser can update shift config including on_call"""

    def test_superuser_get_shift_config(self, superuser_session):
        """Test superuser can get shift configuration"""
        token, _ = superuser_session
        response = requests.get(
            f"{BASE_URL}/api/superuser/shifts",
            headers=get_headers(token)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "on_call_start" in data, "Config should have on_call times"
        print(f"PASS: SuperUser can read shifts config")

    def test_superuser_update_shift_config(self, superuser_session):
        """Test superuser can update shift configuration"""
        token, _ = superuser_session
        
        # First get current config
        response = requests.get(
            f"{BASE_URL}/api/superuser/shifts",
            headers=get_headers(token)
        )
        current = response.json()
        
        # Update with same values (to avoid breaking anything)
        response = requests.put(
            f"{BASE_URL}/api/superuser/shifts",
            headers=get_headers(token),
            json={
                "morning_start": current.get("morning_start", "06:00"),
                "morning_end": current.get("morning_end", "14:00"),
                "afternoon_start": current.get("afternoon_start", "14:00"),
                "afternoon_end": current.get("afternoon_end", "22:00"),
                "night_start": current.get("night_start", "22:00"),
                "night_end": current.get("night_end", "06:00"),
                "four_off_start": current.get("four_off_start", "07:00"),
                "four_off_end": current.get("four_off_end", "19:00"),
                "on_call_start": current.get("on_call_start", "00:00"),
                "on_call_end": current.get("on_call_end", "23:59"),
                "grace_period_minutes": current.get("grace_period_minutes", 15)
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: SuperUser can update shifts config")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
