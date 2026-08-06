import requests
import json

def diagnose():
    # 1. Login to get token
    login_url = "http://127.0.0.1:5173/api/auth/login"
    login_payload = {
        "roll_number": "BCA25001",
        "password": "24-11-2007"
    }
    
    print("Logging in via proxy...")
    r_login = requests.post(login_url, json=login_payload)
    print("Login Status:", r_login.status_code)
    if r_login.status_code != 200:
        print("Login failed:", r_login.text)
        return
        
    token = r_login.json()["access_token"]
    print("Token retrieved successfully.")
    
    # 2. Upload file via proxy
    upload_url = "http://127.0.0.1:5173/api/resume-studio/upload"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    file_path = r"d:\Bimba AI\Minimalist Modern Simple Business Social Media Manager Resume.pdf"
    print("Uploading file to proxy:", upload_url)
    with open(file_path, "rb") as f:
        files = {
            "file": (
                "Minimalist Modern Simple Business Social Media Manager Resume.pdf",
                f,
                "application/pdf"
            )
        }
        r_upload = requests.post(upload_url, headers=headers, files=files)
        
    print("Upload Status:", r_upload.status_code)
    print("Headers:", r_upload.headers)
    print("Response Text:", r_upload.text)

if __name__ == "__main__":
    diagnose()
