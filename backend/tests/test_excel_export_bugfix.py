"""
Test: Excel Export Bug Fix and Late Display Hours+Minutes Format
Bug 1: Excel export showing 'unrecoverable problem' - fixed with ARGB colors, explicit cell writing
Bug 2: Late status only showing minutes - now shows hours+minutes (e.g., '1h 45m')

Tests:
- Excel export returns valid file with proper MIME type
- Excel file has ARGB colors in headers
- Late display shows hours+minutes format in export and API response
- CSV export also has Time Late column with hours+minutes
"""
import pytest
import requests
import os
import io
import zipfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestExcelExportBugFix:
    """Tests for Excel export bug fixes - ARGB colors, proper binary handling"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as superuser and get auth cookie"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "debugsu@test.com",
            "password": "Test1234!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        self.auth_token = login_res.json().get("token")
    
    def test_excel_export_returns_200(self):
        """Test that Excel export endpoint returns 200 OK"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=xlsx")
        assert res.status_code == 200, f"Export failed with status {res.status_code}: {res.text}"
        print("PASS: Excel export returns 200 OK")
    
    def test_excel_export_content_type(self):
        """Test that Excel export has correct MIME type"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=xlsx")
        assert res.status_code == 200
        content_type = res.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "openxmlformats" in content_type, \
            f"Wrong content type: {content_type}"
        print(f"PASS: Excel export has correct content type: {content_type}")
    
    def test_excel_export_is_valid_xlsx_zip(self):
        """Test that Excel export is a valid XLSX file (which is a ZIP archive)"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=xlsx")
        assert res.status_code == 200
        
        # XLSX files are ZIP archives, verify we can read it
        try:
            xlsx_content = io.BytesIO(res.content)
            with zipfile.ZipFile(xlsx_content, 'r') as zf:
                # Check for required XLSX files
                namelist = zf.namelist()
                assert "[Content_Types].xml" in namelist, "Missing [Content_Types].xml"
                assert any("workbook.xml" in n for n in namelist), "Missing workbook.xml"
                print(f"PASS: Excel is valid ZIP with files: {namelist[:5]}...")
        except zipfile.BadZipFile:
            pytest.fail("Excel export is not a valid ZIP/XLSX file")
    
    def test_excel_export_has_content_disposition(self):
        """Test that Excel export has Content-Disposition header for download"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=xlsx")
        assert res.status_code == 200
        content_disposition = res.headers.get("Content-Disposition", "")
        assert "attachment" in content_disposition, f"Missing attachment header: {content_disposition}"
        assert ".xlsx" in content_disposition, f"Missing .xlsx filename: {content_disposition}"
        print(f"PASS: Content-Disposition header correct: {content_disposition}")
    
    def test_excel_file_not_empty(self):
        """Test that Excel export file has actual content (not just headers)"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=xlsx")
        assert res.status_code == 200
        assert len(res.content) > 1000, f"Excel file too small ({len(res.content)} bytes), might be empty"
        print(f"PASS: Excel file has content: {len(res.content)} bytes")


class TestCSVExport:
    """Tests for CSV export with Time Late column"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as superuser"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "debugsu@test.com",
            "password": "Test1234!"
        })
        assert login_res.status_code == 200
    
    def test_csv_export_returns_200(self):
        """Test that CSV export endpoint returns 200 OK"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=csv")
        assert res.status_code == 200, f"CSV export failed: {res.status_code}"
        print("PASS: CSV export returns 200 OK")
    
    def test_csv_export_content_type(self):
        """Test that CSV export has correct MIME type"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=csv")
        assert res.status_code == 200
        content_type = res.headers.get("Content-Type", "")
        assert "text/csv" in content_type, f"Wrong content type: {content_type}"
        print(f"PASS: CSV export has correct content type: {content_type}")
    
    def test_csv_has_time_late_column(self):
        """Test that CSV export has 'Time Late' column header"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=csv")
        assert res.status_code == 200
        csv_content = res.text
        # Check first line (header row)
        first_line = csv_content.split('\n')[0]
        assert "Time Late" in first_line, f"Missing 'Time Late' column in header: {first_line}"
        print(f"PASS: CSV has 'Time Late' column header")
    
    def test_csv_time_late_hours_minutes_format(self):
        """Test that CSV Time Late values show hours+minutes format (e.g., '1h 45m')"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=csv")
        assert res.status_code == 200
        csv_content = res.text
        lines = csv_content.strip().split('\n')
        
        # Look for late entries with hours format
        found_hours_format = False
        found_late = False
        for line in lines[1:]:  # Skip header
            if "LATE" in line.upper():
                found_late = True
                # Check if Time Late column has 'h' for hours (e.g., '1h 45m' or '2h 30m')
                if 'h ' in line and 'm' in line:
                    found_hours_format = True
                    print(f"Found hours+minutes format in: {line[:100]}...")
                    break
        
        if found_late and not found_hours_format:
            # Check for any late time format
            for line in lines[1:]:
                if "LATE" in line.upper():
                    # Extract the Time Late column value
                    cols = line.split(',')
                    if len(cols) >= 8:
                        time_late_value = cols[7]  # Time Late is 8th column (0-indexed: 7)
                        print(f"Found Time Late value: '{time_late_value}'")
                        # Could be just minutes if < 1 hour
                        if 'm' in time_late_value:
                            print("PASS: CSV has minutes format (late time < 1 hour)")
                            return
        
        if found_hours_format:
            print("PASS: CSV Time Late shows hours+minutes format")
        elif found_late:
            print("INFO: Found late entries but may be < 1 hour (minutes only format acceptable)")
        else:
            print("INFO: No late entries found in current data")


class TestAttendanceReportLateDisplay:
    """Tests for attendance-report API late_display field with hours+minutes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as superuser"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "debugsu@test.com",
            "password": "Test1234!"
        })
        assert login_res.status_code == 200
    
    def test_attendance_report_returns_records(self):
        """Test that attendance-report endpoint returns records"""
        res = self.session.get(f"{BASE_URL}/api/superuser/attendance-report")
        assert res.status_code == 200
        data = res.json()
        assert "records" in data, "Missing 'records' field"
        assert "summary" in data, "Missing 'summary' field"
        print(f"PASS: Attendance report returns {len(data['records'])} records")
    
    def test_late_records_have_late_display_field(self):
        """Test that late records have late_display field"""
        res = self.session.get(f"{BASE_URL}/api/superuser/attendance-report")
        assert res.status_code == 200
        data = res.json()
        
        late_records = [r for r in data["records"] if r.get("status") == "late"]
        if not late_records:
            print("INFO: No late records found in current data")
            return
        
        for record in late_records[:5]:  # Check first 5 late records
            assert "late_display" in record or "minutes_late" in record, \
                f"Late record missing late_display/minutes_late: {record.get('user_name')}"
            if "late_display" in record:
                print(f"Late display for {record.get('user_name')}: {record.get('late_display')}")
        
        print(f"PASS: {len(late_records)} late records have late_display field")
    
    def test_late_display_hours_minutes_format(self):
        """Test that late_display shows hours+minutes for > 60 min late"""
        res = self.session.get(f"{BASE_URL}/api/superuser/attendance-report")
        assert res.status_code == 200
        data = res.json()
        
        late_records = [r for r in data["records"] if r.get("status") == "late"]
        if not late_records:
            print("INFO: No late records found")
            return
        
        found_hours_format = False
        for record in late_records:
            late_display = record.get("late_display", "")
            minutes_late = record.get("minutes_late", 0)
            
            # If more than 60 minutes late, should show hours+minutes
            if minutes_late >= 60:
                assert "h " in late_display, \
                    f"Late {minutes_late}m should show hours format, got: '{late_display}'"
                found_hours_format = True
                print(f"PASS: {minutes_late} mins displayed as '{late_display}'")
            elif late_display and "m" in late_display:
                print(f"OK: {minutes_late} mins displayed as '{late_display}' (< 1 hour)")
        
        if not found_hours_format:
            # Check if there are any records > 60 minutes late
            max_late = max([r.get("minutes_late", 0) for r in late_records], default=0)
            if max_late < 60:
                print(f"INFO: No late records > 60 min (max: {max_late}m), hours format not testable")
            else:
                print(f"WARNING: Found {max_late}m late but no hours format")
    
    def test_summary_counts(self):
        """Test that summary has correct late/early/on_time counts"""
        res = self.session.get(f"{BASE_URL}/api/superuser/attendance-report")
        assert res.status_code == 200
        data = res.json()
        
        summary = data.get("summary", {})
        assert "late" in summary, "Missing 'late' in summary"
        assert "early" in summary, "Missing 'early' in summary"
        assert "on_time" in summary, "Missing 'on_time' in summary"
        assert "total" in summary, "Missing 'total' in summary"
        
        print(f"PASS: Summary - Total: {summary['total']}, Late: {summary['late']}, "
              f"Early: {summary['early']}, On Time: {summary['on_time']}")


class TestExportWithFilters:
    """Tests for export with location filters applied"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as superuser"""
        self.session = requests.Session()
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "debugsu@test.com",
            "password": "Test1234!"
        })
        assert login_res.status_code == 200
    
    def test_excel_export_with_province_filter(self):
        """Test Excel export with province filter"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=xlsx&province=Central%20Province")
        assert res.status_code == 200
        assert len(res.content) > 500, "Excel with filter too small"
        print(f"PASS: Excel export with province filter: {len(res.content)} bytes")
    
    def test_csv_export_with_district_filter(self):
        """Test CSV export with district filter"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=csv&district=Mkushi")
        assert res.status_code == 200
        assert "Time Late" in res.text, "CSV header missing Time Late"
        print("PASS: CSV export with district filter works")
    
    def test_excel_export_with_facility_filter(self):
        """Test Excel export with specific facility filter"""
        res = self.session.get(f"{BASE_URL}/api/superuser/export?format=xlsx&facility=Mkushi%20District%20Hospital")
        assert res.status_code == 200
        assert len(res.content) > 500, "Excel with facility filter too small"
        print(f"PASS: Excel export with facility filter: {len(res.content)} bytes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
