import os
import shutil
import sys

def restore_db():
    backup_dir = "d:/Bimba AI/backend/database/backups"
    dest = "d:/Bimba AI/backend/database/sqlite/bimba_ai.db"
    
    if not os.path.exists(backup_dir) or not os.listdir(backup_dir):
        print("No backups found to restore.")
        return
        
    backups = sorted([f for f in os.listdir(backup_dir) if f.startswith("bimba_ai_backup_")])
    latest_backup = os.path.join(backup_dir, backups[-1])
    
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(latest_backup, dest)
    print(f"Database restored successfully from latest backup: {latest_backup}")

if __name__ == "__main__":
    restore_db()
