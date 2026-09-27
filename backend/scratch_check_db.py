import os
from app.core.mongodb import db

print("Collections:", db.list_collection_names())
print("Resumes:", db.resumes.count_documents({}))

try:
    print("Job Matches:", db.job_matches.count_documents({}))
except:
    pass

try:
    print("Applications:", db.job_applications.count_documents({}))
except:
    pass
