from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Union

class PersonalInfo(BaseModel):
    full_name: Optional[str] = ""
    name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    location: Optional[str] = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    portfolio: Optional[str] = ""
    website: Optional[str] = ""
    other_links: List[str] = Field(default_factory=list)
    title: Optional[str] = ""

# Backwards compatibility alias
PersonalInformation = PersonalInfo

class Education(BaseModel):
    id: Optional[Union[int, str]] = None
    degree: Optional[str] = ""
    specialization: Optional[str] = ""
    institution: Optional[str] = ""
    location: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    year: Optional[str] = ""
    passing_year: Optional[str] = ""
    score: Optional[str] = ""
    score_type: Optional[str] = ""  # "CGPA", "Percentage", "Grade", "Marks"
    cgpa_percentage: Optional[str] = ""
    description: Optional[str] = ""
    achievements: Optional[str] = ""

# Backwards compatibility alias
EducationItem = Education

class WorkExperience(BaseModel):
    id: Optional[Union[int, str]] = None
    company: Optional[str] = ""
    organization: Optional[str] = ""
    role: Optional[str] = ""
    position: Optional[str] = ""
    employment_type: Optional[str] = ""  # "Full-time", "Part-time", "Contract"
    location: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    duration: Optional[str] = ""
    is_current: Optional[bool] = False
    description: Optional[str] = ""
    responsibilities: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)

# Backwards compatibility alias
ExperienceItem = WorkExperience

class Internship(BaseModel):
    id: Optional[Union[int, str]] = None
    organization: Optional[str] = ""
    company: Optional[str] = ""
    role: Optional[str] = ""
    position: Optional[str] = ""
    location: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    duration: Optional[str] = ""
    is_current: Optional[bool] = False
    description: Optional[str] = ""
    responsibilities: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)

class Project(BaseModel):
    id: Optional[Union[int, str]] = None
    title: Optional[str] = ""
    name: Optional[str] = ""
    description: Optional[str] = ""
    technologies: Optional[Union[str, List[str]]] = ""
    tech_stack: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    duration: Optional[str] = ""
    url: Optional[str] = ""
    github: Optional[str] = ""
    achievements: List[str] = Field(default_factory=list)

# Backwards compatibility alias
ProjectItem = Project

class Certification(BaseModel):
    id: Optional[Union[int, str]] = None
    name: Optional[str] = ""
    title: Optional[str] = ""
    provider: Optional[str] = ""
    organization: Optional[str] = ""
    issuer: Optional[str] = ""
    issue_date: Optional[str] = ""
    year: Optional[str] = ""
    credential_id: Optional[str] = ""
    credential_url: Optional[str] = ""
    achievement: Optional[str] = ""
    description: Optional[str] = ""

# Backwards compatibility alias
CertificationItem = Certification

class Publication(BaseModel):
    id: Optional[Union[int, str]] = None
    title: Optional[str] = ""
    publication_type: Optional[str] = ""  # "Conference", "Journal", "Patent", "Article"
    authorship_type: Optional[str] = ""  # "Author", "Co-author", "Lead author"
    description: Optional[str] = ""
    publisher: Optional[str] = ""
    year: Optional[str] = ""
    url: Optional[str] = ""

class LeadershipRole(BaseModel):
    id: Optional[Union[int, str]] = None
    organization: Optional[str] = ""
    role: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    duration: Optional[str] = ""
    description: Optional[str] = ""

class Achievement(BaseModel):
    id: Optional[Union[int, str]] = None
    title: Optional[str] = ""
    description: Optional[str] = ""
    date: Optional[str] = ""
    year: Optional[str] = ""
    organization: Optional[str] = ""

class SkillCategory(BaseModel):
    category: str
    skills: List[str] = Field(default_factory=list)

class PersonalDetails(BaseModel):
    date_of_birth: Optional[str] = ""
    father_name: Optional[str] = ""
    mother_name: Optional[str] = ""
    gender: Optional[str] = ""
    nationality: Optional[str] = ""
    mother_tongue: Optional[str] = ""
    languages_known: List[str] = Field(default_factory=list)

class AdditionalInformation(BaseModel):
    title: Optional[str] = "Additional Information"
    section_name: Optional[str] = ""
    content: Union[str, List[str], Dict[str, Any]] = ""
    original_context: Optional[str] = ""

class ResumeValidation(BaseModel):
    completeness_score: float = 100.0
    entity_coverage: float = 1.0
    skill_coverage: float = 1.0
    section_coverage: float = 1.0
    warnings: List[str] = Field(default_factory=list)
    missing_details: List[Dict[str, Any]] = Field(default_factory=list)

class ResumeData(BaseModel):
    personal_info: PersonalInfo = Field(default_factory=PersonalInfo)
    objective: Optional[str] = ""
    summary: Optional[str] = ""
    career_objective: Optional[str] = ""
    professional_summary: Optional[str] = ""
    
    # Skills - support both categorized and flat lists
    skills: Union[List[SkillCategory], List[str], Dict[str, Any]] = Field(default_factory=list)
    skill_categories: List[SkillCategory] = Field(default_factory=list)
    technical_skills: List[str] = Field(default_factory=list)
    technicalSkills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    softSkills: List[str] = Field(default_factory=list)
    personalSkills: List[str] = Field(default_factory=list)
    
    # Core Sections
    education: List[Education] = Field(default_factory=list)
    internships: List[Internship] = Field(default_factory=list)
    work_experience: List[WorkExperience] = Field(default_factory=list)
    experience: List[WorkExperience] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    certifications: List[Certification] = Field(default_factory=list)
    publications: List[Publication] = Field(default_factory=list)
    achievements: List[Union[Achievement, str]] = Field(default_factory=list)
    leadership_roles: List[LeadershipRole] = Field(default_factory=list)
    leadership: List[Union[LeadershipRole, Dict[str, Any]]] = Field(default_factory=list)
    personal_skills: List[str] = Field(default_factory=list)
    hobbies: List[str] = Field(default_factory=list)
    hobbies_interests: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    personal_details: Optional[PersonalDetails] = Field(default_factory=PersonalDetails)
    
    # Custom / Additional sections
    additional_information: List[Union[AdditionalInformation, Dict[str, Any], str]] = Field(default_factory=list)
    additional_sections: List[Dict[str, Any]] = Field(default_factory=list)
    custom_sections: List[Dict[str, Any]] = Field(default_factory=list)
    portfolio_links: List[str] = Field(default_factory=list)
    portfolioLinks: List[str] = Field(default_factory=list)
    volunteer_experience: List[Dict[str, Any]] = Field(default_factory=list)
    volunteerExperience: List[Dict[str, Any]] = Field(default_factory=list)
    references: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Preservation & Verification Metadata
    original_file: Optional[Dict[str, Any]] = None
    raw_extracted_text: Optional[str] = ""
    raw_extraction: Optional[Dict[str, Any]] = None
    original_parsed_data: Optional[Dict[str, Any]] = None
    validation: Optional[ResumeValidation] = None
    extraction_version: Optional[str] = "2.0"

# Master compatibility alias
ResumeDocument = ResumeData