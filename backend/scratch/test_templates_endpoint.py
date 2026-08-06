import sys
import os
import traceback
from pymongo import MongoClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.v1.templates.templates_routes import get_templates

def run_test():
    client = MongoClient("mongodb://localhost:27017")
    db = client.bimba_ai
    
    try:
        res = get_templates(db=db)
        print("Success! Templates resolved:", res)
    except Exception as e:
        print("Exception in templates route:")
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
