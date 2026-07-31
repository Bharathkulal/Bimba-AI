# Modular AI prompt templates for Resume Intelligence Platform

RESUME_PARSE_PROMPT = """
You are an expert AI Resume Parser. Your task is to extract all content from the following resume text and parse it into a clean, structured JSON format.
This parser must work universally across all degrees, majors, and formats (e.g. BCA, BBA, B.Com, B.Tech, MBA, MCA, M.Tech, BS, MS, BA, MA, etc.).

Extract all available sections:
1. Personal Information (name, email, phone, address, linkedin, github, portfolio)
2. Summary (professional summary / profile summary / about me)
3. Objective (career objective)
4. Education (institution, degree, field_of_study, passing_year, cgpa_percentage, location, achievements)
5. Experience (company, position, duration, location, description, achievements)
6. Projects (name, description, tech_stack, role, duration, github_link, live_demo)
7. Technical Skills (list of technical skills / programming languages / tools)
8. Soft Skills (list of soft skills / interpersonal skills)
9. Certifications (name, organization, issue_date, credential_id, credential_url)
10. Internships (company, role, duration, location, description, achievements)
11. Achievements (list of achievements, awards, hackathons, honors)
12. Languages (list of languages spoken/known)
13. Portfolio Links (list of portfolio, GitHub, LinkedIn, or personal website links)
14. Publications (title, publisher, year, url, description)
15. Volunteer Experience (organization, role, duration, description)
16. References (name, title, company, email, phone, relationship)

CRITICAL RULES:
- Return ONLY a valid JSON object matching the exact schema below.
- Do NOT add markdown code wrappers (no ```json).
- IF A SECTION IS MISSING IN THE RESUME, YOU MUST RETURN AN EMPTY ARRAY [] FOR LIST FIELDS AND AN EMPTY STRING "" FOR TEXT FIELDS. NEVER RETURN NULL OR OMIT KEYS.
- ACHIEVEMENTS & AWARDS PARSING: Parse content strictly according to the section header under which it appears in the original resume. All bullet points listed under an "ACHIEVEMENTS" header belong in the "achievements" array. Do NOT move items from the "ACHIEVEMENTS" section into "publications" even if they mention patents, books, YouTube, or articles. Only populate "publications" if there is an explicit "PUBLICATIONS", "PATENTS", or "RESEARCH PAPERS" section header in the resume text.
- PROJECTS PARSING: Each distinct project begins with a title or bullet point. If a project description wraps across multiple lines in the text, DO NOT split wrapped lines into separate projects titled "Project". Combine all description text under the SAME parent project entry so the total count of projects matches the actual resume.

Schema:
{
  "personal_info": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
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
  "technicalSkills": ["string"],
  "softSkills": ["string"],
  "certifications": [
    {
      "name": "string",
      "organization": "string",
      "issue_date": "string",
      "credential_id": "string",
      "credential_url": "string"
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
  "achievements": ["string"],
  "languages": ["string"],
  "portfolioLinks": ["string"],
  "publications": [
    {
      "title": "string",
      "publisher": "string",
      "year": "string",
      "url": "string",
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
  "references": [
    {
      "name": "string",
      "title": "string",
      "company": "string",
      "email": "string",
      "phone": "string",
      "relationship": "string"
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
- DO NOT invent or fabricate fake experience, employment history, or companies.
- DO NOT fabricate certifications or degrees.
- ONLY rewrite, clarify, structure, and improve existing bullet points and text.
- Use strong action verbs (e.g., 'Spearheaded', 'Optimized', 'Architected').
- Quantify achievements where possible (e.g. 'improving load speed by 25%') based on details in the original description, or structure them to allow numbers.

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
