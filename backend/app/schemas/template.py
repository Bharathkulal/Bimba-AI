from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class TemplateColors(BaseModel):
    primary: str = "#111111"
    secondary: str = "#666666"

class TemplateFont(BaseModel):
    family: str = "Inter"
    heading: int = 18
    body: int = 11

class TemplateLayout(BaseModel):
    columns: int = 1
    header: str = "top"
    spacing: int = 16
    margin: int = 32

class TemplateBase(BaseModel):
    templateId: str
    name: str
    slug: str
    category: str
    description: Optional[str] = ""
    previewImage: Optional[str] = ""
    thumbnail: Optional[str] = ""
    coverImage: Optional[str] = ""
    atsFriendly: bool = True
    atsScore: int = 80
    featured: bool = False
    premium: bool = False
    recommendedFor: List[str] = []
    industry: List[str] = []
    colors: TemplateColors = Field(default_factory=TemplateColors)
    font: TemplateFont = Field(default_factory=TemplateFont)
    layout: TemplateLayout = Field(default_factory=TemplateLayout)
    sections: List[str] = ["header", "summary", "experience", "projects", "skills", "education", "certifications"]
    renderer: str
    enabled: bool = True
    displayOrder: int = 1

    @model_validator(mode="before")
    @classmethod
    def pre_adjust_mongodb_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
            
        # 1. Map ID/templateId
        if "templateId" not in data or not data["templateId"]:
            data["templateId"] = str(data.get("slug") or data.get("id") or data.get("_id") or "")
        if "id" in data and data["id"] is not None:
            data["id"] = str(data["id"])
            
        # 2. Map atsScore
        if "atsScore" not in data or data["atsScore"] is None:
            data["atsScore"] = data.get("ats_rating") or 80
            
        # 3. Map premium
        if "premium" not in data or data["premium"] is None:
            data["premium"] = data.get("is_premium") or False
            
        # 4. Map enabled
        if "enabled" not in data or data["enabled"] is None:
            data["enabled"] = data.get("is_enabled") or data.get("is_active") or True
            
        # 5. Map layout
        if "layout" in data:
            raw_layout = data["layout"]
            if isinstance(raw_layout, str):
                cols = 2 if "two" in raw_layout else 1
                data["layout"] = {
                    "columns": cols,
                    "header": "top",
                    "spacing": data.get("spacing") or 16,
                    "margin": 32
                }
                
        # 6. Map sections
        if "sections" in data:
            raw_sections = data["sections"]
            if isinstance(raw_sections, list):
                new_sec = []
                for s in raw_sections:
                    if isinstance(s, dict):
                        new_sec.append(s.get("type") or s.get("title") or "")
                    elif isinstance(s, str):
                        new_sec.append(s)
                data["sections"] = new_sec
                
        # 7. Map font/fonts
        if "font" not in data or data["font"] is None:
            raw_fonts = data.get("fonts") or {}
            data["font"] = {
                "family": raw_fonts.get("body") or "Inter",
                "heading": 18,
                "body": 11
            }
            
        # 8. Map colors
        if "colors" in data:
            raw_colors = data["colors"]
            if isinstance(raw_colors, dict):
                data["colors"] = {
                    "primary": raw_colors.get("primary") or "#111111",
                    "secondary": raw_colors.get("secondary") or "#666666"
                }
                
        # 9. Map renderer
        if "renderer" not in data or not data["renderer"]:
            data["renderer"] = "standard"
            
        return data

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    previewImage: Optional[str] = None
    thumbnail: Optional[str] = None
    coverImage: Optional[str] = None
    atsFriendly: Optional[bool] = None
    atsScore: Optional[int] = None
    featured: Optional[bool] = None
    premium: Optional[bool] = None
    recommendedFor: Optional[List[str]] = None
    industry: Optional[List[str]] = None
    colors: Optional[TemplateColors] = None
    font: Optional[TemplateFont] = None
    layout: Optional[TemplateLayout] = None
    sections: Optional[List[str]] = None
    renderer: Optional[str] = None
    enabled: Optional[bool] = None
    displayOrder: Optional[int] = None

class TemplateResponse(TemplateBase):
    id: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class TemplateReorderPayload(BaseModel):
    templateIds: List[str]

class TemplateEnablePayload(BaseModel):
    templateIds: List[str]
    enabled: bool
