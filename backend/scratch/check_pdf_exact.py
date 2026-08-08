with open("d:/Bimba AI/backend/app/services/resume_pdf_service.py", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "generate_pdf_resume" in line:
            print(f"{i}: {line.strip()}")
