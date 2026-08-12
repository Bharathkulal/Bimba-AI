import sys
import os
import asyncio
import traceback

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.mongodb import db
from app.models.student import Student
from app.api.v1.resumes.resume_builder import generate_resume_pdf_endpoint, GeneratePdfRequest

async def test_endpoint():
    resume_id = 184
    resume = db.resumes.find_one({"id": resume_id})
    if not resume:
        print("Resume not found")
        return
        
    student_id = resume["student_id"]
    student_doc = db.students.find_one({"id": student_id})
    if not student_doc:
        print("Student not found")
        return
        
    # Instantiate Student object
    from app.core.mongodb import MongoModel
    student = Student(**student_doc)
    
    # Prepare payload exactly like frontend
    payload = GeneratePdfRequest(
        template=resume.get("template_id") or "jakes",
        resume_data=resume.get("resume") or {},
        font_family="Roboto",
        font_size="12pt"
    )
    
    print("Calling generate_resume_pdf_endpoint directly...")
    try:
        res = await generate_resume_pdf_endpoint(
            resume_id=resume_id,
            payload=payload,
            student=student,
            db=db
        )
        print("Endpoint returned successfully:", res)
    except Exception as e:
        print("Endpoint failed with exception:")
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test_endpoint())
