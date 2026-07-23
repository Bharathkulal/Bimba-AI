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
                # Target endpoint: e.g. LinkedIn Data API /search endpoint
                url = f"https://{self.api_host}/search-jobs"
                headers = {
                    "X-RapidAPI-Key": self.api_key,
                    "X-RapidAPI-Host": self.api_host
                }
                params = {
                    "keywords": keyword or "Software Engineer",
                    "location": location or "United States",
                    "start": (page - 1) * limit
                }
                
                # Check for other filters and map them to standard API parameters
                if remote is not None:
                    params["remote"] = "true" if remote else "false"
                if employment_type:
                    params["type"] = employment_type
                    
                response = requests.get(url, headers=headers, params=params, timeout=8)
                
                if response.status_code == 200:
                    api_data = response.json()
                    # Map the raw API structure to our standard JobListItem
                    jobs_list = []
                    
                    # Assume api_data has a 'data' array or is a list
                    raw_jobs = api_data.get("data", []) if isinstance(api_data, dict) else api_data
                    
                    student_skills = self._parse_student_skills(student)
                    
                    for index, rj in enumerate(raw_jobs):
                        # Construct a mock requirements list if not provided by API
                        reqs = rj.get("skills", ["React", "Python", "SQL", "Git"])
                        ai_match = self._calculate_ai_match(student_skills, reqs)
                        
                        jobs_list.append({
                            "id": rj.get("id") or rj.get("job_id") or f"api_job_{index}",
                            "title": rj.get("title", "Software Developer"),
                            "company": rj.get("companyName") or rj.get("company", {}).get("name", "Tech Company"),
                            "location": rj.get("location", "Remote"),
                            "logo": rj.get("companyLogo") or rj.get("company", {}).get("logo", None),
                            "salary": rj.get("salary") or rj.get("salaryRange", None),
                            "employment_type": rj.get("employmentType") or rj.get("type", "Full-time"),
                            "remote": rj.get("workplaceType") == "remote" or rj.get("remote", False),
                            "posted_date": rj.get("postDate") or rj.get("postedTime", "Recently"),
                            "ai_match_score": ai_match["score"],
                            "skills_matched": ai_match["matched"],
                            "skills_missing": ai_match["missing"],
                            "apply_url": rj.get("applyUrl") or rj.get("jobUrl", "https://linkedin.com")
                        })
                        
                    total = api_data.get("total", len(jobs_list)) if isinstance(api_data, dict) else len(raw_jobs)
                    return {
                        "jobs": jobs_list,
                        "total": total,
                        "page": page,
                        "pages": (total + limit - 1) // limit,
                        "limit": limit
                    }
                    
            except Exception as e:
                print(f"RapidAPI failed: {e}. Falling back to mock database.")
                
        # 2. Mock Fallback Flow
        filtered_jobs = []
        student_skills = self._parse_student_skills(student)
        
        for job in self.mock_jobs:
            # Match keyword
            if keyword:
                kw = keyword.lower()
                title_match = kw in job["title"].lower()
                company_match = kw in job["company"].lower()
                desc_match = kw in job["description"].lower()
                req_match = any(kw in req.lower() for req in job["requirements"])
                if not (title_match or company_match or desc_match or req_match):
                    continue
                    
            # Match location
            if location:
                loc = location.lower()
                if loc != "remote" and loc not in job["location"].lower():
                    continue
                    
            # Match experience
            if experience:
                if experience.lower() not in job["experience"].lower():
                    continue
                    
            # Match remote
            if remote is not None:
                if job["remote"] != remote:
                    continue
                    
            # Match employment type
            if employment_type:
                if employment_type.lower() not in job["employment_type"].lower():
                    continue
                    
            # Calculate match score dynamically based on profile skills
            ai_match = self._calculate_ai_match(student_skills, job["requirements"])
            
            # Create a copy with computed properties
            job_copy = job.copy()
            job_copy["ai_match_score"] = ai_match["score"]
            job_copy["skills_matched"] = ai_match["matched"]
            job_copy["skills_missing"] = ai_match["missing"]
            filtered_jobs.append(job_copy)

        # Sort by match score by default to feel extra smart, otherwise newest (mock list order)
        filtered_jobs.sort(key=lambda x: x["ai_match_score"], reverse=True)
        
        # Paginate
        total_items = len(filtered_jobs)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_jobs = filtered_jobs[start_idx:end_idx]
        
        # Map output to JobListItem schema
        output_jobs = []
        for job in paginated_jobs:
            output_jobs.append({
                "id": job["id"],
                "title": job["title"],
                "company": job["company"],
                "location": job["location"],
                "logo": job["logo"],
                "salary": job["salary"],
                "employment_type": job["employment_type"],
                "remote": job["remote"],
                "posted_date": job["posted_date"],
                "ai_match_score": job["ai_match_score"],
                "skills_matched": job["skills_matched"],
                "skills_missing": job["skills_missing"],
                "apply_url": job.get("apply_url") or "https://www.linkedin.com/jobs"
            })
            
        return {
            "jobs": output_jobs,
            "total": total_items,
            "page": page,
            "pages": max(1, (total_items + limit - 1) // limit),
            "limit": limit
        }

    def get_job_details(self, student: Optional[Student], job_id: str) -> Optional[Dict[str, Any]]:
        # 1. Try invoking real API if configured
        if self.api_key and self.api_key.strip():
            try:
                # Target endpoint: e.g. LinkedIn Data API /get-job-details endpoint
                url = f"https://{self.api_host}/job-details"
                headers = {
                    "X-RapidAPI-Key": self.api_key,
                    "X-RapidAPI-Host": self.api_host
                }
                params = {"id": job_id}
                
                response = requests.get(url, headers=headers, params=params, timeout=8)
                
                if response.status_code == 200:
                    rj = response.json()
                    student_skills = self._parse_student_skills(student)
                    reqs = rj.get("skills", ["React", "Python", "SQL", "Git"])
                    ai_match = self._calculate_ai_match(student_skills, reqs)
                    
                    return {
                        "id": job_id,
                        "title": rj.get("title", "Software Developer"),
                        "company": rj.get("companyName") or rj.get("company", {}).get("name", "Tech Company"),
                        "location": rj.get("location", "Remote"),
                        "logo": rj.get("companyLogo") or rj.get("company", {}).get("logo", None),
                        "banner": rj.get("companyBanner") or "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=60",
                        "salary": rj.get("salary") or rj.get("salaryRange", None),
                        "employment_type": rj.get("employmentType") or rj.get("type", "Full-time"),
                        "remote": rj.get("workplaceType") == "remote" or rj.get("remote", False),
                        "posted_date": rj.get("postDate") or rj.get("postedTime", "Recently"),
                        "description": rj.get("description", "No description provided."),
                        "requirements": reqs,
                        "responsibilities": rj.get("responsibilities", ["Contribute to technical projects", "Code reviews"]),
                        "benefits": rj.get("benefits", ["Competitive Salary", "Health Insurance"]),
                        "experience": rj.get("experienceLevel") or "Mid-level",
                        "ai_match_score": ai_match["score"],
                        "skills_matched": ai_match["matched"],
                        "skills_missing": ai_match["missing"],
                        "apply_url": rj.get("applyUrl") or rj.get("jobUrl", "https://linkedin.com"),
                        "company_info": {
                            "industry": rj.get("company", {}).get("industry", "Technology"),
                            "size": rj.get("company", {}).get("employeeCount", "100-500 employees"),
                            "website": rj.get("company", {}).get("website", "linkedin.com")
                        }
                    }
            except Exception as e:
                print(f"RapidAPI details failed: {e}. Falling back to mock details.")

        # 2. Mock Fallback
        for job in self.mock_jobs:
            if job["id"] == job_id:
                student_skills = self._parse_student_skills(student)
                ai_match = self._calculate_ai_match(student_skills, job["requirements"])
                
                job_copy = job.copy()
                job_copy["ai_match_score"] = ai_match["score"]
                job_copy["skills_matched"] = ai_match["matched"]
                job_copy["skills_missing"] = ai_match["missing"]
                return job_copy
                
        return None

# Singleton client instance
linkedin_service = LinkedInService()
