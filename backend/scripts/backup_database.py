import os
import shutil
from datetime import datetime

def backup_db():
    src = "d:/Bimba AI/backend/database/sqlite/bimba_ai.db"
    backup_dir = "d:/Bimba AI/backend/database/backups"
    os.makedirs(backup_dir, exist_ok=True)
    
    if os.path.exists(src):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dest = os.path.join(backup_dir, f"bimba_ai_backup_{timestamp}.db")
        shutil.copy2(src, dest)
        print(f"Database backup created successfully: {dest}")
    else:
        print("Source database file not found. Skipping backup.")

if __name__ == "__main__":
    backup_db()
