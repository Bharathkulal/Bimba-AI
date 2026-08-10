from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class PersonalInformation(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    portfolio: Optional[str] = ""
    title: Optional[str] = ""

class EducationItem(BaseModel):
    id: Optional[int]
    institution: Optional[str]
    degree: Optional[str]
    year: Optional[str]
    cgpa_percentage: Optional[str]

class ExperienceItem(BaseModel):
    id: Optional[int]
    position: Optional[str]
    company: Optional[str]
    duration: Optional[str]
    location: Optional[str]
    description: Optional[str]

class ProjectItem(BaseModel):
    id: Optional[int]
    title: Optional[str]
    tech_stack: Optional[str]
    duration: Optional[str]
    description: Optional[str]

class CertificationItem(BaseModel):
    id: Optional[int]
    name: Optional[str]
    organization: Optional[str]
    description: Optional[str]

class ResumeDocument(BaseModel):
    personal_information: PersonalInformation = Field(default_factory=PersonalInformation)
    professional_summary: Optional[str] = ""
    career_objective: Optional[str] = ""
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    internships: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    research: List[Dict[str, Any]] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)
    technical_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    awards: List[str] = Field(default_factory=list)
    publications: List[Dict[str, Any]] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    hobbies: List[str] = Field(default_factory=list)
    volunteering: List[Dict[str, Any]] = Field(default_factory=list)
    leadership: List[Dict[str, Any]] = Field(default_factory=list)
    references: List[Dict[str, Any]] = Field(default_factory=list)
    additional_sections: List[Dict[str, Any]] = Field(default_factory=list)
    unclassified_content: List[str] = Field(default_factory=list)
    raw_extraction: Optional[Dict[str, Any]] = None
    original_parsed_data: Optional[Dict[str, Any]] = None
    extraction_version: Optional[str] = "1.0"