import os
import random
import requests
from typing import List, Dict, Any, Optional
from app.models.student import Student

class LinkedInService:
    def __init__(self):
        self.api_key = os.getenv("RAPIDAPI_KEY")
        self.api_host = os.getenv("RAPIDAPI_HOST", "linkedin-data-api.p.rapidapi.com")
        
        # Static high-quality mock jobs data for fallback and offline development
        self.mock_jobs = [
            {
                "id": "li_job_001",
                "title": "Frontend Engineer (React)",
                "company": "Vercel",
                "location": "San Francisco, CA",
                "logo": "https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=100&auto=format&fit=crop&q=60",
                "banner": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
                "salary": "$135,000 - $165,000",
                "employment_type": "Full-time",
                "remote": True,
                "posted_date": "2 hours ago",
                "experience": "Mid-level",
                "description": "We are looking for a Frontend Engineer to help build the future of web deployment. You will work closely with our React/Next.js frameworks and help developers build faster web experiences. Responsibilities include shipping production-ready interfaces, optimizing bundle sizes, and building robust design systems.",
                "requirements": ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "JavaScript"],
                "responsibilities": ["Develop premium user interfaces", "Collaborate with UI/UX designers", "Write automated tests and documentation"],
                "benefits": ["Full healthcare, dental, and vision", "Flexible remote work stipend", "401(k) matching", "Unlimited PTO"],
                "company_info": {"industry": "Software/Technology", "size": "500-1000 employees", "website": "vercel.com"}
            },
            {
                "id": "li_job_002",
                "title": "Python & FastAPI Backend Developer",
                "company": "OpenAI",
                "location": "San Francisco, CA",
                "logo": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
                "banner": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60",
                "salary": "$170,000 - $210,000",
                "employment_type": "Full-time",
                "remote": False,
                "posted_date": "1 day ago",
                "experience": "Senior",
                "description": "Join our infrastructure engineering team to build scalable backends for generative models. You will design, build, and deploy FastAPI web services that handle millions of requests hourly. You'll optimize database queries, design robust APIs, and integrate with Postgres and Redis databases.",
                "requirements": ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "RESTful APIs", "Docker", "Redis", "SQL"],
                "responsibilities": ["Design high-throughput APIs", "Maintain PostgreSQL database engines", "Containerize services with Docker"],
                "benefits": ["Competitive equity plans", "Premium health insurance", "Catered daily meals", "Gym memberships"],
                "company_info": {"industry": "Artificial Intelligence", "size": "1000-5000 employees", "website": "openai.com"}
            },
            {
                "id": "li_job_003",
                "title": "React Native Developer",
                "company": "Stripe",
                "location": "Bangalore, India",
                "logo": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=100&auto=format&fit=crop&q=60",
                "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60",
                "salary": "₹18,000,000 - ₹24,000,000",
                "employment_type": "Full-time",
                "remote": True,
                "posted_date": "Today",
                "experience": "Mid-level",
                "description": "We are seeking a React Native Developer to lead our next-generation mobile checkout experience. You will collaborate with global product teams to build slick, high-performing financial components inside iOS and Android apps.",
                "requirements": ["React Native", "TypeScript", "JavaScript", "Redux", "RESTful APIs", "Git"],
                "responsibilities": ["Build responsive mobile components", "Optimize mobile application rendering", "Integrate Native SDK modules"],
                "benefits": ["Comprehensive medical plans", "Work-from-home allowance", "Learning budget of $2000/yr", "Parental leave"],
                "company_info": {"industry": "Fintech / Payments", "size": "5000-10000 employees", "website": "stripe.com"}
            },
            {
                "id": "li_job_004",
                "title": "AI Full Stack Engineer",
                "company": "Bimba AI",
                "location": "Remote (US/India)",
                "logo": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=60",
                "banner": "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=60",
                "salary": "$120,000 - $150,000",
                "employment_type": "Full-time",
                "remote": True,
                "posted_date": "3 days ago",
                "experience": "Entry-level",
                "description": "Grow your career in AI engineering. You will help build our intelligent resume builder and jobs portal. Experience with React, Node.js, Python, PostgreSQL, and building AI agents is highly preferred. Ideal for self-starters who want to ship code fast.",
                "requirements": ["React", "FastAPI", "Python", "TypeScript", "PostgreSQL", "SQLAlchemy", "Tailwind CSS", "Git"],
                "responsibilities": ["Build new user dashboard modules", "Optimize SQL queries and schemas", "Integrate LLM API backends"],
                "benefits": ["Flexible working hours", "MacBook Pro provided", "Staging and sandbox environments", "Mentorship programs"],
                "company_info": {"industry": "HR Tech / AI", "size": "10-50 employees", "website": "bimba.ai"}
            },
            {
                "id": "li_job_005",
                "title": "DevOps Cloud Engineer",
                "company": "Airbnb",
                "location": "Seattle, WA",
                "logo": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60",
                "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=60",
                "salary": "$150,000 - $185,000",
                "employment_type": "Full-time",
                "remote": False,
                "posted_date": "4 days ago",
                "experience": "Senior",
                "description": "Join our Cloud Platform division to architect the future of travel hosting. You will implement CI/CD deployment pipelines, manage container orchestration with Kubernetes, and provision infrastructure using Terraform on AWS cloud systems.",
                "requirements": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux", "Git"],
                "responsibilities": ["Manage infrastructure scaling", "Ensure system security and auditing", "Automate deployment logs"],
                "benefits": ["Travel credits worth $2000/yr", "Premium health insurance", "Equity grants", "Wellness budget"],
                "company_info": {"industry": "Travel & Hospitality", "size": "5000+ employees", "website": "airbnb.com"}
            },
            {
                "id": "li_job_006",
                "title": "Associate UI/UX Product Designer",
                "company": "Figma",
                "location": "London, UK",
                "logo": "https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=100&auto=format&fit=crop&q=60",
                "banner": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60",
                "salary": "£50,000 - £70,000",
                "employment_type": "Full-time",
                "remote": True,
                "posted_date": "5 days ago",
                "experience": "Entry-level",
                "description": "Figma is seeking a passionate Junior UI/UX Designer. You will draft wireframes, collaborate on UI design systems, and conduct user research testing. Knowledge of Figma, HTML/CSS, and visual design is required.",
                "requirements": ["Figma", "Design Systems", "CSS", "HTML", "JavaScript"],
                "responsibilities": ["Design high-fidelity UI screens", "Maintain design pattern libraries", "Conduct prototyping experiments"],
                "benefits": ["Generous matching pension", "Work equipment allowance", "Healthcare plans", "Free books and courses"],
                "company_info": {"industry": "Collaborative Design", "size": "1000-2000 employees", "website": "figma.com"}
            },
            {
                "id": "li_job_007",
                "title": "Software Engineer Intern",
                "company": "Google",
                "location": "Bangalore, India",
                "logo": "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format&fit=crop&q=60",
                "banner": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60",
                "salary": "₹80,000 / month",
                "employment_type": "Internship",
                "remote": False,
                "posted_date": "1 week ago",
                "experience": "Entry-level",
                "description": "Google welcomes applications for engineering internships. You will work on real Google production code alongside world-class engineers. Experience in programming with Python, Java, C++, or Go is required.",
                "requirements": ["Python", "SQL", "Git", "JavaScript"],
                "responsibilities": ["Write code in collaborative codebases", "Review technical documentation", "Participate in scrum standups"],
                "benefits": ["Free catered meals", "Intern transit shuttle", "Mentorship pairing", "Fast-track to full-time roles"],
                "company_info": {"industry": "Software / Search", "size": "100,000+ employees", "website": "google.com"}
            },
            {
                "id": "li_job_008",
                "title": "Data Scientist",
                "company": "Meta",
                "location": "New York, NY",
                "logo": "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=60",
                "banner": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60",
                "salary": "$145,000 - $175,000",
                "employment_type": "Full-time",
                "remote": True,
                "posted_date": "2 weeks ago",
                "experience": "Mid-level",
                "description": "We are seeking a Data Scientist to join our advertising analytics team. You will write complex SQL queries, analyze massive datasets with Python, build predictive ML models, and formulate strategic business recommendations.",
                "requirements": ["Python", "SQL", "Pandas", "NumPy", "Machine Learning", "Git"],
                "responsibilities": ["Write backend database pipelines", "Model marketing advertising behaviors", "Present analytics to executives"],
                "benefits": ["Top-tier healthcare coverage", "Housing assistance packages", "Childcare stipend", "Mental health support"],
                "company_info": {"industry": "Social Media", "size": "50,000+ employees", "website": "meta.com"}
            }
        ]

        # Extend mock database with more records to make search filter testing rich
        self._generate_extended_mock_jobs()

    def _generate_extended_mock_jobs(self):
        # Adds additional jobs to make pagination and filter scenarios work beautifully
        extra_companies = ["Netflix", "Microsoft", "Linear", "Attio", "Figma", "Slack", "Zoom", "Github"]
        extra_locations = ["Bangalore, India", "Seattle, WA", "Remote (US)", "London, UK", "New York, NY", "Austin, TX"]
        roles = [
            {"title": "Backend Python Architect", "reqs": ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy", "Redis", "Docker", "AWS"], "type": "Full-time", "exp": "Senior"},
            {"title": "Next.js Core Developer", "reqs": ["React", "Next.js", "TypeScript", "Tailwind CSS", "JavaScript"], "type": "Full-time", "exp": "Mid-level"},
            {"title": "Junior Full Stack Dev", "reqs": ["React", "FastAPI", "Python", "SQL", "Git"], "type": "Full-time", "exp": "Entry-level"},
            {"title": "UI Developer Intern", "reqs": ["Figma", "CSS", "HTML", "JavaScript", "React"], "type": "Internship", "exp": "Entry-level"},
            {"title": "Cloud Platform Architect", "reqs": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"], "type": "Full-time", "exp": "Senior"},
            {"title": "React Component Engineer", "reqs": ["React", "TypeScript", "Tailwind CSS", "Redux"], "type": "Contract", "exp": "Mid-level"}
        ]
        
        for i in range(25):
            idx = i + 9
            role = random.choice(roles)
            company = random.choice(extra_companies)
            loc = random.choice(extra_locations)
            remote_val = "Remote" in loc or random.choice([True, False])
            
            salary_val = f"${random.randint(90, 160)},000 - ${random.randint(165, 230)},000"
            if "India" in loc:
                salary_val = f"₹{random.randint(12, 22)},00,000 - ₹{random.randint(24, 38)},00,000"
                
            self.mock_jobs.append({
                "id": f"li_job_{idx:03d}",
                "title": f"{company} {role['title']}",
                "company": company,
                "location": loc,
                "logo": f"https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=60",
                "banner": "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=60",
                "salary": salary_val,
                "employment_type": role["type"],
                "remote": remote_val,
                "posted_date": f"{random.randint(1, 14)} days ago",
                "experience": role["exp"],
                "description": f"Exciting job vacancy for a {role['title']} at {company}. We are seeking individuals experienced in {', '.join(role['reqs'])}. Come and join a world-class workspace focused on quality engineering.",
                "requirements": role["reqs"],
                "responsibilities": ["Develop premium production pipelines", "Refactor system architecture", "Collaborate on agile processes"],
                "benefits": ["Comprehensive insurance plans", "Wellness packages", "Equipment budgets"],
                "company_info": {"industry": "Software Engineering", "size": "100-500 employees", "website": f"{company.lower()}.com"}
            })

    def _parse_student_skills(self, student: Optional[Student]) -> List[str]:
        if not student or not student.skills:
            return []
        # Student skills are typically stored as a string, e.g. "React, FastAPI, Python, Docker"
        skills = [s.strip().lower() for s in student.skills.split(",") if s.strip()]
        return skills

    def _calculate_ai_match(self, student_skills: List[str], job_reqs: List[str]) -> Dict[str, Any]:
        if not student_skills:
            # Baseline realistic match scores if profile has no skills listed yet
            return {
                "score": random.randint(70, 78),
                "matched": [],
                "missing": job_reqs[:3]
            }
        
        # Convert job requirements to lowercase for comparison
        reqs_lower = [r.lower() for r in job_reqs]
        matched = []
        missing = []
        
        for req in job_reqs:
            # Simple keyword matching
            req_l = req.lower()
            if any(s in req_l or req_l in s for s in student_skills):
                matched.append(req)
            else:
                missing.append(req)
                
        # Calculate percentage match
        total_reqs = len(job_reqs)
        if total_reqs == 0:
            return {"score": 80, "matched": [], "missing": []}
            
        match_ratio = len(matched) / total_reqs
        score = int(60 + (match_ratio * 38)) # Scaling between 60% and 98%
        
        return {
            "score": min(98, max(60, score)),
            "matched": matched,
            "missing": missing
        }

    def search_jobs(
        self,
        student: Optional[Student],
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        page: int = 1,
        experience: Optional[str] = None,
        remote: Optional[bool] = None,
        employment_type: Optional[str] = None,
        salary: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        
        # 1. Try invoking real API if configured
        if self.api_key and self.api_key.strip():
            try:
                url = f"https://{self.api_host}/active-jb"
                headers = {
                    "X-RapidAPI-Key": self.api_key,
                    "X-RapidAPI-Host": self.api_host
                }
                params = {
                    "title": keyword or "Software Engineer",
                    "location": location or "United States",
                    "time_frame": "6m",
                    "limit": str(limit),
                    "offset": str((page - 1) * limit)
                }
                
                response = requests.get(url, headers=headers, params=params, timeout=10)
                
                if response.status_code != 200:
                    raise ValueError(f"RapidAPI returned status {response.status_code}: {response.text}")
                    
                if response.status_code == 200:
                    raw_jobs = response.json()
                    if not isinstance(raw_jobs, list):
                        raw_jobs = raw_jobs.get("data", []) if isinstance(raw_jobs, dict) else []
                    
                    jobs_list = []
                    student_skills = self._parse_student_skills(student)
                    
                    for index, rj in enumerate(raw_jobs):
                        reqs = rj.get("ai_key_skills", ["React", "Python", "SQL", "Git"])
                        ai_match = self._calculate_ai_match(student_skills, reqs)
                        
                        locs = rj.get("locations_derived", [])
                        loc_str = locs[0] if locs else "Remote"
                        
                        date_posted = rj.get("date_posted", "")
                        posted_str = date_posted[:10] if date_posted else "Recently"
                        
                        emp_type = rj.get("ai_employment_type", [])
                        emp_str = emp_type[0].replace("_", "-").title() if emp_type else "Full-time"
                        is_remote = rj.get("ai_work_arrangement") == "Remote"
                        
                        jobs_list.append({
                            "id": str(rj.get("id") or f"api_job_{index}"),
                            "title": rj.get("title", "Software Developer"),
                            "company": rj.get("organization", "Tech Company"),
                            "location": loc_str,
                            "logo": rj.get("organization_logo"),
                            "salary": rj.get("ai_salary_value") or "Competitive",
                            "employment_type": emp_str,
                            "remote": is_remote,
                            "posted_date": posted_str,
                            "ai_match_score": ai_match["score"],
                            "skills_matched": ai_match["matched"],
                            "skills_missing": ai_match["missing"],
                            "apply_url": rj.get("url", "https://linkedin.com")
                        })
                        
                    total = len(jobs_list)
                    return {
                        "jobs": jobs_list,
                        "total": total,
                        "page": page,
                        "pages": (total + limit - 1) // limit if total > 0 else 0,
                        "limit": limit
                    }
            except Exception as e:
                print(f"RapidAPI failed: {e}")
                raise ValueError(f"LinkedIn Job Search API failed: {str(e)}")
        
        # 2. Return clean mock results when API is not configured or fails
        student_skills = self._parse_student_skills(student)
        jobs_list = []
        for index, mj in enumerate(self.mock_jobs):
            # Calculate match criteria locally
            ai_match = self._calculate_ai_match(student_skills, mj.get("requirements", []))
            jobs_list.append({
                "id": mj.get("id"),
                "title": mj.get("title"),
                "company": mj.get("company"),
                "location": mj.get("location"),
                "logo": mj.get("logo"),
                "salary": mj.get("salary"),
                "employment_type": mj.get("employment_type"),
                "remote": mj.get("remote"),
                "posted_date": mj.get("posted_date"),
                "ai_match_score": ai_match["score"],
                "skills_matched": ai_match["matched"],
                "skills_missing": ai_match["missing"],
                "apply_url": "https://linkedin.com"
            })
        
        # Simple sorting and filtering to match target keyword
        if keyword:
            kw_low = keyword.lower()
            jobs_list = [j for j in jobs_list if kw_low in j["title"].lower() or kw_low in j["company"].lower() or any(kw_low in s.lower() for s in j["skills_matched"])]
            
        total = len(jobs_list)
        return {
            "jobs": jobs_list[:limit],
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit if total > 0 else 0,
            "limit": limit
        }

    def get_job_details(self, student: Optional[Student], job_id: str) -> Optional[Dict[str, Any]]:
        # 1. Try invoking real API if configured
        if self.api_key and self.api_key.strip():
            try:
                url = f"https://{self.api_host}/active-jb"
                headers = {
                    "X-RapidAPI-Key": self.api_key,
                    "X-RapidAPI-Host": self.api_host
                }
                params = {
                    "time_frame": "6m",
                    "id": job_id
                }
                
                response = requests.get(url, headers=headers, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if not data:
                        return None
                    rj = data[0]
                    student_skills = self._parse_student_skills(student)
                    reqs = rj.get("ai_key_skills", ["React", "Python", "SQL", "Git"])
                    ai_match = self._calculate_ai_match(student_skills, reqs)
                    
                    locs = rj.get("locations_derived", [])
                    loc_str = locs[0] if locs else "Remote"
                    
                    date_posted = rj.get("date_posted", "")
                    posted_str = date_posted[:10] if date_posted else "Recently"
                    
                    emp_type = rj.get("ai_employment_type", [])
                    emp_str = emp_type[0].replace("_", "-").title() if emp_type else "Full-time"
                    is_remote = rj.get("ai_work_arrangement") == "Remote"
                    
                    desc = rj.get("ai_requirements_summary", "No description provided.")
                    if rj.get("ai_core_responsibilities"):
                        desc = f"{rj.get('ai_core_responsibilities')}\n\n{desc}"
                    
                    return {
                        "id": job_id,
                        "title": rj.get("title", "Software Developer"),
                        "company": rj.get("organization", "Tech Company"),
                        "location": loc_str,
                        "logo": rj.get("organization_logo"),
                        "banner": "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=60",
                        "salary": rj.get("ai_salary_value") or "Competitive",
                        "employment_type": emp_str,
                        "remote": is_remote,
                        "posted_date": posted_str,
                        "description": desc,
                        "requirements": reqs,
                        "responsibilities": [rj.get("ai_core_responsibilities")] if rj.get("ai_core_responsibilities") else ["Fulfill software requirements"],
                        "benefits": [rj.get("ai_benefits")] if rj.get("ai_benefits") else ["Competitive Salary", "Health Insurance"],
                        "experience": rj.get("ai_experience_level") or "Mid-level",
                        "ai_match_score": ai_match["score"],
                        "skills_matched": ai_match["matched"],
                        "skills_missing": ai_match["missing"],
                        "apply_url": rj.get("url", "https://linkedin.com"),
                        "company_info": {
                            "industry": rj.get("org_linkedin_industry", "Technology"),
                            "size": rj.get("org_linkedin_size", "11-50 employees"),
                            "website": rj.get("org_linkedin_website", "linkedin.com")
                        }
                    }
            except Exception as e:
                print(f"RapidAPI details failed: {e}. Falling back to mock details.")
                
        # Fallback to local mock details if API is not active or returns error
        match_mj = next((m for m in self.mock_jobs if m.get("id") == job_id), None)
        if match_mj:
            student_skills = self._parse_student_skills(student)
            ai_match = self._calculate_ai_match(student_skills, match_mj.get("requirements", []))
            return {
                **match_mj,
                "ai_match_score": ai_match["score"],
                "skills_matched": ai_match["matched"],
                "skills_missing": ai_match["missing"],
                "apply_url": "https://linkedin.com"
            }
        return None

# Singleton client instance
linkedin_service = LinkedInService()
