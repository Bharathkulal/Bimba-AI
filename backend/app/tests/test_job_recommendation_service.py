from app.services.jobs.job_recommendation_service import calculate_resume_job_match_score


def test_calculate_resume_job_match_score_uses_resume_profile_and_job_requirements():
    profile = {
        "skills": ["Python", "FastAPI", "MongoDB", "Docker"],
        "experience_years": 3,
        "education": ["Bachelor of Technology"],
        "target_role": "Backend Developer",
        "technologies": ["Python", "FastAPI", "MongoDB", "Docker"],
        "location_preference": "Remote",
        "salary_preference": "₹15L - ₹20L",
        "industry": "Software",
    }
    job = {
        "title": "Senior Backend Developer",
        "description": "Build scalable FastAPI services using Python, MongoDB, and Docker.",
        "location": "Remote, India",
        "employment_type": "Full-time",
        "experience": "Mid-level",
        "salary": "₹14L - ₹20L",
        "source": "jsearch",
        "url": "https://jobs.example.com/apply",
    }

    score = calculate_resume_job_match_score(profile, job)

    assert 0 <= score <= 100
    assert score >= 70
