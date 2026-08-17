import urllib.request
import urllib.parse
import urllib.error
import json
import os
import sys

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.security import create_access_token

# 1. Generate token programmatically
token = create_access_token(subject="BCA24001")
print("Token generated:", token)

# 2. Upload file (multipart/form-data)
filepath = "d:/Bimba AI/Minimalist Modern Simple Business Social Media Manager Resume.pdf"
if not os.path.exists(filepath):
    filepath = "../Minimalist Modern Simple Business Social Media Manager Resume.pdf"

with open(filepath, "rb") as f:
    file_bytes = f.read()

boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = []
body.append(f"--{boundary}".encode("utf-8"))
body.append(f'Content-Disposition: form-data; name="file"; filename="resume.pdf"'.encode("utf-8"))
body.append(b"Content-Type: application/pdf")
body.append(b"")
body.append(file_bytes)
body.append(f"--{boundary}--".encode("utf-8"))
body.append(b"")

payload = b"\r\n".join(body)

upload_url = "http://127.0.0.1:8000/api/resume-studio/upload"
req_upload = urllib.request.Request(
    upload_url,
    data=payload,
    headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Authorization": f"Bearer {token}"
    },
    method="POST"
)

print("Uploading resume to:", upload_url)
try:
    with urllib.request.urlopen(req_upload) as resp:
        print("Upload Response Status:", resp.status)
        print("Upload Response Body:", resp.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("HTTP Error status:", e.code)
    try:
        err_body = e.read().decode("utf-8")
        print("Error body:", err_body)
    except Exception:
        pass
except Exception as e:
    print("Upload failed with exception:", e)
