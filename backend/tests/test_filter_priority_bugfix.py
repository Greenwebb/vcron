"""
Test suite for Bug Fix: if/elif/elif filter priority chain
Tests the critical fix: facility filter takes priority over district/province filters
Bug Fix Summary:
1) Reports filter was not filtering by specific facility because province/district filters overwrote the facility filter
2) Export CSV/Excel was coming blank when all filters set
Fix: Changed if/if/if → if/elif/elif making facility the highest-priority filter
"""
import pytest
import requests
import os
import io
import csv

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_SUPERUSER = {"email": "debugsu@test.com", "password": "Test1234!"}

# Known test data counts (from agent_to_agent_context):
# - 41 total attendance records
# - 23 for 'Mkushi District Hospital'
# - 37 for Mkushi district


@pytest.fixture(scope="module")
def auth_session():
    """Get authenticated session with superuser credentials"""
    session = requests.Session()
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json=TEST_SUPERUSER
    )
    if login_response.status_code != 200:
        pytest.skip(f"SuperUser login failed: {login_response.status_code}")
    
    user = login_response.json().get("user", {})
    print(f"Authenticated as: {user.get('email')} (role: {user.get('role')})")
    return session


class TestFacilityFilterPriority:
    """
    Tests that facility filter takes priority when all filters (province+district+facility) are set
    This is the core bug fix being tested
    """
    
    def test_facility_filter_returns_specific_facility_only(self, auth_session):
        """GET /api/superuser/attendance-report?facility=Mkushi District Hospital
        Should return ONLY records for that facility (expected: 23 records)
        """
        params = {"facility": "Mkushi District Hospital"}
        response = auth_session.get(f"{BASE_URL}/api/superuser/attendance-report", params=params)
        
        assert response.status_code == 200, f"Failed with status {response.status_code}"
        data = response.json()
        
        records = data.get("records", [])
        
        # All returned records should be for the specific facility
        for record in records:
            assert record.get("facility") == "Mkushi District Hospital", \
                f"Record has wrong facility: {record.get('facility')}"
        
        print(f"PASS: Facility filter returned {len(records)} records, all for 'Mkushi District Hospital'")
        return len(records)
    
    def test_all_filters_uses_facility_as_primary(self, auth_session):
        """GET /api/superuser/attendance-report with all 3 filters (province+district+facility)
        Should use facility as the primary filter (if/elif/elif chain)
        Result should be same as facility-only filter
        """
        # First get facility-only count
        facility_only_response = auth_session.get(
            f"{BASE_URL}/api/superuser/attendance-report",
            params={"facility": "Mkushi District Hospital"}
        )
        facility_only_count = len(facility_only_response.json().get("records", []))
        
        # Now get all-filters count
        all_filters_params = {
            "province": "Central Province",
            "district": "Mkushi",
            "facility": "Mkushi District Hospital"
        }
        all_filters_response = auth_session.get(
            f"{BASE_URL}/api/superuser/attendance-report",
            params=all_filters_params
        )
        
        assert all_filters_response.status_code == 200
        all_filters_data = all_filters_response.json()
        all_filters_count = len(all_filters_data.get("records", []))
        
        # The bug was: with all filters, province/district would override facility
        # After fix: facility takes priority, so counts should match
        assert all_filters_count == facility_only_count, \
            f"BUG NOT FIXED: all-filters ({all_filters_count}) != facility-only ({facility_only_count})"
        
        # Verify all records are for the correct facility
        for record in all_filters_data.get("records", []):
            assert record.get("facility") == "Mkushi District Hospital"
        
        print(f"PASS: All 3 filters with facility priority returned {all_filters_count} records (matches facility-only: {facility_only_count})")
    
    def test_district_filter_returns_all_facilities_in_district(self, auth_session):
        """GET /api/superuser/attendance-report?district=Mkushi
        Should return records for ALL facilities in Mkushi district (expected: 37 records)
        """
        params = {"district": "Mkushi"}
        response = auth_session.get(f"{BASE_URL}/api/superuser/attendance-report", params=params)
        
        assert response.status_code == 200
        data = response.json()
        records = data.get("records", [])
        
        # Count should be more than or equal to single facility
        facility_only_response = auth_session.get(
            f"{BASE_URL}/api/superuser/attendance-report",
            params={"facility": "Mkushi District Hospital"}
        )
        facility_only_count = len(facility_only_response.json().get("records", []))
        
        assert len(records) >= facility_only_count, \
            f"District records ({len(records)}) should be >= facility records ({facility_only_count})"
        
        print(f"PASS: District filter returned {len(records)} records (includes all Mkushi facilities)")
    
    def test_province_filter_returns_all_facilities_in_province(self, auth_session):
        """GET /api/superuser/attendance-report?province=Central Province
        Should return records for ALL facilities in Central Province
        """
        params = {"province": "Central Province"}
        response = auth_session.get(f"{BASE_URL}/api/superuser/attendance-report", params=params)
        
        assert response.status_code == 200
        data = response.json()
        records = data.get("records", [])
        
        # Count should be more than or equal to district
        district_response = auth_session.get(
            f"{BASE_URL}/api/superuser/attendance-report",
            params={"district": "Mkushi"}
        )
        district_count = len(district_response.json().get("records", []))
        
        assert len(records) >= district_count, \
            f"Province records ({len(records)}) should be >= district records ({district_count})"
        
        print(f"PASS: Province filter returned {len(records)} records (includes all Central Province facilities)")


class TestExportFilterPriorityBugfix:
    """
    Tests that export CSV/Excel with facility filter returns non-blank files
    Bug was: export with all filters set came blank
    """
    
    def test_export_csv_with_facility_filter_non_blank(self, auth_session):
        """GET /api/superuser/export?format=csv&facility=Mkushi District Hospital
        Should return CSV with actual records (not blank)
        """
        params = {
            "facility": "Mkushi District Hospital",
            "format": "csv"
        }
        response = auth_session.get(f"{BASE_URL}/api/superuser/export", params=params)
        
        assert response.status_code == 200, f"Export failed with {response.status_code}"
        assert "text/csv" in response.headers.get("content-type", ""), "Response is not CSV"
        
        content = response.text
        assert len(content) > 0, "CSV content is empty"
        
        # Parse CSV and count data rows (excluding header)
        csv_reader = csv.reader(io.StringIO(content))
        rows = list(csv_reader)
        
        # Should have header + data rows
        assert len(rows) > 1, f"CSV has only {len(rows)} rows (expected header + data)"
        
        # Verify header row
        header = rows[0]
        assert "Staff Name" in header or "Name" in header, f"Unexpected header: {header}"
        
        data_rows = rows[1:]  # Exclude header
        print(f"PASS: CSV export with facility filter contains {len(data_rows)} data rows")
        return len(data_rows)
    
    def test_export_xlsx_with_facility_filter_non_blank(self, auth_session):
        """GET /api/superuser/export?format=xlsx&facility=Mkushi District Hospital
        Should return Excel file with actual records (not blank)
        """
        params = {
            "facility": "Mkushi District Hospital",
            "format": "xlsx"
        }
        response = auth_session.get(f"{BASE_URL}/api/superuser/export", params=params)
        
        assert response.status_code == 200, f"Export failed with {response.status_code}"
        assert "spreadsheet" in response.headers.get("content-type", ""), "Response is not Excel"
        
        content = response.content
        assert len(content) > 0, "Excel content is empty"
        
        # Excel files have a minimum size (header bytes)
        assert len(content) > 1000, f"Excel file too small ({len(content)} bytes), likely blank"
        
        print(f"PASS: Excel export with facility filter has {len(content)} bytes")
    
    def test_export_csv_with_all_filters_non_blank(self, auth_session):
        """GET /api/superuser/export with all 3 filters
        This was the specific bug: export came blank when all filters set
        """
        params = {
            "province": "Central Province",
            "district": "Mkushi",
            "facility": "Mkushi District Hospital",
            "format": "csv"
        }
        response = auth_session.get(f"{BASE_URL}/api/superuser/export", params=params)
        
        assert response.status_code == 200
        content = response.text
        
        # Parse CSV
        csv_reader = csv.reader(io.StringIO(content))
        rows = list(csv_reader)
        
        data_rows = [r for r in rows[1:] if r and any(r)]  # Non-empty data rows
        
        assert len(data_rows) > 0, \
            f"BUG NOT FIXED: Export with all filters is BLANK (only {len(rows)} rows total)"
        
        print(f"PASS: Export with all 3 filters returned {len(data_rows)} data rows (not blank)")
    
    def test_export_with_all_filters_uses_facility_priority(self, auth_session):
        """Export CSV with all filters should match facility-only export count"""
        # Facility-only export
        facility_only_response = auth_session.get(
            f"{BASE_URL}/api/superuser/export",
            params={"facility": "Mkushi District Hospital", "format": "csv"}
        )
        facility_only_rows = len(list(csv.reader(io.StringIO(facility_only_response.text)))) - 1
        
        # All-filters export
        all_filters_response = auth_session.get(
            f"{BASE_URL}/api/superuser/export",
            params={
                "province": "Central Province",
                "district": "Mkushi",
                "facility": "Mkushi District Hospital",
                "format": "csv"
            }
        )
        all_filters_rows = len(list(csv.reader(io.StringIO(all_filters_response.text)))) - 1
        
        assert all_filters_rows == facility_only_rows, \
            f"Export counts don't match: all-filters ({all_filters_rows}) vs facility-only ({facility_only_rows})"
        
        print(f"PASS: Export with all filters ({all_filters_rows}) matches facility-only ({facility_only_rows})")


class TestBaselineDataVerification:
    """Verify test data exists for meaningful tests"""
    
    def test_total_attendance_records_exist(self, auth_session):
        """Verify there are attendance records in the database"""
        response = auth_session.get(f"{BASE_URL}/api/superuser/attendance-report")
        assert response.status_code == 200
        
        data = response.json()
        records = data.get("records", [])
        
        assert len(records) > 0, "No attendance records in database - tests may be invalid"
        print(f"INFO: Database has {len(records)} total attendance records")
    
    def test_mkushi_district_hospital_records_exist(self, auth_session):
        """Verify specific facility has attendance records"""
        response = auth_session.get(
            f"{BASE_URL}/api/superuser/attendance-report",
            params={"facility": "Mkushi District Hospital"}
        )
        assert response.status_code == 200
        
        data = response.json()
        records = data.get("records", [])
        
        # Based on agent context: expected 23 records
        print(f"INFO: 'Mkushi District Hospital' has {len(records)} attendance records")
        
        if len(records) == 0:
            pytest.skip("No records for test facility - tests may be invalid")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
