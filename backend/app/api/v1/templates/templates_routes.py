from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Any
from app.database.session import get_db
from app.models.admin_user import AdminUser
from app.models.student import Student
from app.api.v1.users.users_routes import get_current_admin
from app.api.analytics import get_current_student
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateReorderPayload,
    TemplateEnablePayload
)
from app.services.template_service import TemplateService

router = APIRouter(prefix="/templates", tags=["Resume Templates"])
service = TemplateService()

# --- PUBLIC / STUDENT READ-ONLY ENDPOINTS ---

@router.get("", response_model=List[TemplateResponse])
def get_templates(
    category: Optional[str] = Query(None),
    enabled: Optional[bool] = Query(None),
    premium: Optional[bool] = Query(None),
    q: Optional[str] = Query(None),
    db: Any = Depends(get_db)
):
    filters = {}
    if category is not None:
        filters["category"] = category
    if enabled is not None:
        filters["enabled"] = enabled
    if premium is not None:
        filters["premium"] = premium
        
    return service.list_templates(filters=filters, search_query=q)

@router.get("/categories", response_model=List[str])
def get_categories(db: Any = Depends(get_db)):
    return service.get_categories()

@router.get("/featured", response_model=List[TemplateResponse])
def get_featured_templates(db: Any = Depends(get_db)):
    return service.list_templates(filters={"featured": True, "enabled": True})

@router.get("/ats", response_model=List[TemplateResponse])
def get_ats_templates(db: Any = Depends(get_db)):
    return service.list_templates(filters={"atsFriendly": True, "enabled": True})

@router.get("/search", response_model=List[TemplateResponse])
def search_templates(q: str = Query(...), db: Any = Depends(get_db)):
    return service.list_templates(search_query=q)

@router.get("/analytics/dashboard")
def get_template_analytics(
    admin: AdminUser = Depends(get_current_admin),
    db: Any = Depends(get_db)
):
    return service.get_analytics()

@router.post("/track/{template_id}")
def track_template_interaction(
    template_id: str,
    action: str = Query("select"),
    selection_time: int = Query(0),
    student: Student = Depends(get_current_student),
    db: Any = Depends(get_db)
):
    success = service.track_selection(
        template_id=template_id,
        student_id=student.id,
        action=action,
        selection_time=selection_time
    )
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Interaction tracked successfully"}

@router.get("/{id}", response_model=TemplateResponse)
def get_template_by_id(id: str, db: Any = Depends(get_db)):
    template = service.get_template_by_id(id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

# --- ADMIN ENDPOINTS ---

@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: TemplateCreate,
    admin: AdminUser = Depends(get_current_admin),
    db: Any = Depends(get_db)
):
    existing = service.get_template_by_id(payload.templateId)
    if existing:
        raise HTTPException(status_code=400, detail="Template with this templateId already exists")
    return service.create_template(payload)

@router.put("/{id}", response_model=TemplateResponse)
def update_template(
    id: str,
    payload: TemplateUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: Any = Depends(get_db)
):
    template = service.update_template(id, payload)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_template(
    id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Any = Depends(get_db)
):
    success = service.delete_template(id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}

@router.patch("/reorder", status_code=status.HTTP_200_OK)
def reorder_templates(
    payload: TemplateReorderPayload,
    admin: AdminUser = Depends(get_current_admin),
    db: Any = Depends(get_db)
):
    success = service.reorder_templates(payload.templateIds)
    if not success:
        raise HTTPException(status_code=400, detail="Reordering failed")
    return {"message": "Templates reordered successfully"}

@router.patch("/enable", status_code=status.HTTP_200_OK)
def enable_templates(
    payload: TemplateEnablePayload,
    admin: AdminUser = Depends(get_current_admin),
    db: Any = Depends(get_db)
):
    success = service.enable_disable_templates(payload.templateIds, payload.enabled)
    if not success:
        raise HTTPException(status_code=400, detail="Bulk enabling/disabling failed")
    return {"message": f"Templates updated successfully"}

@router.patch("/disable", status_code=status.HTTP_200_OK)
def disable_templates(
    payload: TemplateReorderPayload,
    admin: AdminUser = Depends(get_current_admin),
    db: Any = Depends(get_db)
):
    success = service.enable_disable_templates(payload.templateIds, False)
    if not success:
        raise HTTPException(status_code=400, detail="Bulk disabling failed")
    return {"message": "Templates disabled successfully"}
