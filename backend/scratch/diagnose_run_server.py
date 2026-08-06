import subprocess
import time
import requests
import sys
import os

def main():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print("Backend dir:", backend_dir)
    
    env = os.environ.copy()
    env["PYTHONPATH"] = backend_dir
    
    cmd = [
        sys.executable,
        "-m", "uvicorn",
        "app.main:app",
        "--host", "127.0.0.1",
        "--port", "8001"
    ]
    
    proc = subprocess.Popen(
        cmd,
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=env
    )
    
    time.sleep(20)
    
    print("Sending requests to port 8001...")
    token = None
    try:
        # 1. Login
        login_url = "http://127.0.0.1:8001/api/auth/login"
        r_login = requests.post(login_url, json={"roll_number": "BCA25001", "password": "24-11-2007"})
        print("Login Status:", r_login.status_code)
        if r_login.status_code == 200:
            token = r_login.json()["access_token"]
            
        # 2. Upload
        if token:
            upload_url = "http://127.0.0.1:8001/api/resume-studio/upload"
            headers = {"Authorization": f"Bearer {token}"}
            file_path = r"d:\Bimba AI\Minimalist Modern Simple Business Social Media Manager Resume.pdf"
            with open(file_path, "rb") as f:
                files = {
                    "file": ("Minimalist Modern Simple Business Social Media Manager Resume.pdf", f, "application/pdf")
                }
                r_upload = requests.post(upload_url, headers=headers, files=files)
            print("Upload Status:", r_upload.status_code)
            print("Upload Response:", r_upload.text)
    except Exception as e:
        print("HTTP Request failed:", e)
        
    time.sleep(1)
    
    # Kill the process tree on Windows
    print("Killing uvicorn process tree (PID:", proc.pid, ")...")
    subprocess.run(["taskkill", "/f", "/t", "/pid", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Now communicate will return immediately
    stdout_data, _ = proc.communicate()
    
    print("\n====== UVICORN OUTPUT ======")
    print(stdout_data)
    print("============================")

if __name__ == "__main__":
    main()
