import os
import sys
from dotenv import load_dotenv

# Load env
load_dotenv(".env")

from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017")
db = client["bimba_ai"]

providers = list(db.ai_providers.find({}).sort("priority", 1))
for p in providers:
    slug = p.get("slug")
    key = p.get("api_key", "")
    if not key:
        key = os.getenv(f"{slug.upper()}_API_KEY", "")
    print(f"Slug: {slug} | Key in DB: {p.get('api_key')} | Key from Env: {os.getenv(f'{slug.upper()}_API_KEY')} | Key: {key}")
