from pymongo import MongoClient
from datetime import datetime

client = MongoClient("mongodb://localhost:27017")
db = client["brain_tumor_app"]

# Fix user dates
db.users.update_many(
    {"createdAt": {"$exists": False}},
    {"$set": {"createdAt": datetime.utcnow()}}
)

# Fix analysis records
db.analyses.update_many(
    {"createdAt": {"$exists": False}},
    {"$set": {"createdAt": datetime.utcnow()}}
)

print("✔ MongoDB date fields fixed successfully!")
