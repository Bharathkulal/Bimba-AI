from app.core.mongodb import db

def get_db():
    yield db

