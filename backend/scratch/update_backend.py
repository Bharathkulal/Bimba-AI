import re
import os

FILE_PATH = r"backend/app/api/v1/users/users_routes.py"

with open(FILE_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update StudentCreateRequest Schema
schema_target = """class StudentCreateRequest(BaseModel):
    roll_number: str
    student_name: str
    email: str
    dob: str
    phone: Optional[str] = ""
    department: str
    semester: int
    section: Optional[str] = "A"
    academic_year: Optional[str] = "2026"
"""
schema_replacement = """class StudentCreateRequest(BaseModel):
    roll_number: str
    student_name: str
    email: str
    dob: str
    password: Optional[str] = None
    phone: Optional[str] = ""
    department: str
    semester: int
    section: Optional[str] = "A"
    academic_year: Optional[str] = "2026"

class StudentBulkActionRequest(BaseModel):
    roll_numbers: List[str]
    action: str  # delete, activate, deactivate, reset_password
"""
if schema_target in content:
    content = content.replace(schema_target, schema_replacement)
else:
    print("Schema target not found!")

# 2. Update create_student logic
create_target = """    # Date of Birth becomes the initial password, hashed.
    hashed_pass = get_password_hash(payload.dob)"""
create_replacement = """    # If password is provided, hash it. Else fallback to DOB.
    pass_to_hash = payload.password if payload.password else payload.dob
    hashed_pass = get_password_hash(pass_to_hash)"""
if create_target in content:
    content = content.replace(create_target, create_replacement)
else:
    print("Create logic target not found!")

# 3. Add new endpoints before @router.get("/resumes")
endpoints = """
@router.get("/students/stats")
def get_students_stats(admin: AdminUser = Depends(get_current_admin), db: Any = Depends(get_db)):
    total = db.students.count_documents({})
    active = db.students.count_documents({"is_active": True})
    inactive = total - active
    
    # resumes collection uses student_id
    resumes_agg = list(db.resumes.aggregate([
        {"$group": {"_id": "$student_id"}}
    ]))
    with_resume = len(resumes_agg)
    without_resume = total - with_resume
    
    # logged in today
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    logged_in_today = db.students.count_documents({"last_login": {"$gte": today}})
    
    return {
        "total": total,
        "active": active,
        "inactive": inactive,
        "with_resume": with_resume,
        "without_resume": without_resume,
        "logged_in_today": logged_in_today
    }

@router.get("/students/search")
def search_students(q: str = Query(""), admin: AdminUser = Depends(get_current_admin), db: Any = Depends(get_db)):
    query = {
        "$or": [
            {"student_name": {"$regex": q, "$options": "i"}},
            {"roll_number": {"$regex": q, "$options": "i"}},
            {"department": {"$regex": q, "$options": "i"}}
        ]
    }
    students = list(db.students.find(query).limit(50))
    result = []
    for s_doc in students:
        s = MongoModel(s_doc)
        result.append({
            "id": s.id,
            "roll_number": s.roll_number,
            "student_name": s.student_name,
            "full_name": s.full_name or s.student_name,
            "email": s.email,
            "department": s.department,
            "semester": s.semester,
            "status": s.status,
            "is_active": s.is_active
        })
    return result

@router.post("/students/bulk")
def bulk_student_action(payload: StudentBulkActionRequest, request: Request, admin: AdminUser = Depends(require_role(["super_admin", "admin"])), db: Any = Depends(get_db)):
    if not payload.roll_numbers:
        raise HTTPException(status_code=400, detail="No students selected.")
        
    rolls = payload.roll_numbers
    if payload.action == "delete":
        db.students.delete_many({"roll_number": {"$in": rolls}})
    elif payload.action == "activate":
        db.students.update_many({"roll_number": {"$in": rolls}}, {"$set": {"status": "Active", "is_active": True}})
    elif payload.action == "deactivate":
        db.students.update_many({"roll_number": {"$in": rolls}}, {"$set": {"status": "Suspended", "is_active": False}})
    elif payload.action == "reset_password":
        students = list(db.students.find({"roll_number": {"$in": rolls}}))
        for s in students:
            dob = s.get("dob", "15-08-2005")
            db.students.update_one({"_id": s["_id"]}, {"$set": {"password_hash": get_password_hash(dob)}})
            
    log_audit(db, admin.username, f"Bulk Action: {payload.action}", "Success", affected_record=f"{len(rolls)} students", request=request)
    return {"success": True, "message": f"Bulk {payload.action} executed on {len(rolls)} students."}

@router.get("/students/template")
def download_student_template(admin: AdminUser = Depends(get_current_admin)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["name", "rollNumber", "password", "department", "semester"])
    writer.writerow(["Rahul Sharma", "BCA001", "rahul123", "BCA", 3])
    writer.writerow(["Asha Patil", "BCA002", "asha456", "BCA", 3])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bimba_students_template.csv"}
    )

@router.get("/students/export")
def export_students(format: str = Query("csv"), admin: AdminUser = Depends(get_current_admin), db: Any = Depends(get_db)):
    students = list(db.students.find({}))
    if format == "json":
        # Remove object ids and hashes
        for s in students:
            s.pop("_id", None)
            s.pop("password_hash", None)
        import json
        output = io.StringIO()
        json.dump(students, output, default=str)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=bimba_students_export.json"}
        )
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Name", "Roll Number", "Email", "DOB", "Phone", "Department", "Semester", "Status"])
        for s in students:
            writer.writerow([
                s.get("student_name", ""),
                s.get("roll_number", ""),
                s.get("email", ""),
                s.get("dob", ""),
                s.get("phone", ""),
                s.get("department", ""),
                s.get("semester", ""),
                s.get("status", "")
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=bimba_students_export.csv"}
        )

@router.post("/students/import")
async def import_students(file: UploadFile = File(...), admin: AdminUser = Depends(require_role(["super_admin", "admin"])), db: Any = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for now.")
        
    content = await file.read()
    decoded = content.decode('utf-8').splitlines()
    reader = csv.DictReader(decoded)
    
    imported = 0
    errors = []
    
    # Check headers
    expected = ["name", "rollNumber", "password", "department", "semester"]
    actual = reader.fieldnames or []
    # Normalize headers for case insensitivity
    actual_lower = [h.lower().strip() for h in actual]
    
    for row in reader:
        try:
            # We map row keys based on case insensitive matches if needed, but dictreader preserves case.
            # Let's extract by exact keys or fallback.
            name = row.get("name", "").strip()
            roll = row.get("rollNumber", "").strip()
            password = row.get("password", "").strip()
            dept = row.get("department", "").strip()
            sem_str = row.get("semester", "").strip()
            
            if not name or not roll or not password or not dept or not sem_str:
                errors.append(f"Row skipped: Missing required fields for roll {roll or 'Unknown'}")
                continue
                
            sem = int(sem_str)
            
            # Check duplicate
            if db.students.find_one({"roll_number": roll}):
                errors.append(f"Row skipped: Roll number {roll} already exists.")
                continue
                
            hashed = get_password_hash(password)
            next_id = get_next_sequence("students")
            
            doc = {
                "id": next_id,
                "roll_number": roll,
                "student_name": name,
                "full_name": name,
                "email": f"{roll.lower()}@bimba.ai",
                "dob": "01-01-2000",
                "phone": "",
                "department": dept,
                "semester": sem,
                "status": "Active",
                "is_active": True,
                "password_hash": hashed,
                "account_activated": True,
                "otp_verified": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            }
            db.students.insert_one(doc)
            imported += 1
            
        except Exception as e:
            errors.append(f"Error processing row: {str(e)}")
            
    return {
        "success": True,
        "message": f"Import complete. {imported} imported.",
        "imported": imported,
        "errors": errors
    }
"""

target = '@router.get("/resumes")'
if target in content:
    content = content.replace(target, endpoints + "\n" + target)
else:
    print("Resumes endpoint not found!")

with open(FILE_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("Update script finished.")
