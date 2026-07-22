# Modular AI prompt templates for Resume Intelligence Platform

RESUME_PARSE_PROMPT = """
You are an expert AI Resume Parser. Your task is to extract all content from the following resume text and parse it into a clean, structured JSON format. 
Make sure to extract:
1. Personal Information (name, email, phone, address, linkedin, github, portfolio, summary)
2. Education (institution, degree, board, percentage, cgpa, passing_year, achievements)
3. Experience (company, position, duration, description, achievements)
4. Projects (name, description, tech_stack, role, duration, github_link, live_demo, achievements)
5. Skills (category, name, level as a rating from 1 to 5)
6. Certifications (name, organization, issue_date, credential_id, credential_url)
7. Achievements (hackathons, awards, soft_skills, extracurricular)
8. Languages (list of languages)
9. Links (additional urls)

Ensure that you DO NOT invent or fabricate any details. Extract only what is present in the text. Return ONLY a valid JSON object matching this schema, without markdown code blocks:
{
  "personal_info": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string",
    "summary": "string"
  },
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "board": "string or null",
      "percentage": "float or null",
      "cgpa": "float or null",
      "passing_year": "integer",
      "achievements": "string or null"
    }
  ],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "duration": "string",
      "description": "string",
      "achievements": "string or null"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "tech_stack": "string",
      "role": "string or null",
      "duration": "string or null",
      "github_link": "string or null",
      "live_demo": "string or null",
      "achievements": "string or null"
    }
  ],
  "skills": [
    {
      "category": "string",
      "name": "string",
      "level": 3
    }
  ],
  "certifications": [
    {
      "name": "string",
      "organization": "string",
      "issue_date": "string or null",
      "credential_id": "string or null",
      "credential_url": "string or null"
    }
  ],
  "achievements": {
    "hackathons": "string or null",
    "awards": "string or null",
    "soft_skills": "string or null",
    "extracurricular": "string or null"
  },
  "languages": ["string"],
  "links": ["string"]
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
