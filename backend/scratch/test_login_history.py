import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.mongodb import db

history = list(db.login_histories.find().sort('_id', -1).limit(5))
for h in history:
    print(h)
