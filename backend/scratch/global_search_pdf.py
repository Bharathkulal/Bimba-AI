import os

for root, dirs, files in os.walk("d:/Bimba AI/backend"):
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for i, line in enumerate(f, 1):
                        if "def generate_pdf_resume" in line or "generate_pdf_resume = " in line:
                            print(f"{path}:{i} - {line.strip()}")
            except Exception:
                pass
