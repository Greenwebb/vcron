"""
Test file for V-Chron SuperUser Endpoints
Tests all superuser-related API endpoints including:
- Bootstrap endpoint
- Stats endpoint
- User management (list, delete, reset password, change role)
- Facility management (CRUD)
- Shift configuration
- Attendance reports and export
- Access control (403 for non-superusers)
"""
import pytest
import requests
import os
import uuid

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://health-duty-track.preview.emergentagent.com').rstrip('/')

# Test credentials
SUPERUSER_EMAIL = "testsu@test.com"
SUPERUSER_PASSWORD = "Test1234!"


class TestSuperUserAuth:
    """Test superuser authentication and bootstrap"""
    
    @pytest.fixture
    def session(self):
        """Create a requests session"""
        return requests.Session()
    
    @pytest.fixture
    def superuser_token(self, session):
        """Get superuser auth token"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "superuser"
        return data["access_token"]
    
    @pytest.fixture
    def auth_headers(self, superuser_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {superuser_token}"}
    
    def test_superuser_login(self, session):
        """Test superuser can login successfully"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "superuser"
        assert data["user"]["email"] == SUPERUSER_EMAIL
        print("✓ Superuser login successful")
    
    def test_bootstrap_already_exists(self, session):
        """Test bootstrap fails when superuser already exists"""
        response = session.post(f"{BASE_URL}/api/superuser/bootstrap", json={
            "email": "newuser@test.com"
        })
        assert response.status_code == 403
        data = response.json()
        assert "already exists" in data["detail"].lower()
        print("✓ Bootstrap correctly rejects when superuser exists")


class TestSuperUserStats:
    """Test superuser stats endpoint"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_stats_success(self, session, auth_headers):
        """Test superuser can get dashboard stats"""
        response = session.get(f"{BASE_URL}/api/superuser/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields
        assert "total_users" in data
        assert "total_admins" in data
        assert "total_superusers" in data
        assert "total_facilities" in data
        assert "today_logins" in data
        assert "today_logouts" in data
        assert "currently_on_duty" in data
        
        # Verify data types
        assert isinstance(data["total_users"], int)
        assert isinstance(data["total_admins"], int)
        assert data["total_superusers"] >= 1  # At least our test user
        print(f"✓ Stats: {data['total_users']} users, {data['total_superusers']} superusers")
    
    def test_stats_requires_auth(self, session):
        """Test stats endpoint requires authentication"""
        response = session.get(f"{BASE_URL}/api/superuser/stats")
        assert response.status_code == 401
        print("✓ Stats endpoint correctly requires auth")


class TestSuperUserUsers:
    """Test superuser user management endpoints"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def test_user(self, session, auth_headers):
        """Create a test user for user management tests"""
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_user_{unique_id}@test.com"
        
        # Register a new user
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": f"TEST User {unique_id}",
            "phone_number": "0977000000",
            "position": "Nurse",
            "province": "Central Province",
            "district": "Mkushi",
            "facility": "Mkushi District Hospital"
        })
        
        if response.status_code == 200:
            user_data = response.json()
            yield user_data["user"]
            # Cleanup: delete user after test
            session.delete(
                f"{BASE_URL}/api/superuser/users/{user_data['user']['user_id']}", 
                headers=auth_headers
            )
        else:
            # User might already exist, try to find by search
            response = session.get(
                f"{BASE_URL}/api/superuser/users?search={test_email}",
                headers=auth_headers
            )
            if response.status_code == 200:
                users = response.json().get("users", [])
                if users:
                    yield users[0]
            yield None
    
    def test_list_users(self, session, auth_headers):
        """Test superuser can list all users"""
        response = session.get(f"{BASE_URL}/api/superuser/users", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "users" in data
        assert "total" in data
        assert isinstance(data["users"], list)
        assert data["total"] >= 1
        print(f"✓ Listed {data['total']} users")
    
    def test_list_users_with_search(self, session, auth_headers):
        """Test user search functionality"""
        response = session.get(
            f"{BASE_URL}/api/superuser/users?search=testsu",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should find our test superuser
        found = any(u["email"] == SUPERUSER_EMAIL for u in data["users"])
        assert found, "Should find test superuser by search"
        print("✓ User search works correctly")
    
    def test_list_users_role_filter(self, session, auth_headers):
        """Test filtering users by role"""
        response = session.get(
            f"{BASE_URL}/api/superuser/users?role=superuser",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned users should be superusers
        for user in data["users"]:
            assert user["role"] == "superuser"
        print(f"✓ Role filter works: {len(data['users'])} superusers found")
    
    def test_change_user_role(self, session, auth_headers, test_user):
        """Test changing a user's role"""
        if not test_user:
            pytest.skip("No test user available")
        
        user_id = test_user["user_id"]
        
        # Change to admin
        response = session.put(
            f"{BASE_URL}/api/superuser/users/{user_id}/role",
            headers=auth_headers,
            json={"role": "admin"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        
        # Verify with GET
        response = session.get(
            f"{BASE_URL}/api/superuser/users?search={test_user['email']}",
            headers=auth_headers
        )
        users = response.json().get("users", [])
        found = next((u for u in users if u["user_id"] == user_id), None)
        assert found and found["role"] == "admin"
        
        # Change back to user
        response = session.put(
            f"{BASE_URL}/api/superuser/users/{user_id}/role",
            headers=auth_headers,
            json={"role": "user"}
        )
        assert response.status_code == 200
        print("✓ User role change works")
    
    def test_reset_user_password(self, session, auth_headers, test_user):
        """Test resetting a user's password"""
        if not test_user:
            pytest.skip("No test user available")
        
        user_id = test_user["user_id"]
        new_password = "NewPass456!"
        
        response = session.post(
            f"{BASE_URL}/api/superuser/users/{user_id}/reset-password",
            headers=auth_headers,
            json={"new_password": new_password}
        )
        assert response.status_code == 200
        data = response.json()
        assert "Password reset" in data["message"]
        
        # Verify new password works by trying to login
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user["email"],
            "password": new_password
        })
        assert login_response.status_code == 200
        print("✓ Password reset works")
    
    def test_delete_user(self, session, auth_headers):
        """Test deleting a user"""
        # Create a temporary user to delete
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_delete_{unique_id}@test.com"
        
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": f"TEST Delete User",
            "phone_number": "0977000001",
            "position": "Nurse",
            "province": "Central Province",
            "district": "Mkushi",
            "facility": "Mkushi District Hospital"
        })
        
        if reg_response.status_code != 200:
            pytest.skip("Could not create test user for deletion")
        
        user_id = reg_response.json()["user"]["user_id"]
        
        # Delete the user
        response = session.delete(
            f"{BASE_URL}/api/superuser/users/{user_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Verify user is deleted
        search_response = session.get(
            f"{BASE_URL}/api/superuser/users?search={test_email}",
            headers=auth_headers
        )
        users = search_response.json().get("users", [])
        assert not any(u["user_id"] == user_id for u in users)
        print("✓ User deletion works")
    
    def test_cannot_delete_self(self, session, auth_headers):
        """Test superuser cannot delete themselves"""
        # Get superuser's own user_id
        me_response = session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        my_user_id = me_response.json()["user_id"]
        
        response = session.delete(
            f"{BASE_URL}/api/superuser/users/{my_user_id}",
            headers=auth_headers
        )
        assert response.status_code == 400
        assert "yourself" in response.json()["detail"].lower()
        print("✓ Cannot delete self protection works")


class TestSuperUserFacilities:
    """Test superuser facility management endpoints"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_facilities(self, session, auth_headers):
        """Test getting all facilities"""
        response = session.get(f"{BASE_URL}/api/superuser/facilities", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "facilities" in data
        assert isinstance(data["facilities"], list)
        # Should have facilities from initial data or created ones
        print(f"✓ Listed {len(data['facilities'])} facilities")
    
    def test_create_facility(self, session, auth_headers):
        """Test creating a new facility"""
        unique_id = uuid.uuid4().hex[:8]
        facility_name = f"TEST Facility {unique_id}"
        
        response = session.post(
            f"{BASE_URL}/api/superuser/facilities",
            headers=auth_headers,
            json={
                "name": facility_name,
                "district": "Mkushi",
                "province": "Central Province"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == facility_name
        assert data["district"] == "Mkushi"
        assert "facility_id" in data
        
        # Cleanup
        session.delete(
            f"{BASE_URL}/api/superuser/facilities/{data['facility_id']}",
            headers=auth_headers
        )
        print("✓ Facility creation works")
    
    def test_delete_facility(self, session, auth_headers):
        """Test deleting a facility"""
        # Create a facility to delete
        unique_id = uuid.uuid4().hex[:8]
        
        create_response = session.post(
            f"{BASE_URL}/api/superuser/facilities",
            headers=auth_headers,
            json={
                "name": f"TEST Delete Facility {unique_id}",
                "district": "Mkushi",
                "province": "Central Province"
            }
        )
        assert create_response.status_code == 200
        facility_id = create_response.json()["facility_id"]
        
        # Delete it
        response = session.delete(
            f"{BASE_URL}/api/superuser/facilities/{facility_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Verify deletion
        list_response = session.get(f"{BASE_URL}/api/superuser/facilities", headers=auth_headers)
        facilities = list_response.json()["facilities"]
        assert not any(f["facility_id"] == facility_id for f in facilities)
        print("✓ Facility deletion works")
    
    def test_duplicate_facility_rejected(self, session, auth_headers):
        """Test that duplicate facilities are rejected"""
        unique_id = uuid.uuid4().hex[:8]
        facility_name = f"TEST Duplicate {unique_id}"
        
        # Create first
        response1 = session.post(
            f"{BASE_URL}/api/superuser/facilities",
            headers=auth_headers,
            json={
                "name": facility_name,
                "district": "Mkushi",
                "province": "Central Province"
            }
        )
        assert response1.status_code == 200
        facility_id = response1.json()["facility_id"]
        
        # Try to create duplicate
        response2 = session.post(
            f"{BASE_URL}/api/superuser/facilities",
            headers=auth_headers,
            json={
                "name": facility_name,
                "district": "Mkushi",
                "province": "Central Province"
            }
        )
        assert response2.status_code == 400
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/superuser/facilities/{facility_id}", headers=auth_headers)
        print("✓ Duplicate facility rejection works")


class TestSuperUserShifts:
    """Test superuser shift configuration endpoints"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_shift_config(self, session, auth_headers):
        """Test getting shift configuration"""
        response = session.get(f"{BASE_URL}/api/superuser/shifts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all shift fields exist
        assert "morning_start" in data
        assert "morning_end" in data
        assert "afternoon_start" in data
        assert "afternoon_end" in data
        assert "night_start" in data
        assert "night_end" in data
        assert "four_off_start" in data
        assert "four_off_end" in data
        assert "grace_period_minutes" in data
        print(f"✓ Shift config: morning {data['morning_start']}-{data['morning_end']}, grace: {data['grace_period_minutes']}min")
    
    def test_update_shift_config(self, session, auth_headers):
        """Test updating shift configuration"""
        # Get current config
        get_response = session.get(f"{BASE_URL}/api/superuser/shifts", headers=auth_headers)
        original_config = get_response.json()
        
        # Update config
        new_config = {
            "morning_start": "07:00",
            "morning_end": "15:00",
            "afternoon_start": "15:00",
            "afternoon_end": "23:00",
            "night_start": "23:00",
            "night_end": "07:00",
            "four_off_start": "08:00",
            "four_off_end": "20:00",
            "grace_period_minutes": 20
        }
        
        response = session.put(
            f"{BASE_URL}/api/superuser/shifts",
            headers=auth_headers,
            json=new_config
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["morning_start"] == "07:00"
        assert data["grace_period_minutes"] == 20
        
        # Restore original config
        session.put(
            f"{BASE_URL}/api/superuser/shifts",
            headers=auth_headers,
            json={
                "morning_start": original_config.get("morning_start", "06:00"),
                "morning_end": original_config.get("morning_end", "14:00"),
                "afternoon_start": original_config.get("afternoon_start", "14:00"),
                "afternoon_end": original_config.get("afternoon_end", "22:00"),
                "night_start": original_config.get("night_start", "22:00"),
                "night_end": original_config.get("night_end", "06:00"),
                "four_off_start": original_config.get("four_off_start", "07:00"),
                "four_off_end": original_config.get("four_off_end", "19:00"),
                "grace_period_minutes": original_config.get("grace_period_minutes", 15)
            }
        )
        print("✓ Shift config update works")


class TestSuperUserReports:
    """Test superuser attendance report endpoints"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_attendance_report(self, session, auth_headers):
        """Test getting attendance report"""
        response = session.get(f"{BASE_URL}/api/superuser/attendance-report", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "records" in data
        assert "summary" in data
        assert isinstance(data["records"], list)
        
        # Check summary fields
        summary = data["summary"]
        assert "total" in summary
        assert "late" in summary
        assert "early" in summary
        assert "on_time" in summary
        print(f"✓ Report: {summary['total']} records, {summary['late']} late, {summary['early']} early")
    
    def test_attendance_report_with_date_filter(self, session, auth_headers):
        """Test attendance report with date filter"""
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = session.get(
            f"{BASE_URL}/api/superuser/attendance-report?date={today}T00:00:00Z",
            headers=auth_headers
        )
        assert response.status_code == 200
        print("✓ Attendance report with date filter works")
    
    def test_export_csv(self, session, auth_headers):
        """Test CSV export"""
        response = session.get(
            f"{BASE_URL}/api/superuser/export?format=csv",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        assert "attachment" in response.headers.get("content-disposition", "")
        print("✓ CSV export works")
    
    def test_export_xlsx(self, session, auth_headers):
        """Test Excel export"""
        response = session.get(
            f"{BASE_URL}/api/superuser/export?format=xlsx",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert "spreadsheet" in response.headers.get("content-type", "")
        print("✓ Excel export works")


class TestSuperUserAccessControl:
    """Test that non-superusers cannot access superuser endpoints"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def regular_user_token(self, session):
        """Create and login as a regular user"""
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_regular_{unique_id}@test.com"
        
        # Register new user
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": f"TEST Regular User",
            "phone_number": "0977000002",
            "position": "Nurse",
            "province": "Central Province",
            "district": "Mkushi",
            "facility": "Mkushi District Hospital"
        })
        
        if reg_response.status_code == 200:
            token = reg_response.json()["access_token"]
            user_id = reg_response.json()["user"]["user_id"]
            yield {"token": token, "user_id": user_id, "email": test_email}
            
            # Cleanup: login as superuser and delete test user
            su_login = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": SUPERUSER_EMAIL,
                "password": SUPERUSER_PASSWORD
            })
            su_token = su_login.json()["access_token"]
            session.delete(
                f"{BASE_URL}/api/superuser/users/{user_id}",
                headers={"Authorization": f"Bearer {su_token}"}
            )
        else:
            pytest.skip("Could not create regular user")
    
    def test_regular_user_cannot_access_stats(self, session, regular_user_token):
        """Test regular user gets 403 on stats endpoint"""
        headers = {"Authorization": f"Bearer {regular_user_token['token']}"}
        response = session.get(f"{BASE_URL}/api/superuser/stats", headers=headers)
        assert response.status_code == 403
        print("✓ Regular user blocked from stats")
    
    def test_regular_user_cannot_access_users(self, session, regular_user_token):
        """Test regular user gets 403 on users endpoint"""
        headers = {"Authorization": f"Bearer {regular_user_token['token']}"}
        response = session.get(f"{BASE_URL}/api/superuser/users", headers=headers)
        assert response.status_code == 403
        print("✓ Regular user blocked from users list")
    
    def test_regular_user_cannot_access_shifts(self, session, regular_user_token):
        """Test regular user gets 403 on shifts endpoint"""
        headers = {"Authorization": f"Bearer {regular_user_token['token']}"}
        response = session.get(f"{BASE_URL}/api/superuser/shifts", headers=headers)
        assert response.status_code == 403
        print("✓ Regular user blocked from shifts config")
    
    def test_regular_user_cannot_access_facilities(self, session, regular_user_token):
        """Test regular user gets 403 on facilities endpoint"""
        headers = {"Authorization": f"Bearer {regular_user_token['token']}"}
        response = session.get(f"{BASE_URL}/api/superuser/facilities", headers=headers)
        assert response.status_code == 403
        print("✓ Regular user blocked from facilities")
    
    def test_regular_user_cannot_export(self, session, regular_user_token):
        """Test regular user gets 403 on export endpoint"""
        headers = {"Authorization": f"Bearer {regular_user_token['token']}"}
        response = session.get(f"{BASE_URL}/api/superuser/export?format=csv", headers=headers)
        assert response.status_code == 403
        print("✓ Regular user blocked from export")


class TestSuperUserCanAccessAdmin:
    """Test that superuser can also access admin endpoints"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_superuser_can_access_admin_users(self, session, auth_headers):
        """Test superuser can access admin users endpoint"""
        response = session.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        assert response.status_code == 200
        print("✓ Superuser can access admin/users")
    
    def test_superuser_can_access_admin_attendance(self, session, auth_headers):
        """Test superuser can access admin attendance endpoint"""
        response = session.get(f"{BASE_URL}/api/admin/attendance", headers=auth_headers)
        assert response.status_code == 200
        print("✓ Superuser can access admin/attendance")
    
    def test_superuser_can_access_admin_export(self, session, auth_headers):
        """Test superuser can access admin export endpoint"""
        response = session.get(f"{BASE_URL}/api/admin/export?format=csv", headers=auth_headers)
        assert response.status_code == 200
        print("✓ Superuser can access admin/export")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
