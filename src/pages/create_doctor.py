# create_doctor.py
import os
import getpass
import bcrypt
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DBNAME = os.getenv("MONGO_DBNAME", "heart_app")

def create_doctor(username, password, full_name=None, role="doctor"):
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DBNAME]
    doctors = db.doctors
    if doctors.find_one({"username": username}):
        print("User already exists:", username)
        return
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    doc = {
        "username": username,
        "password_hash": hashed,   # stored as bytes (BSON Binary)
        "full_name": full_name or username,
        "role": role,
        "created_at": __import__("datetime").datetime.utcnow()
    }
    res = doctors.insert_one(doc)
    print("Created doctor:", username, "id:", res.inserted_id)

if __name__ == "__main__":
    user = input("Username: ").strip()
    pwd = getpass.getpass("Password: ")
    name = input("Full name (optional): ").strip() or None
    create_doctor(user, pwd, name)
