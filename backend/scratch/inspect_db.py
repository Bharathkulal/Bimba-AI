import os
import sys
from pymongo import MongoClient

mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = MongoClient(mongo_uri)
db = client["bimba_ai"]

print("--- AI Providers in DB ---")
for provider in db.ai_providers.find({}):
    print({k: v for k, v in provider.items() if k != "api_key"})

print("\n--- AI Models in DB ---")
for model in db.ai_models.find({}):
    print(model)

# Perform update for invalid model names
res_providers = db.ai_providers.update_many(
    {"model_name": "gemini-2.5-flash"},
    {"$set": {"model_name": "gemini-2.0-flash"}}
)
print(f"\nUpdated {res_providers.modified_count} providers model_name to gemini-2.0-flash")

res_models = db.ai_models.update_many(
    {"model_name": "gemini-2.5-flash"},
    {"$set": {"model_name": "gemini-2.0-flash"}}
)
print(f"Updated {res_models.modified_count} models model_name to gemini-2.0-flash")
