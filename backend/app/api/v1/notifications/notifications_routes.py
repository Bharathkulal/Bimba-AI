from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime, timedelta

from app.database.session import get_db
from app.models.student import Student
from app.core.security import verify_token
from app.core.mongodb import MongoModel, get_next_sequence

router = APIRouter(tags=["Notifications System"])

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        # Maps student_id (int) to a list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, student_id: int, websocket: WebSocket):
        await websocket.accept()
        if student_id not in self.active_connections:
            self.active_connections[student_id] = []
        self.active_connections[student_id].append(websocket)

    def disconnect(self, student_id: int, websocket: WebSocket):
        if student_id in self.active_connections:
            if websocket in self.active_connections[student_id]:
                self.active_connections[student_id].remove(websocket)
            if not self.active_connections[student_id]:
                del self.active_connections[student_id]

    async def send_notification(self, student_id: int, notification: dict):
        if student_id in self.active_connections:
            for connection in self.active_connections[student_id]:
                try:
                    await connection.send_json({
                        "event": "new_notification",
                        "data": notification
                    })
                except Exception:
                    pass

    async def broadcast(self, notification: dict):
        for student_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json({
                        "event": "new_notification",
                        "data": notification
                    })
                except Exception:
                    pass

manager = ConnectionManager()

# --- Auth Helpers ---
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_student_from_token(token: str, db: Any) -> Student:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    roll_number = verify_token(token)
    if not roll_number:
        raise HTTPException(status_code=401, detail="Invalid token")
    student_doc = db.students.find_one({"roll_number": roll_number})
    if not student_doc:
        # Check admin user
        admin_doc = db.admin_users.find_one({"username": roll_number})
        if admin_doc:
            return Student({
                "id": 9999,
                "roll_number": "ADMIN",
                "student_name": "Administrator",
                "email": admin_doc.get("email", "admin@bimba.ai")
            })
        raise HTTPException(status_code=404, detail="Student not found")
    return Student(student_doc)

def get_auth_student(token: str = Depends(oauth2_scheme), db: Any = Depends(get_db)) -> Student:
    return get_current_student_from_token(token, db)

# --- Pydantic Schemas ---
class NotificationCreateSchema(BaseModel):
    userId: int
    title: str
    description: str
    type: str = "System"  # "Resume", "Jobs", "Placement", "Interview", "AI", "System", "Announcement"
    priority: str = "Low"  # "Low", "Medium", "High", "Critical"
    icon: Optional[str] = "⚙️"
    actionUrl: Optional[str] = ""
    expiresInDays: Optional[int] = 30

class NotificationSettingsSchema(BaseModel):
    resumeUpdates: bool = True
    jobs: bool = True
    placement: bool = True
    aiSuggestions: bool = True
    interviewAlerts: bool = True
    announcements: bool = True
    emailNotifications: bool = True
    pushNotifications: bool = True
    desktopNotifications: bool = True

# --- REST Endpoints ---

@router.post("/notifications")
async def create_notification(payload: NotificationCreateSchema, db: Any = Depends(get_db)):
    next_id = get_next_sequence("notifications")
    created_at = datetime.utcnow()
    expires_at = created_at + timedelta(days=payload.expiresInDays)
    
    doc = {
        "id": next_id,
        "student_id": payload.userId, # Map to student_id field used in current codebase
        "userId": payload.userId,
        "title": payload.title,
        "description": payload.description,
        "type": payload.type,
        "priority": payload.priority,
        "icon": payload.icon,
        "actionUrl": payload.actionUrl,
        "isRead": False,
        "is_read": False, # Double-write for backwards compatibility
        "isPinned": False,
        "isArchived": False,
        "category": payload.type.lower(), # For backwards compatibility with old filter logic
        "message": payload.description, # For backwards compatibility
        "created_at": created_at, # Backwards compatibility
        "createdAt": created_at,
        "expiresAt": expires_at
    }
    
    db.notifications.insert_one(doc)
    
    # Broadcast or send to user in real-time
    doc_out = {k: str(v) if isinstance(v, datetime) else v for k, v in doc.items()}
    if "_id" in doc_out:
        doc_out["_id"] = str(doc_out["_id"])
        
    await manager.send_notification(payload.userId, doc_out)
    return {"success": True, "id": next_id}

@router.get("/notifications")
def get_notifications(
    category: Optional[str] = None,
    search: Optional[str] = None,
    unread_only: Optional[bool] = False,
    archived_only: Optional[bool] = False,
    student: Student = Depends(get_auth_student),
    db: Any = Depends(get_db)
):
    query = {"userId": student.id}
    
    # Category / Type Filter
    if category and category.lower() != "all":
        query["type"] = {"$regex": f"^{category}$", "$options": "i"}
        
    # Search Query Filter
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"type": {"$regex": search, "$options": "i"}}
        ]
        
    # Read status filter
    if unread_only:
        query["isRead"] = False
        
    # Archive filter
    query["isArchived"] = True if archived_only else {"$ne": True}
    
    # Fetch and sort: Pinned first, then by createdAt descending
    notifs = list(db.notifications.find(query).sort([("isPinned", -1), ("createdAt", -1)]))
    
    out = []
    for n in notifs:
        if "_id" in n:
            n["_id"] = str(n["_id"])
        if "createdAt" in n and isinstance(n["createdAt"], datetime):
            n["createdAt"] = n["createdAt"].isoformat()
        if "created_at" in n and isinstance(n["created_at"], datetime):
            n["created_at"] = n["created_at"].isoformat()
        out.append(n)
        
    return out

@router.get("/notifications/unread-count")
def get_unread_count(student: Student = Depends(get_auth_student), db: Any = Depends(get_db)):
    count = db.notifications.count_documents({
        "userId": student.id,
        "isRead": False,
        "isArchived": {"$ne": True}
    })
    return {"unread_count": count}

@router.put("/notifications/{id}/read")
def mark_notification_read(id: int, student: Student = Depends(get_auth_student), db: Any = Depends(get_db)):
    res = db.notifications.update_one(
        {"id": id, "userId": student.id},
        {"$set": {"isRead": True, "is_read": True}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

@router.put("/notifications/read-all")
def mark_all_read(student: Student = Depends(get_auth_student), db: Any = Depends(get_db)):
    db.notifications.update_many(
        {"userId": student.id, "isRead": False},
        {"$set": {"isRead": True, "is_read": True}}
    )
    return {"success": True}

@router.delete("/notifications/{id}")
def delete_notification(id: int, student: Student = Depends(get_auth_student), db: Any = Depends(get_db)):
    res = db.notifications.delete_one({"id": id, "userId": student.id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

@router.put("/notifications/{id}/archive")
def archive_notification(id: int, student: Student = Depends(get_auth_student), db: Any = Depends(get_db)):
    res = db.notifications.update_one(
        {"id": id, "userId": student.id},
        {"$set": {"isArchived": True}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

@router.put("/notifications/{id}/pin")
def pin_notification(id: int, pin: bool = True, student: Student = Depends(get_auth_student), db: Any = Depends(get_db)):
    res = db.notifications.update_one(
        {"id": id, "userId": student.id},
        {"$set": {"isPinned": pin}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

# --- Settings ---
@router.get("/notifications/settings", response_model=NotificationSettingsSchema)
def get_notification_settings(student: Student = Depends(get_auth_student), db: Any = Depends(get_db)):
    settings_doc = db.notification_settings.find_one({"userId": student.id})
    if not settings_doc:
        # Return defaults
        return NotificationSettingsSchema().dict()
    return settings_doc

@router.put("/notifications/settings")
def update_notification_settings(payload: NotificationSettingsSchema, student: Student = Depends(get_auth_student), db: Any = Depends(get_db)):
    db.notification_settings.update_one(
        {"userId": student.id},
        {"$set": payload.dict()},
        upsert=True
    )
    return {"success": True}

# --- WebSocket Protected Endpoint ---
@router.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None), db: Any = Depends(get_db)):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    try:
        student = get_current_student_from_token(token, db)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(student.id, websocket)
    try:
        while True:
            # Keep connection alive, listen for client messages if any
            data = await websocket.receive_text()
            # Echo or process client message
    except WebSocketDisconnect:
        manager.disconnect(student.id, websocket)
    except Exception:
        manager.disconnect(student.id, websocket)
