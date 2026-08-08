import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.mongodb import db
from app.schemas.template import TemplateResponse
from pydantic import TypeAdapter
from typing import List

print("Fetching first template from DB...")
template_doc = db.resume_templates.find_one({})
if template_doc:
    from app.models.template import ResumeTemplate
    model_obj = ResumeTemplate(template_doc)
    
    print("\n--- Testing validation of list ---")
    try:
        ta = TypeAdapter(List[TemplateResponse])
        res = ta.validate_python([model_obj])
        print("List validation: SUCCESS")
    except Exception as e:
        print("List validation: FAILED")
        import traceback
        traceback.print_exc()
        
    print("\n--- Testing serialization/dump ---")
    try:
        # Simulate FastAPI's validation/serialization flow
        res = ta.validate_python([model_obj], from_attributes=True)
        print("List validation (from_attributes=True): SUCCESS")
    except Exception as e:
        print("List validation (from_attributes=True): FAILED")
        import traceback
        traceback.print_exc()
