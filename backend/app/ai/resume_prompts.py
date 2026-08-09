# Modular AI prompt templates for Resume Intelligence Platform

RESUME_PARSE_PROMPT = """
You are an expert AI Resume Parser. Your task is to extract all content from the following resume text and parse it into a clean, structured JSON format.
This parser must work universally across all degrees, majors, and formats.

Extract all available sections:
1. personal_info (name, email, phone, address, linkedin, github, portfolio, title)
2. summary (professional summary / profile summary / about me)
3. objective (career objective)
4. education (institution, degree, field_of_study, passing_year, cgpa_percentage, location, achievements)
5. experience (company, position, duration, location, description, achievements)
6. internships (company, role, duration, location, description, achievements)
7. projects (name, description, tech_stack, role, duration, github_link, live_demo)
8. skills (list of all generic skills)
9. technicalSkills (list of technical skills / programming languages / frameworks / databases)
10. softSkills (list of soft skills / interpersonal skills)
11. tools (list of tools / software / platforms)
12. languages (list of languages spoken/known)
13. certifications (name, organization, issue_date, credential_id, credential_url, description)
14. achievements (list of achievements, awards, hackathons, honors)
15. awards (list of awards or distinctions)
16. research_papers (title, authors, journal/conference, year, url, description)
17. publications (title, publisher, year, url, description)
18. leadership (organization, role, duration, description)
19. volunteerExperience (organization, role, duration, description)
20. activities (list of extra-curricular activities / club participations)
21. portfolioLinks (list of links / urls)
22. references (name, title, company, email, phone, relationship)
23. hobbies (list of hobbies / interests)
24. custom_sections (list of objects representing ANY OTHER sections present in the resume that do not map to standard fields. Each custom section object must have "section_name" (string) and "content" (array of strings or details)).

CRITICAL RULES:
- EXTRACT VERBATIM: Do not paraphrase, do not shorten, do not summarize, do not omit any line, and preserve exact wording, spelling, punctuation, and formatting structure of the source text. Every single bullet point, date, number, punctuation mark, and abbreviation must be extracted exactly as it appears in the source.
- Return ONLY a valid JSON object matching the exact schema below.
- Do NOT add markdown code wrappers (no ```json).
- NEVER silently discard any section or information from the uploaded resume. Any heading/section not explicitly matching one of the standard schema fields (1-23) MUST be captured under "custom_sections" with its original header name and all related text/bullet points as content.
- IF A SECTION IS MISSING IN THE RESUME, YOU MUST RETURN AN EMPTY ARRAY [] FOR LIST FIELDS AND AN EMPTY STRING "" FOR TEXT FIELDS. NEVER RETURN NULL OR OMIT KEYS.
- Combine wrapped descriptions under the same parent section or item (e.g. projects, experiences) rather than breaking them up.

Schema:
{
  "personal_info": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string",
    "title": "string"
  },
  "summary": "string",
  "objective": "string",
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field_of_study": "string",
      "passing_year": "string",
      "cgpa_percentage": "string",
      "location": "string",
      "achievements": "string"
    }
  ],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "duration": "string",
      "location": "string",
      "description": "string",
      "achievements": "string"
    }
  ],
  "internships": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "location": "string",
      "description": "string",
      "achievements": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "tech_stack": "string",
      "role": "string",
      "duration": "string",
      "github_link": "string",
      "live_demo": "string"
    }
  ],
  "skills": ["string"],
  "technicalSkills": ["string"],
  "softSkills": ["string"],
  "tools": ["string"],
  "languages": ["string"],
  "certifications": [
    {
      "name": "string",
      "organization": "string",
      "issue_date": "string",
      "credential_id": "string",
      "credential_url": "string",
      "description": "string"
    }
  ],
  "achievements": ["string"],
  "awards": ["string"],
  "research_papers": [
    {
      "title": "string",
      "authors": "string",
      "journal": "string",
      "year": "string",
      "url": "string",
      "description": "string"
    }
  ],
  "publications": [
    {
      "title": "string",
      "publisher": "string",
      "year": "string",
      "url": "string",
      "description": "string"
    }
  ],
  "leadership": [
    {
      "organization": "string",
      "role": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "volunteerExperience": [
    {
      "organization": "string",
      "role": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "activities": ["string"],
  "portfolioLinks": ["string"],
  "references": [
    {
      "name": "string",
      "title": "string",
      "company": "string",
      "email": "string",
      "phone": "string",
      "relationship": "string"
    }
  ],
  "hobbies": ["string"],
  "custom_sections": [
    {
      "section_name": "string",
      "content": ["string"]
    }
  ]
}

Resume Text:
{resume_text}
"""

RESUME_ANALYZE_PROMPT = """
You are a senior recruiter and ATS (Applicant Tracking System) optimizer. Analyze the following resume (represented in structured JSON) and compute a series of scores (0 to 100) and specific, actionable recommendations.
Analyze:
- Overall Resume Score
- ATS Score
- Professional Writing Score
- Formatting Score
- Grammar Score
- Keyword Match Score
- Project Quality Score
- Experience Strength
- Education Completeness
- Technical Skills Score
- Soft Skills Score
- Resume Length (estimate in pages, e.g. "1 Page", "2 Pages")
- Readability (e.g. "Excellent", "Good", "Needs Improvement")

Generate detailed improvement suggestions. Each suggestion must contain:
1. Problem: Short summary of the issue.
2. Reason: Why it hurts the resume quality.
3. Recommended Fix: How to write or format it properly.
4. Priority: "High", "Medium", or "Low"

Do NOT generate fake placeholder recommendations. Base suggestions strictly on the JSON content provided.
Return ONLY a valid JSON object matching this schema, without markdown wrappers:
{
  "scores": {
    "overall_score": 75,
    "ats_score": 70,
    "professional_writing_score": 80,
    "formatting_score": 75,
    "grammar_score": 90,
    "keyword_match_score": 65,
    "project_quality_score": 70,
    "experience_strength": 60,
    "education_completeness": 95,
    "technical_skills_score": 80,
    "soft_skills_score": 70
  },
  "metadata": {
    "resume_length": "1 Page",
    "readability": "Good"
  },
  "suggestions": [
    {
      "problem": "string",
      "reason": "string",
      "fix": "string",
      "priority": "High"
    }
  ]
}

Resume JSON:
{resume_json}
"""

RESUME_IMPROVE_PROMPT = """
You are an expert AI Resume Writer. Rewrite and improve the following resume JSON based on the selected improvement goal: "{improvement_goal}".
You can improve the Summary, Projects, Experience, Skills, Achievements, descriptions, action verbs, grammar, and formatting.

CRITICAL RULES:
1. NEVER SHORTEN OR SUMMARIZE THE RESUME. If the original experience has 10 bullet points, keep 10 bullet points.
2. NEVER combine multiple projects, responsibilities, or skills into fewer entries.
3. NEVER delete details or achievements. Keep every single factual point intact.
4. DO NOT invent or fabricate fake experience, employment history, companies, certifications, degrees, or metrics.
5. ONLY rewrite, clarify, structure, and professionally expand existing descriptions using strong action verbs naturally.
6. If a bullet point is short, expand it professionally using only existing context (e.g. explain the technology stack used or the role's professional scope).
7. Keep the generated resume detailed and allow it to span multiple pages naturally.

Return ONLY a valid JSON representing the fully improved resume structure (matching the original schema keys). Do not add markdown blocks:
{resume_json}
"""

JD_MATCH_PROMPT = """
You are an AI Job Matching & Optimization Specialist. Compare the following Resume JSON with the pasted Job Description (JD) and compute match details.
Compute:
1. Overall Match Score (0 to 100)
2. Missing Skills (list of skills mentioned in the JD but missing from the resume)
3. Missing Keywords (important terms or tools in the JD not found in the resume)
4. Recommended Improvements (short notes on how to align experience descriptions)
5. Important Technologies (technologies in the JD)
6. Required Certifications (certifications mentioned in the JD)

Return ONLY a valid JSON object matching this schema:
{
  "overall_match_score": 85,
  "missing_skills": ["Docker", "Kubernetes"],
  "missing_keywords": ["Microservices", "RESTful design"],
  "recommended_improvements": "Add experience with deploying containers to matching section.",
  "important_technologies": ["React", "FastAPI", "Docker", "AWS"],
  "required_certifications": ["AWS Certified Architect"]
}

Resume JSON:
{resume_json}

Job Description:
{job_description}
"""

ATS_OPTIMIZATION_PROMPT = """
Optimize the wording of the following Resume JSON to align with the provided Job Description, without changing any factual details (do not add fake jobs, fake certifications, or fake degrees).
Only rewrite descriptions, objectives, summaries, and bullet points to include important keywords and match required skills.

Return ONLY the optimized valid JSON object:
{resume_json}

Job Description:
{job_description}
"""

RESUME_INTELLIGENCE_PROMPT = """
You are a senior recruiter, hiring manager, ATS (Applicant Tracking System) expert, and professional resume writer.
Analyze the following resume (JSON and original raw text) and return a comprehensive analysis, dynamic organization, and professional sentence-level optimizations.

Input Data:
Resume JSON:
{resume_json}

Original Raw Text:
{original_text}

OCR Confidence: {ocr_confidence}
Resume Language: {resume_language}
Target Job (optional): {target_job}
Target Industry (optional): {target_industry}


CRITICAL RULES:
1. ZERO INFORMATION LOSS: Keep every single experience, project, education entry, certification, award, skill, and language.
2. NO SUMMARIZATION: Do NOT summarize descriptions or combine multiple bullet points/items. Preserve the detail level of all entries.
3. NEVER invent, fabricate, or exaggerate achievements, companies, roles, certifications, degrees, or projects.
4. Maintain the detected resume language unless requested.
5. Optimize grammar, sentence flow, action verbs, clarity, and keyword density.
6. For every modification (Summary, Experiences, Projects), provide original, improved, and reason.
7. Group skills dynamically into context-aware categories (e.g., Programming Languages, Frameworks, Cloud, etc.).
8. Automatically determine the resume type, career level, and optimal section ordering based on content.
9. Compute detailed non-hardcoded ATS Scores across formatting, completeness, keywords, experience, skills, projects, grammar, and readability.

Your output MUST be ONLY a valid JSON object matching this schema, without markdown wrappers:
{
  "detected_metadata": {
    "resume_type": "Student | Software Engineer | Data Scientist | Management | Researcher | etc.",
    "career_level": "Student | Entry Level | Junior | Mid Level | Senior | Lead | Manager | Director | etc.",
    "section_order": ["summary", "education", "skills", "experience", "projects", "certifications", "hobbies", "etc."]
  },
  "summary": {
    "original": "original summary if present",
    "improved": "recruiter-quality summary using only extracted facts",
    "reason": "why it was improved"
  },
  "experience": [
    {
      "company": "string",
      "position": "string",
      "duration": "string",
      "original": "original descriptions / responsibilities",
      "improved": "achievement-oriented descriptions using strong action verbs naturally",
      "reason": "why it was improved"
    }
  ],
  "projects": [
    {
      "title": "string",
      "original": "original description",
      "improved": "impact-oriented rewrite explaining problem, solution, technologies, and impact",
      "reason": "why it was improved"
    }
  ],
  "skills_groups": [
    {
      "group_name": "Programming Languages | Cloud | Soft Skills | etc.",
      "skills": ["string"]
    }
  ],
  "ats_analysis": {
    "scores": {
      "overall_score": 75,
      "formatting_score": 80,
      "completeness_score": 85,
      "keywords_score": 70,
      "experience_score": 75,
      "skills_score": 80,
      "projects_score": 70,
      "grammar_score": 90,
      "readability_score": 85
    },
    "strengths": ["string"],
    "weaknesses": ["string"],
    "improvement_suggestions": ["string"],
    "missing_keywords": ["string"]
  },
  "confidence": 0.95
}
"""

