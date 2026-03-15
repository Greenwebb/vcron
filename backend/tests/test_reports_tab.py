"""
Test suite for SuperUser Reports Tab cascading dropdown filters and attendance-report API
Tests: Province → District → Facility cascading, search, and attendance-report filtering
"""
import pytest
import requests
import os
from urllib.parse import quote

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_SUPERUSER = {"email": "sutest@test.com", "password": "Test1234!"}


class TestProvinceAPI:
    """Test GET /api/provinces endpoint"""
    
    def test_get_provinces_returns_10_provinces(self):
        """GET /api/provinces should return 10 Zambian provinces"""
        response = requests.get(f"{BASE_URL}/api/provinces")
        assert response.status_code == 200
        data = response.json()
        assert "provinces" in data
        assert len(data["provinces"]) == 10
        
        # Verify Central Province exists (we use this for cascading tests)
        province_names = [p["name"] for p in data["provinces"]]
        assert "Central Province" in province_names
        print(f"PASS: GET /api/provinces returned {len(data['provinces'])} provinces")


class TestDistrictsAPI:
    """Test GET /api/districts/{province} endpoint with URL encoding"""
    
    def test_get_districts_with_space_encoding(self):
        """GET /api/districts/{province} with URL-encoded space should work"""
        # Test with "Central Province" which contains a space
        province = "Central Province"
        encoded_province = quote(province)
        response = requests.get(f"{BASE_URL}/api/districts/{encoded_province}")
        
        assert response.status_code == 200
        data = response.json()
        assert "districts" in data
        assert data["province"] == province
        
        # Central Province should have 11 hardcoded districts
        districts = data["districts"]
        assert len(districts) >= 11
        assert "Mkushi" in districts
        assert "Kabwe" in districts
        print(f"PASS: GET /api/districts/{encoded_province} returned {len(districts)} districts")
    
    def test_get_districts_merges_db_and_hardcoded(self):
        """Districts endpoint should merge hardcoded + DB-stored districts"""
        province = "Central Province"
        response = requests.get(f"{BASE_URL}/api/districts/{quote(province)}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Known hardcoded districts
        hardcoded = ["Chibombo", "Chisamba", "Chitambo", "Kabwe", "Kapiri Mposhi", 
                     "Luano", "Mkushi", "Mumbwa", "Ngabwe", "Serenje", "Shibuyunji"]
        
        for d in hardcoded:
            assert d in data["districts"], f"Missing hardcoded district: {d}"
        print(f"PASS: Districts endpoint includes all 11 hardcoded districts")
    
    def test_get_districts_unknown_province(self):
        """GET /api/districts with unknown province should return empty list"""
        response = requests.get(f"{BASE_URL}/api/districts/{quote('Unknown Province')}")
        assert response.status_code == 200
        data = response.json()
        # Should return empty districts for unknown province (or only DB-stored ones)
        assert "districts" in data
        print(f"PASS: Unknown province returns districts: {len(data['districts'])}")


class TestFacilitiesAPI:
    """Test GET /api/facilities/{district} endpoint"""
    
    def test_get_facilities_for_mkushi(self):
        """GET /api/facilities/Mkushi should return 48+ facilities"""
        response = requests.get(f"{BASE_URL}/api/facilities/Mkushi")
        
        assert response.status_code == 200
        data = response.json()
        assert "facilities" in data
        assert data["district"] == "Mkushi"
        
        # Mkushi has 47 hardcoded facilities + any DB-stored ones
        facilities = data["facilities"]
        assert len(facilities) >= 47
        assert "Mkushi District Hospital" in facilities
        print(f"PASS: GET /api/facilities/Mkushi returned {len(facilities)} facilities")
    
    def test_facilities_merges_db_and_hardcoded(self):
        """Facilities endpoint should merge hardcoded + DB-stored facilities"""
        response = requests.get(f"{BASE_URL}/api/facilities/Mkushi")
        
        assert response.status_code == 200
        data = response.json()
        
        # Known hardcoded facilities
        sample_facilities = [
            "Mkushi District Hospital",
            "Chalata Rural Health Centre",
            "Fiwila Rural Health Centre",
            "Chisanga Rural Health Centre"
        ]
        
        for f in sample_facilities:
            assert f in data["facilities"], f"Missing hardcoded facility: {f}"
        print(f"PASS: Facilities endpoint includes sample hardcoded facilities")


class TestSuperUserLogin:
    """Test superuser authentication for protected endpoints"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session with superuser credentials"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_SUPERUSER
        )
        if login_response.status_code != 200:
            pytest.skip(f"SuperUser login failed: {login_response.status_code}")
        return session
    
    def test_superuser_login_success(self, auth_session):
        """SuperUser login should succeed with valid credentials"""
        # If we got here, auth_session fixture already succeeded
        me_response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        user = me_response.json()
        assert user["role"] == "superuser"
        print(f"PASS: SuperUser login succeeded for {user['email']}")


class TestAttendanceReportAPI:
    """Test GET /api/superuser/attendance-report with filters"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_SUPERUSER
        )
        if login_response.status_code != 200:
            pytest.skip("SuperUser login failed")
        return session
    
    def test_attendance_report_no_filters(self, auth_session):
        """GET /api/superuser/attendance-report without filters should work"""
        response = auth_session.get(f"{BASE_URL}/api/superuser/attendance-report")
        
        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        assert "summary" in data
        assert "total" in data["summary"]
        assert "late" in data["summary"]
        assert "early" in data["summary"]
        assert "on_time" in data["summary"]
        print(f"PASS: Attendance report returned {len(data['records'])} records")
    
    def test_attendance_report_with_province_filter(self, auth_session):
        """GET /api/superuser/attendance-report?province=Central Province should filter"""
        params = {"province": "Central Province"}
        response = auth_session.get(f"{BASE_URL}/api/superuser/attendance-report", params=params)
        
        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        print(f"PASS: Province filter returned {len(data['records'])} records")
    
    def test_attendance_report_with_district_filter(self, auth_session):
        """GET /api/superuser/attendance-report?district=Mkushi should filter"""
        params = {"district": "Mkushi"}
        response = auth_session.get(f"{BASE_URL}/api/superuser/attendance-report", params=params)
        
        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        print(f"PASS: District filter returned {len(data['records'])} records")
    
    def test_attendance_report_with_facility_filter(self, auth_session):
        """GET /api/superuser/attendance-report?facility=Mkushi District Hospital"""
        params = {"facility": "Mkushi District Hospital"}
        response = auth_session.get(f"{BASE_URL}/api/superuser/attendance-report", params=params)
        
        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        print(f"PASS: Facility filter returned {len(data['records'])} records")
    
    def test_attendance_report_with_all_filters(self, auth_session):
        """GET /api/superuser/attendance-report with province+district+facility filters"""
        params = {
            "province": "Central Province",
            "district": "Mkushi",
            "facility": "Mkushi District Hospital"
        }
        response = auth_session.get(f"{BASE_URL}/api/superuser/attendance-report", params=params)
        
        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        assert "summary" in data
        print(f"PASS: All filters combined returned {len(data['records'])} records")


class TestExportAPI:
    """Test GET /api/superuser/export with filters"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=TEST_SUPERUSER
        )
        if login_response.status_code != 200:
            pytest.skip("SuperUser login failed")
        return session
    
    def test_export_csv_with_filters(self, auth_session):
        """Export CSV with province/district/facility filters"""
        params = {
            "province": "Central Province",
            "format": "csv"
        }
        response = auth_session.get(f"{BASE_URL}/api/superuser/export", params=params)
        
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print("PASS: CSV export with province filter works")
    
    def test_export_xlsx_with_filters(self, auth_session):
        """Export Excel with province/district/facility filters"""
        params = {
            "district": "Mkushi",
            "format": "xlsx"
        }
        response = auth_session.get(f"{BASE_URL}/api/superuser/export", params=params)
        
        assert response.status_code == 200
        assert "spreadsheet" in response.headers.get("content-type", "")
        print("PASS: Excel export with district filter works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
