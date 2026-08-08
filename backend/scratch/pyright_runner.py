import subprocess
import sys

res = subprocess.run(
    [r"D:\Bimba AI\backend\venv\Scripts\python.exe", "-m", "pyright", "app/core/config.py", "app/core/mongodb.py", "app/database/resume_repository.py"],
    capture_output=True,
    text=True,
    cwd=r"d:\Bimba AI\backend"
)
print("STDOUT:")
print(res.stdout)
print("STDERR:")
print(res.stderr)
