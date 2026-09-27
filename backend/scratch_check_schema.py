import os
import json
from bson import json_util
from app.core.mongodb import db

resume = db.resumes.find_one({})
ats = db.resume_ats.find_one({})
analysis = db.resume_analysis.find_one({})

print("Resume Schema Keys:", list(resume.keys()) if resume else [])
print("ATS Keys:", list(ats.keys()) if ats else [])
print("Analysis Keys:", list(analysis.keys()) if analysis else [])
