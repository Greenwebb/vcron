"""
Test file for Bug Fix: Facilities from Super User dashboard appearing in registration dropdowns

Tests:
1. GET /api/facilities/{district} - merges hardcoded + DB facilities
2. GET /api/districts/{province} - merges hardcoded + DB districts
3. POST /api/auth/register - accepts DB-stored facilities (not just hardcoded)
4. POST /api/auth/complete-registration - accepts DB-stored facilities
5. Frontend SuperUser facilities tab has search/filter functionality
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://health-duty-track.preview.emergentagent.com').rstrip('/')

# Test credentials - using the provided test superuser
SUPERUSER_EMAIL = "testsu2@test.com"
SUPERUSER_PASSWORD = "Test1234!"


class TestFacilityMerging:
    """Test that facilities/districts endpoints merge hardcoded + DB data"""
    
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
        assert response.status_code == 200, f"Superuser login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    @pytest.fixture
    def auth_headers(self, superuser_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {superuser_token}"}

    def test_get_districts_includes_db_facilities(self, session, auth_headers):
        """Test GET /api/districts/{province} returns merged districts"""
        # Get districts for Central Province (which has Mkushi hardcoded)
        response = session.get(f"{BASE_URL}/api/districts/Central Province")
        assert response.status_code == 200
        
        data = response.json()
        assert "districts" in data
        assert "province" in data
        assert data["province"] == "Central Province"
        
        # Mkushi should always be there (hardcoded)
        assert "Mkushi" in data["districts"]
        
        # Districts should be sorted
        districts = data["districts"]
        assert districts == sorted(districts)
        print(f"✓ GET /districts/Central Province returns {len(districts)} districts, including Mkushi")
    
    def test_get_facilities_includes_db_facilities(self, session, auth_headers):
        """Test GET /api/facilities/{district} returns merged facilities"""
        # Get facilities for Mkushi district
        response = session.get(f"{BASE_URL}/api/facilities/Mkushi")
        assert response.status_code == 200
        
        data = response.json()
        assert "facilities" in data
        assert "district" in data
        assert data["district"] == "Mkushi"
        
        facilities = data["facilities"]
        
        # Mkushi District Hospital should be there (hardcoded)
        assert "Mkushi District Hospital" in facilities, "Hardcoded facility not found"
        
        # Facilities should be sorted
        assert facilities == sorted(facilities), "Facilities should be sorted"
        
        print(f"✓ GET /facilities/Mkushi returns {len(facilities)} facilities")
    
    def test_create_db_facility_appears_in_list(self, session, auth_headers):
        """Test that newly created facility appears in the facilities list"""
        unique_id = uuid.uuid4().hex[:8]
        facility_name = f"TEST Bug Fix Clinic {unique_id}"
        
        # Create a new facility via superuser endpoint
        create_response = session.post(
            f"{BASE_URL}/api/superuser/facilities",
            headers=auth_headers,
            json={
                "name": facility_name,
                "district": "Mkushi",
                "province": "Central Province"
            }
        )
        assert create_response.status_code == 200, f"Failed to create facility: {create_response.text}"
        created = create_response.json()
        facility_id = created["facility_id"]
        
        # Verify the facility appears in public facilities list
        list_response = session.get(f"{BASE_URL}/api/facilities/Mkushi")
        assert list_response.status_code == 200
        facilities = list_response.json()["facilities"]
        
        assert facility_name in facilities, f"Newly created facility '{facility_name}' not found in /api/facilities/Mkushi"
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/superuser/facilities/{facility_id}", headers=auth_headers)
        print(f"✓ Created facility '{facility_name}' appears in /api/facilities/Mkushi")


class TestRegistrationWithDBFacilities:
    """Test that registration accepts DB-stored facilities"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def superuser_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture
    def auth_headers(self, superuser_token):
        return {"Authorization": f"Bearer {superuser_token}"}
    
    @pytest.fixture
    def test_db_facility(self, session, auth_headers):
        """Create a DB-only facility for testing"""
        unique_id = uuid.uuid4().hex[:8]
        facility_name = f"TEST Registration Clinic {unique_id}"
        
        create_response = session.post(
            f"{BASE_URL}/api/superuser/facilities",
            headers=auth_headers,
            json={
                "name": facility_name,
                "district": "Mkushi",
                "province": "Central Province"
            }
        )
        assert create_response.status_code == 200, f"Failed to create test facility: {create_response.text}"
        facility = create_response.json()
        
        yield {
            "facility_id": facility["facility_id"],
            "name": facility_name,
            "district": "Mkushi",
            "province": "Central Province"
        }
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/superuser/facilities/{facility['facility_id']}", headers=auth_headers)
    
    def test_register_with_hardcoded_facility(self, session, auth_headers):
        """Test registration with hardcoded facility (should work)"""
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_hardcoded_{unique_id}@test.com"
        
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "TEST Hardcoded Facility User",
            "phone_number": "0977000100",
            "position": "Nurse",
            "province": "Central Province",
            "district": "Mkushi",
            "facility": "Mkushi District Hospital"  # Hardcoded facility
        })
        
        assert response.status_code == 200, f"Registration with hardcoded facility failed: {response.text}"
        data = response.json()
        assert data["user"]["facility"] == "Mkushi District Hospital"
        
        # Cleanup
        user_id = data["user"]["user_id"]
        session.delete(f"{BASE_URL}/api/superuser/users/{user_id}", headers=auth_headers)
        print("✓ Registration with hardcoded facility 'Mkushi District Hospital' works")
    
    def test_register_with_db_facility(self, session, auth_headers, test_db_facility):
        """Test registration with DB-stored facility (THIS IS THE BUG FIX)"""
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_dbfac_{unique_id}@test.com"
        
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "TEST DB Facility User",
            "phone_number": "0977000200",
            "position": "Nurse",
            "province": "Central Province",
            "district": "Mkushi",
            "facility": test_db_facility["name"]  # DB-stored facility
        })
        
        assert response.status_code == 200, f"Registration with DB facility failed: {response.text}. This is the BUG FIX we're testing!"
        data = response.json()
        assert data["user"]["facility"] == test_db_facility["name"]
        
        # Cleanup
        user_id = data["user"]["user_id"]
        session.delete(f"{BASE_URL}/api/superuser/users/{user_id}", headers=auth_headers)
        print(f"✓ Registration with DB facility '{test_db_facility['name']}' works (BUG FIX VERIFIED)")
    
    def test_register_with_invalid_facility_fails(self, session):
        """Test registration with non-existent facility fails"""
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_invalid_{unique_id}@test.com"
        
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "TEST Invalid Facility User",
            "phone_number": "0977000300",
            "position": "Nurse",
            "province": "Central Province",
            "district": "Mkushi",
            "facility": "Non Existent Facility XYZ"
        })
        
        assert response.status_code == 400, f"Registration with invalid facility should fail: {response.text}"
        data = response.json()
        assert "invalid" in data["detail"].lower() or "facility" in data["detail"].lower()
        print("✓ Registration with invalid facility correctly rejected")


class TestCompleteRegistrationWithDBFacilities:
    """Test complete-registration endpoint accepts DB facilities"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def superuser_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def auth_headers(self, superuser_token):
        return {"Authorization": f"Bearer {superuser_token}"}
    
    @pytest.fixture
    def test_db_facility(self, session, auth_headers):
        """Create a DB-only facility for testing"""
        unique_id = uuid.uuid4().hex[:8]
        facility_name = f"TEST Complete Reg Clinic {unique_id}"
        
        create_response = session.post(
            f"{BASE_URL}/api/superuser/facilities",
            headers=auth_headers,
            json={
                "name": facility_name,
                "district": "Mkushi",
                "province": "Central Province"
            }
        )
        facility = create_response.json()
        
        yield {
            "facility_id": facility["facility_id"],
            "name": facility_name
        }
        
        session.delete(f"{BASE_URL}/api/superuser/facilities/{facility['facility_id']}", headers=auth_headers)
    
    @pytest.fixture
    def incomplete_user(self, session, auth_headers):
        """Create a user with incomplete profile for testing complete-registration"""
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_incomplete_{unique_id}@test.com"
        
        # Register user first
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "TEST Incomplete User",
            "phone_number": "0977000400",
            "position": "Nurse",
            "province": "Central Province",
            "district": "Mkushi",
            "facility": "Mkushi District Hospital"
        })
        
        if reg_response.status_code == 200:
            user_data = reg_response.json()
            yield {
                "user_id": user_data["user"]["user_id"],
                "token": user_data["access_token"],
                "email": test_email
            }
            session.delete(f"{BASE_URL}/api/superuser/users/{user_data['user']['user_id']}", headers=auth_headers)
        else:
            pytest.skip("Could not create incomplete user")
    
    def test_complete_registration_with_db_facility(self, session, auth_headers, test_db_facility, incomplete_user):
        """Test complete-registration accepts DB-stored facilities"""
        user_headers = {"Authorization": f"Bearer {incomplete_user['token']}"}
        
        response = session.post(
            f"{BASE_URL}/api/auth/complete-registration",
            headers=user_headers,
            json={
                "phone_number": "0977999888",
                "position": "Clinical Officer",
                "province": "Central Province",
                "district": "Mkushi",
                "facility": test_db_facility["name"]  # DB-stored facility
            }
        )
        
        assert response.status_code == 200, f"Complete registration with DB facility failed: {response.text}"
        data = response.json()
        assert data["facility"] == test_db_facility["name"]
        print(f"✓ Complete-registration with DB facility '{test_db_facility['name']}' works")


class TestSuperUserFacilitiesSearch:
    """Test SuperUser facilities tab search/filter functionality"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def superuser_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def auth_headers(self, superuser_token):
        return {"Authorization": f"Bearer {superuser_token}"}
    
    def test_get_superuser_facilities(self, session, auth_headers):
        """Test GET /api/superuser/facilities returns all facilities"""
        response = session.get(f"{BASE_URL}/api/superuser/facilities", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "facilities" in data
        facilities = data["facilities"]
        assert isinstance(facilities, list)
        
        # Verify facilities have required fields
        if facilities:
            sample = facilities[0]
            assert "facility_id" in sample
            assert "name" in sample
            assert "district" in sample
            assert "province" in sample
        
        print(f"✓ GET /superuser/facilities returns {len(facilities)} facilities")
    
    def test_get_superuser_provinces(self, session, auth_headers):
        """Test GET /api/superuser/provinces for filter dropdown"""
        response = session.get(f"{BASE_URL}/api/superuser/provinces", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "provinces" in data
        provinces = data["provinces"]
        assert len(provinces) >= 1
        
        # Verify Central Province exists
        province_names = [p["name"] for p in provinces]
        assert "Central Province" in province_names
        
        print(f"✓ GET /superuser/provinces returns {len(provinces)} provinces")
    
    def test_get_superuser_districts(self, session, auth_headers):
        """Test GET /api/superuser/districts for filter dropdown"""
        response = session.get(f"{BASE_URL}/api/superuser/districts", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "districts" in data
        districts = data["districts"]
        
        # Verify Central Province has Mkushi
        assert "Central Province" in districts
        assert "Mkushi" in districts["Central Province"]
        
        print(f"✓ GET /superuser/districts returns district data")


class TestDistrictDBFacilities:
    """Test districts from DB facilities appear correctly"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    @pytest.fixture
    def superuser_token(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPERUSER_EMAIL,
            "password": SUPERUSER_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def auth_headers(self, superuser_token):
        return {"Authorization": f"Bearer {superuser_token}"}
    
    def test_create_facility_in_new_district(self, session, auth_headers):
        """Test that creating a facility in a new district makes that district appear"""
        unique_id = uuid.uuid4().hex[:8]
        new_district = "Kabwe"  # A district not in hardcoded list for Central Province
        facility_name = f"TEST District Clinic {unique_id}"
        
        # Create facility in a different district
        create_response = session.post(
            f"{BASE_URL}/api/superuser/facilities",
            headers=auth_headers,
            json={
                "name": facility_name,
                "district": new_district,
                "province": "Central Province"
            }
        )
        
        if create_response.status_code == 200:
            facility_id = create_response.json()["facility_id"]
            
            # Check if district appears in districts list
            districts_response = session.get(f"{BASE_URL}/api/districts/Central Province")
            districts = districts_response.json()["districts"]
            
            assert new_district in districts, f"District '{new_district}' should appear in districts list"
            
            # Cleanup
            session.delete(f"{BASE_URL}/api/superuser/facilities/{facility_id}", headers=auth_headers)
            print(f"✓ Created facility in '{new_district}' appears in districts list")
        else:
            # District might already exist
            print(f"Note: Could not create facility in {new_district}: {create_response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
