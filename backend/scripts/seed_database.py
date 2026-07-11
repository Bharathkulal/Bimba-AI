import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.init_db import init_db

if __name__ == "__main__":
    print("Initializing database tables and seeding records...")
    init_db()
    print("Database seeding completed successfully.")
