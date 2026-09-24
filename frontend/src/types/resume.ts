export interface PersonalInfo {
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
  title?: string;
}

export interface Education {
  id?: string | number;
  degree?: string;
  specialization?: string;
  institution?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  passingYear?: string;
  score?: string;
  description?: string;
}

export interface WorkExperience {
  id?: string | number;
  company?: string;
  role?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  responsibilities?: string[];
}

export interface Internship {
  id?: string | number;
  organization?: string;
  role?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  responsibilities?: string[];
}

export interface Project {
  id?: string | number;
  title?: string;
  description?: string;
  technologies?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  github?: string;
}

export interface Certification {
  id?: string | number;
  name?: string;
  issuer?: string;
  issueDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

export interface Publication {
  id?: string | number;
  title?: string;
  publisher?: string;
  year?: string;
  url?: string;
  description?: string;
}

export interface Achievement {
  id?: string | number;
  title?: string;
  date?: string;
  organization?: string;
  description?: string;
}

export interface LeadershipRole {
  id?: string | number;
  role?: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ResumeData {
  title?: string;
  personalInfo?: PersonalInfo;
  summary?: string;
  objective?: string;
  
  // Core Sections
  education?: Education[];
  experience?: WorkExperience[];
  internships?: Internship[];
  projects?: Project[];
  certifications?: Certification[];
  publications?: Publication[];
  achievements?: Achievement[];
  leadership?: LeadershipRole[];
  
  // Skills
  skills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  
  // Others
  languages?: string[];
  hobbies?: string[];
  references?: any[];
  
  // Original Data (Read-only)
  original_file?: any;
  raw_extracted_text?: string;
  original_parsed_data?: any;
}
