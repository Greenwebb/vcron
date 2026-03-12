from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import resend
from io import BytesIO
import openpyxl

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'vchron-super-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Resend Configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
BACKUP_EMAIL = os.environ.get('BACKUP_EMAIL', 'northmkushidistrict@gmail.com')

# Create the main app
app = FastAPI(title="V-Chron API", description="Healthcare Attendance Tracking System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== FACILITIES LIST =====================
FACILITIES = [
    "Chalata Rural Health Centre",
    "Changilo Health Post",
    "Chibwemukunga Health Post",
    "Nambo Rural Health Post",
    "Ntekete Health Post",
    "Chibefwe Health Centre",
    "Milombwe Health Post",
    "Tazara Health Post",
    "Mulundu Health Post",
    "Chitina Health Post",
    "Chikabile Health Post",
    "Kabengeshi Rural Health Post",
    "Kakushi Health Post",
    "Luanshimba Rural Health Centre (Mkushi)",
    "Mboboli Rural Health Post",
    "Mulungwe Rural Health Centre",
    "Matuku Health Post",
    "Miloso Health Post",
    "Momboshi Health Post",
    "Twatasha Health Post",
    "Fibanga Health Post",
    "Munsakamba Health Post",
    "Katuba Health Post",
    "Nkulumashiba Rural Health Post",
    "Chisanga Rural Health Centre",
    "Musofu Rural Health Centre",
    "Upper Musofu Health Post",
    "Chengelo Clinic",
    "Kasalamakanga Health Post",
    "Nkolonga Farm Clinic",
    "Nkolonga Health Post",
    "Chine Rural Health Post",
    "Fiwila Rural Health Centre",
    "Kalubula Rural Health Post",
    "Nyenje Health Post",
    "Shaibila Health Post",
    "Kasokota Health Post",
    "Mikunku Rural Health Centre",
    "Nkumbi College Clinic",
    "Nkumbi Rural Health Centre",
    "Lilanda Health Post",
    "Malubila Health Post",
    "Mankanda Health Post",
    "Milele Health Post",
    "Nshinso Rural Health Centre",
    "Upper Lusemfwa Health Post",
    "Mkushi District Hospital"
]

POSITIONS = [
    "Nurse",
    "Clinical Officer",
    "Environmental Health Technician",
    "Medical Doctor",
    "Pharmacist",
    "Laboratory Technician",
    "Radiographer",
    "Physiotherapist",
    "Midwife",
    "Community Health Worker",
    "Administrative Staff",
    "Other"
]

# ===================== PYDANTIC MODELS =====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    position: Optional[str] = None
    facility: Optional[str] = None
    picture: Optional[str] = None
    role: str = "user"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    position: str
    facility: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    position: Optional[str] = None
    facility: Optional[str] = None
    picture: Optional[str] = None
    role: str = "user"
    created_at: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    facility: Optional[str] = None
    role: Optional[str] = None

class AttendanceRecord(BaseModel):
    attendance_id: str
    user_id: str
    user_name: str
    position: str
    facility: str
    action: str  # "login" or "logout"
    timestamp: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    synced: bool = True

class AttendanceCreate(BaseModel):
    action: str  # "login" or "logout"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    offline_id: Optional[str] = None  # For offline sync

class OfflineAttendanceSync(BaseModel):
    records: List[AttendanceCreate]

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ===================== HELPER FUNCTIONS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        "user_id": user_id,
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> dict:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Then check Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a JWT token (for email/password auth)
    try:
        payload = decode_jwt_token(session_token)
        user_id = payload.get("user_id")
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        pass
    
    # Check if it's a session token (for Google OAuth)
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiration
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ===================== AUTH ROUTES =====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate facility and position
    if user_data.facility not in FACILITIES:
        raise HTTPException(status_code=400, detail="Invalid facility")
    if user_data.position not in POSITIONS:
        raise HTTPException(status_code=400, detail="Invalid position")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "position": user_data.position,
        "facility": user_data.facility,
        "picture": None,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Generate token
    token = create_jwt_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user_id,
            email=user_data.email,
            name=user_data.name,
            position=user_data.position,
            facility=user_data.facility,
            role="user",
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("password"):
        raise HTTPException(status_code=401, detail="Please use Google sign-in for this account")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_jwt_token(user["user_id"])
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"],
            position=user.get("position"),
            facility=user.get("facility"),
            picture=user.get("picture"),
            role=user.get("role", "user"),
            created_at=user.get("created_at")
        )
    )

@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process Google OAuth session_id and create session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get session data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            session_data = auth_response.json()
        except httpx.RequestError as e:
            logger.error(f"Error calling auth service: {e}")
            raise HTTPException(status_code=500, detail="Authentication service error")
    
    email = session_data.get("email")
    name = session_data.get("name")
    picture = session_data.get("picture")
    session_token = session_data.get("session_token")
    
    # Check if user exists
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if user:
        # Update existing user
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
        user_id = user["user_id"]
    else:
        # Create new user (needs to complete registration)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "position": None,
            "facility": None,
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get updated user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "position": user.get("position"),
        "facility": user.get("facility"),
        "picture": user.get("picture"),
        "role": user.get("role", "user"),
        "needs_registration": user.get("position") is None or user.get("facility") is None
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        position=user.get("position"),
        facility=user.get("facility"),
        picture=user.get("picture"),
        role=user.get("role", "user"),
        created_at=user.get("created_at")
    )

@api_router.post("/auth/complete-registration", response_model=UserResponse)
async def complete_registration(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    position = body.get("position")
    facility = body.get("facility")
    
    if not position or not facility:
        raise HTTPException(status_code=400, detail="Position and facility are required")
    
    if facility not in FACILITIES:
        raise HTTPException(status_code=400, detail="Invalid facility")
    if position not in POSITIONS:
        raise HTTPException(status_code=400, detail="Invalid position")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"position": position, "facility": facility}}
    )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    return UserResponse(
        user_id=updated_user["user_id"],
        email=updated_user["email"],
        name=updated_user["name"],
        position=updated_user.get("position"),
        facility=updated_user.get("facility"),
        picture=updated_user.get("picture"),
        role=updated_user.get("role", "user"),
        created_at=updated_user.get("created_at")
    )

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ===================== DATA ROUTES =====================

@api_router.get("/facilities")
async def get_facilities():
    return {"facilities": FACILITIES}

@api_router.get("/positions")
async def get_positions():
    return {"positions": POSITIONS}

# ===================== ATTENDANCE ROUTES =====================

@api_router.post("/attendance", response_model=AttendanceRecord)
async def create_attendance(attendance: AttendanceCreate, user: dict = Depends(get_current_user)):
    if not user.get("position") or not user.get("facility"):
        raise HTTPException(status_code=400, detail="Please complete your profile first")
    
    if attendance.action not in ["login", "logout"]:
        raise HTTPException(status_code=400, detail="Action must be 'login' or 'logout'")
    
    attendance_id = f"att_{uuid.uuid4().hex[:12]}"
    
    record = {
        "attendance_id": attendance_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "position": user["position"],
        "facility": user["facility"],
        "action": attendance.action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "latitude": attendance.latitude,
        "longitude": attendance.longitude,
        "synced": True,
        "offline_id": attendance.offline_id
    }
    
    await db.attendance.insert_one(record)
    
    return AttendanceRecord(**{k: v for k, v in record.items() if k != "offline_id"})

@api_router.post("/attendance/sync")
async def sync_offline_attendance(sync_data: OfflineAttendanceSync, user: dict = Depends(get_current_user)):
    """Sync offline attendance records"""
    if not user.get("position") or not user.get("facility"):
        raise HTTPException(status_code=400, detail="Please complete your profile first")
    
    synced_records = []
    
    for record in sync_data.records:
        # Check if already synced (by offline_id)
        if record.offline_id:
            existing = await db.attendance.find_one({"offline_id": record.offline_id}, {"_id": 0})
            if existing:
                synced_records.append(existing)
                continue
        
        attendance_id = f"att_{uuid.uuid4().hex[:12]}"
        
        new_record = {
            "attendance_id": attendance_id,
            "user_id": user["user_id"],
            "user_name": user["name"],
            "position": user["position"],
            "facility": user["facility"],
            "action": record.action,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "latitude": record.latitude,
            "longitude": record.longitude,
            "synced": True,
            "offline_id": record.offline_id
        }
        
        await db.attendance.insert_one(new_record)
        synced_records.append(new_record)
    
    return {"synced": len(synced_records), "records": synced_records}

@api_router.get("/attendance/me")
async def get_my_attendance(
    limit: int = 50,
    skip: int = 0,
    user: dict = Depends(get_current_user)
):
    """Get current user's attendance history"""
    records = await db.attendance.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.attendance.count_documents({"user_id": user["user_id"]})
    
    return {"records": records, "total": total}

@api_router.get("/attendance/status")
async def get_attendance_status(user: dict = Depends(get_current_user)):
    """Get user's current attendance status (logged in or not)"""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get today's records
    today_records = await db.attendance.find(
        {
            "user_id": user["user_id"],
            "timestamp": {"$gte": today.isoformat()}
        },
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    
    if not today_records:
        return {"status": "not_logged_in", "last_action": None}
    
    last_record = today_records[0]
    
    if last_record["action"] == "login":
        return {"status": "on_duty", "last_action": last_record}
    else:
        return {"status": "off_duty", "last_action": last_record}

# ===================== ADMIN ROUTES =====================

@api_router.get("/admin/users")
async def admin_get_users(
    skip: int = 0,
    limit: int = 50,
    facility: Optional[str] = None,
    user: dict = Depends(get_admin_user)
):
    query = {}
    if facility:
        query["facility"] = facility
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total}

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, update: UserUpdate, user: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    return updated_user

@api_router.get("/admin/attendance")
async def admin_get_attendance(
    skip: int = 0,
    limit: int = 100,
    facility: Optional[str] = None,
    date: Optional[str] = None,
    user_name: Optional[str] = None,
    user: dict = Depends(get_admin_user)
):
    query = {}
    
    if facility:
        query["facility"] = facility
    
    if date:
        # Parse date and create range
        try:
            date_obj = datetime.fromisoformat(date.replace('Z', '+00:00'))
            start = date_obj.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
            query["timestamp"] = {"$gte": start.isoformat(), "$lt": end.isoformat()}
        except Exception:
            pass
    
    if user_name:
        query["user_name"] = {"$regex": user_name, "$options": "i"}
    
    records = await db.attendance.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.attendance.count_documents(query)
    
    return {"records": records, "total": total}

@api_router.get("/admin/attendance/realtime")
async def admin_get_realtime_attendance(user: dict = Depends(get_admin_user)):
    """Get real-time attendance - staff currently on duty"""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get all today's attendance records
    today_records = await db.attendance.find(
        {"timestamp": {"$gte": today.isoformat()}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(1000)
    
    # Group by user and find those who are on duty (last action is login)
    user_status = {}
    for record in today_records:
        uid = record["user_id"]
        if uid not in user_status:
            user_status[uid] = record
    
    on_duty = [r for r in user_status.values() if r["action"] == "login"]
    
    # Get facility breakdown
    facility_counts = {}
    for record in on_duty:
        facility = record["facility"]
        facility_counts[facility] = facility_counts.get(facility, 0) + 1
    
    return {
        "on_duty_count": len(on_duty),
        "on_duty_staff": on_duty,
        "facility_breakdown": facility_counts
    }

@api_router.get("/admin/export")
async def admin_export_attendance(
    facility: Optional[str] = None,
    date: Optional[str] = None,
    format: str = "csv",
    user: dict = Depends(get_admin_user)
):
    """Export attendance records as CSV or Excel"""
    query = {}
    
    if facility:
        query["facility"] = facility
    
    if date:
        try:
            date_obj = datetime.fromisoformat(date.replace('Z', '+00:00'))
            start = date_obj.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
            query["timestamp"] = {"$gte": start.isoformat(), "$lt": end.isoformat()}
        except Exception:
            pass
    
    records = await db.attendance.find(query, {"_id": 0}).sort("timestamp", -1).to_list(10000)
    
    if format == "csv":
        # Generate CSV
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["Staff Name", "Position", "Facility", "Action", "Timestamp", "Latitude", "Longitude"])
        
        for r in records:
            writer.writerow([
                r.get("user_name", ""),
                r.get("position", ""),
                r.get("facility", ""),
                r.get("action", ""),
                r.get("timestamp", ""),
                r.get("latitude", ""),
                r.get("longitude", "")
            ])
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=attendance_{date or 'all'}.csv"}
        )
    else:
        # Generate Excel
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Attendance"
        
        headers = ["Staff Name", "Position", "Facility", "Action", "Timestamp", "Latitude", "Longitude"]
        ws.append(headers)
        
        for r in records:
            ws.append([
                r.get("user_name", ""),
                r.get("position", ""),
                r.get("facility", ""),
                r.get("action", ""),
                r.get("timestamp", ""),
                r.get("latitude", ""),
                r.get("longitude", "")
            ])
        
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=attendance_{date or 'all'}.xlsx"}
        )

# ===================== EMAIL BACKUP ROUTE =====================

@api_router.post("/admin/send-backup")
async def send_backup_email(
    date: Optional[str] = None,
    user: dict = Depends(get_admin_user)
):
    """Send attendance backup email"""
    if not resend.api_key:
        raise HTTPException(status_code=500, detail="Email service not configured")
    
    query = {}
    if date:
        try:
            date_obj = datetime.fromisoformat(date.replace('Z', '+00:00'))
            start = date_obj.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
            query["timestamp"] = {"$gte": start.isoformat(), "$lt": end.isoformat()}
        except Exception:
            pass
    
    records = await db.attendance.find(query, {"_id": 0}).sort("timestamp", -1).to_list(10000)
    
    # Build HTML table
    rows_html = ""
    for r in records:
        rows_html += f"""
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">{r.get("user_name", "")}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{r.get("position", "")}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{r.get("facility", "")}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{r.get("action", "").upper()}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{r.get("timestamp", "")}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">{r.get("latitude", "N/A")}, {r.get("longitude", "N/A")}</td>
        </tr>
        """
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2 style="color: #0f766e;">V-Chron Attendance Backup</h2>
        <p>Date: {date or 'All records'}</p>
        <p>Total Records: {len(records)}</p>
        <table style="border-collapse: collapse; width: 100%;">
            <thead>
                <tr style="background-color: #0f766e; color: white;">
                    <th style="padding: 8px; border: 1px solid #ddd;">Staff Name</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Position</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Facility</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Action</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Timestamp</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">GPS Coordinates</th>
                </tr>
            </thead>
            <tbody>
                {rows_html}
            </tbody>
        </table>
        <p style="margin-top: 20px; color: #666;">Generated by V-Chron - The Truth of Time</p>
    </body>
    </html>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [BACKUP_EMAIL],
        "subject": f"V-Chron Attendance Backup - {date or 'All Records'}",
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {"message": "Backup email sent successfully", "email_id": email.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# ===================== HEALTH CHECK =====================

@api_router.get("/")
async def root():
    return {"message": "V-Chron API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
