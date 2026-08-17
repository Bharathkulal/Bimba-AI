import os
import sys
from dotenv import load_dotenv

# Load env
load_dotenv(".env")

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017")
db = client["bimba_ai"]

from app.api.v1.ai.ai_routes import list_providers

# We can call it directly
res = list_providers(request=None, admin=None, db=db)
import pprint
pprint.pprint(res)
