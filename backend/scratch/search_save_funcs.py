with open("d:/Bimba AI/frontend/src/components/UploadResumeWizard.tsx", "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "save" in line.lower() and "function" in line.lower() or "save" in line.lower() and "const" in line.lower():
            print(f"{i}: {line.strip()}")
