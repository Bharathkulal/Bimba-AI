from pymongo import MongoClient
from datetime import datetime, timedelta
import random

client = MongoClient("mongodb://localhost:27017")
db = client["bimba_ai"]

# Clear existing placement collections to avoid duplicates
db.placement_companies.delete_many({})
db.placement_drives.delete_many({})
db.placement_applications.delete_many({})
db.drive_eligibility_matches.delete_many({})

# 1. Seed companies
companies = [
    {"id": 1, "name": "Google", "industry": "Tech", "location": "Bangalore", "website": "google.com", "description": "Global technology company", "status": "Active"},
    {"id": 2, "name": "Microsoft", "industry": "Tech", "location": "Hyderabad", "website": "microsoft.com", "description": "Software and cloud giant", "status": "Active"},
    {"id": 3, "name": "Amazon", "industry": "E-Commerce", "location": "Bangalore", "website": "amazon.jobs", "description": "Online retail and cloud platform", "status": "Active"},
    {"id": 4, "name": "Accenture", "industry": "Consulting", "location": "Pune", "website": "accenture.com", "description": "Professional services & solutions", "status": "Active"},
    {"id": 5, "name": "TCS", "industry": "IT Services", "location": "Chennai", "website": "tcs.com", "description": "IT services and consulting", "status": "Active"}
]
db.placement_companies.insert_many(companies)
print("Seeded companies.")

# 2. Seed drives
drives = [
    {
        "id": 1,
        "company_id": 1,
        "company_name": "Google",
        "title": "Software Engineer Intern",
        "job_role": "SDE Intern",
        "salary_package": "12 LPA",
        "eligibility_criteria": "CS/BCA students, min 8.0 CGPA",
        "min_cgpa": 8.0,
        "branches_eligible": ["CS", "BCA"],
        "drive_date": "2026-09-15",
        "status": "Active",
        "created_at": datetime.utcnow()
    },
    {
        "id": 2,
        "company_id": 2,
        "company_name": "Microsoft",
        "title": "Technical Consultant",
        "job_role": "Consultant",
        "salary_package": "15 LPA",
        "eligibility_criteria": "All engineering and computing branches, min 7.5 CGPA",
        "min_cgpa": 7.5,
        "branches_eligible": ["CS", "BCA"],
        "drive_date": "2026-09-20",
        "status": "Active",
        "created_at": datetime.utcnow()
    },
    {
        "id": 3,
        "company_id": 3,
        "company_name": "Amazon",
        "title": "Systems Analyst",
        "job_role": "Cloud Support Associate",
        "salary_package": "10 LPA",
        "eligibility_criteria": "IT/CS graduates, min 7.0 CGPA",
        "min_cgpa": 7.0,
        "branches_eligible": ["CS", "BCA"],
        "drive_date": "2026-08-25",
        "status": "Active",
        "created_at": datetime.utcnow()
    },
    {
        "id": 4,
        "company_id": 4,
        "company_name": "Accenture",
        "title": "Associate Software Engineer",
        "job_role": "ASE",
        "salary_package": "4.5 LPA",
        "eligibility_criteria": "Open to all, min 6.0 CGPA",
        "min_cgpa": 6.0,
        "branches_eligible": ["CS", "BCA"],
        "drive_date": "2026-08-10",
        "status": "Completed",
        "created_at": datetime.utcnow() - timedelta(days=10)
    }
]
db.placement_drives.insert_many(drives)
print("Seeded drives.")

# Update student CGPAs if missing/none
students = list(db.students.find({}))
print(f"Loaded {len(students)} students.")
for s in students:
    update_fields = {}
    if s.get("cgpa") is None:
        update_fields["cgpa"] = round(random.uniform(6.5, 9.5), 2)
    if s.get("placement_status") is None:
        update_fields["placement_status"] = "Unplaced"
    if update_fields:
        db.students.update_one({"id": s["id"]}, {"$set": update_fields})

# Reload students with CGPA
students = list(db.students.find({}))

# 3. Seed applications & placement status
random.seed(42)
# Select some students to be placed or applied
placed_students_count = 0
for i, student in enumerate(students):
    # Determine placement status
    # 25% Placed, 75% Unplaced
    is_placed = (i % 4 == 0)
    if is_placed:
        db.students.update_one({"id": student["id"]}, {"$set": {"placement_status": "Placed"}})
        placed_students_count += 1
        
        # Create an Offered application for placed students
        app_company = random.choice(["Google", "Microsoft", "Amazon", "Accenture"])
        drive = next((d for d in drives if d["company_name"] == app_company), drives[0])
        app_id = i + 1
        db.placement_applications.insert_one({
            "id": app_id,
            "drive_id": drive["id"],
            "student_id": student["id"],
            "student_name": student.get("student_name") or student.get("full_name") or "Student",
            "student_roll": student["roll_number"],
            "company_name": drive["company_name"],
            "job_role": drive["job_role"],
            "salary_package": drive["salary_package"],
            "status": "Offered",
            "applied_at": datetime.utcnow() - timedelta(days=random.randint(1, 10)),
            "ats_score": random.randint(70, 95),
            "match_score": random.randint(70, 95)
        })
    else:
        # Create some in-progress or applied applications
        if i % 3 == 1:
            drive = random.choice(drives[:-1]) # active drives
            app_id = i + 1
            db.placement_applications.insert_one({
                "id": app_id,
                "drive_id": drive["id"],
                "student_id": student["id"],
                "student_name": student.get("student_name") or student.get("full_name") or "Student",
                "student_roll": student["roll_number"],
                "company_name": drive["company_name"],
                "job_role": drive["job_role"],
                "salary_package": drive["salary_package"],
                "status": random.choice(["Applied", "Shortlisted"]),
                "applied_at": datetime.utcnow() - timedelta(days=random.randint(1, 5)),
                "ats_score": random.randint(65, 90),
                "match_score": random.randint(60, 90)
            })

# Setup system sequences
db.sequences.update_one({"_id": "placement_companies"}, {"$set": {"value": 5}}, upsert=True)
db.sequences.update_one({"_id": "placement_drives"}, {"$set": {"value": 4}}, upsert=True)
db.sequences.update_one({"_id": "placement_applications"}, {"$set": {"value": len(students)}}, upsert=True)

print(f"Successfully seeded placement analytics. Placed: {placed_students_count}/{len(students)}")
