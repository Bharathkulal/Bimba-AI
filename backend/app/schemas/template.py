from pydantic import BaseModel, Field
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
