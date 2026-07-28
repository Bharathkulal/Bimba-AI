import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.mongodb import db
from app.models.student import Student
from app.core.security import verify_password

student_doc = db.students.find_one({'roll_number': 'BCA24001'})
if student_doc:
    student = Student(student_doc)
    print('student_doc type:', type(student_doc))
    print('student type:', type(student))
    print('student.password_hash:', student.password_hash)
    print('type of password_hash:', type(student.password_hash))
    print('verify_password result:', verify_password('15-08-2005', student.password_hash))
    print('is_active:', student.is_active)
