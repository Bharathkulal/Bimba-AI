from app.core.mongodb import db
from bson import ObjectId

resume_id = 99

print('--- resume doc ---')
r = db.resumes.find_one({'id': resume_id})
print(r)

print('\n--- resume_extraction ---')
e = db.resume_extractions.find_one({'resumeId': resume_id})
print(e)

print('\n--- resume_profile ---')
p = db.resume_profiles.find_one({'resumeId': resume_id})
print(p)
