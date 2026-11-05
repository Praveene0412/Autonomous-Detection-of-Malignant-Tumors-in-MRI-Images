# app.py
import os
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, send_from_directory, session
from flask_pymongo import PyMongo
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_session import Session
import bcrypt

from python.predict import predict_tumor   # ML prediction

# ---------------- PATHS ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
PYTHON_DIR = os.path.join(BASE_DIR, "python")
MODEL_PATH = os.path.join(PYTHON_DIR, "BrainTumor_Model.keras")

os.makedirs(UPLOADS_DIR, exist_ok=True)

# ---------------- APP CONFIG ----------------
app = Flask(__name__, static_folder=PUBLIC_DIR, static_url_path="/")

app.config["MONGO_URI"] = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017/brain_tumor_app"
)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

app.config["SESSION_TYPE"] = "filesystem"
app.config["UPLOAD_FOLDER"] = UPLOADS_DIR
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=1)

mongo = PyMongo(app)
Session(app)
CORS(app, supports_credentials=True)

users_col = mongo.db.users
analyses_col = mongo.db.analyses

ALLOWED_EXT = {"jpg", "jpeg", "png"}


# ---------------- HELPERS ----------------
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


def is_valid_email(email):
    import re
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email))


def is_valid_phone(phone):
    import re
    clean = phone.replace(" ", "").replace("-", "")
    return bool(re.match(r"^\d{10}$", clean))


def get_login_type(identifier):
    if is_valid_email(identifier):
        return "email"
    if is_valid_phone(identifier):
        return "phone"
    return None


def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = session.get("user")
        if not user or not user.get("isAdmin"):
            return jsonify({"success": False, "message": "Admin access only"}), 403
        return f(*args, **kwargs)
    return wrapper


# ---------------- CREATE ADMIN ----------------
def initialize_admin():
    admin_email = "adminbt2025@gmail.com"
    admin_phone = "9036948454"
    admin_password = "PPSU1234"

    exists = users_col.find_one({"$or": [
        {"email": admin_email},
        {"phone": admin_phone}
    ]})

    if exists is None:
        hashed = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt())
        users_col.insert_one({
            "email": admin_email,
            "phone": admin_phone,
            "password": hashed,
            "createdAt": datetime.utcnow()
        })
        print("Admin created")
    else:
        print("Admin already exists")


initialize_admin()


# ---------------- STATIC FRONTEND ----------------
@app.route("/")
def home():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    path = os.path.join(PUBLIC_DIR, filename)
    if os.path.exists(path):
        return send_from_directory(PUBLIC_DIR, filename)
    return send_from_directory(PUBLIC_DIR, "index.html")


# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    identifier = data.get("identifier", "").strip()
    password = data.get("password", "")
    confirm = data.get("confirmPassword", "")

    if not identifier or not password:
        return jsonify({"success": False, "message": "All fields required"})

    if password != confirm:
        return jsonify({"success": False, "message": "Passwords do not match"})

    login_type = get_login_type(identifier)
    if not login_type:
        return jsonify({"success": False, "message": "Invalid email/phone format"})

    clean = identifier.replace(" ", "").replace("-", "")
    if users_col.find_one({login_type: clean}):
        return jsonify({"success": False, "message": "User already exists"})

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    users_col.insert_one({
        login_type: clean,
        "password": hashed,
        "createdAt": datetime.utcnow()
    })

    return jsonify({"success": True, "message": "Registration successful"})


# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    identifier = data.get("identifier", "").strip()
    password = data.get("password", "")

    login_type = get_login_type(identifier)
    if not login_type:
        return jsonify({"success": False, "message": "Invalid login format"})

    clean = identifier.replace(" ", "").replace("-", "")
    user = users_col.find_one({login_type: clean})

    if not user:
        return jsonify({"success": False, "message": "User not found"})

    stored = user["password"]
    if isinstance(stored, str):
        stored = stored.encode()

    if not bcrypt.checkpw(password.encode(), stored):
        return jsonify({"success": False, "message": "Invalid password"})

    is_admin = clean in ["adminbt2025@gmail.com", "9036948454"]

    session["user"] = {
        "identifier": clean,
        "isAdmin": is_admin,
        "userId": str(user["_id"])
    }

    return jsonify({"success": True, "isAdmin": is_admin})


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/whoami")
def whoami():
    return jsonify(session.get("user", {"isAdmin": False}))


# ---------------- IMAGE ANALYSIS ----------------
@app.route("/analyze-image", methods=["POST"])
def analyze_image():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image uploaded"})

        file = request.files["image"]
        if not file or file.filename == "":
            return jsonify({"success": False, "message": "Invalid file"})

        if not allowed_file(file.filename):
            return jsonify({"success": False, "message": "Unsupported file type"})

        filename = f"{int(datetime.utcnow().timestamp())}-{secure_filename(file.filename)}"
        path = os.path.join(UPLOADS_DIR, filename)
        file.save(path)

        # ML Prediction
        result = predict_tumor(path, MODEL_PATH)

        # Save to database with datetime object for proper sorting
        analysis_record = {
            "userId": session.get("user", {}).get("userId"),
            "filename": filename,
            "originalName": file.filename,
            "analysisResult": {
                "tumorDetected": result["tumorDetected"],
                "confidence": result["confidence"],
                "message": result["message"]
            },
            "createdAt": datetime.utcnow()  # Store as datetime object
        }

        analyses_col.insert_one(analysis_record)

        return jsonify({
            "success": True,
            "result": {
                "tumorDetected": result["tumorDetected"],
                "confidence": result["confidence"],
                "message": result["message"],
                "filename": filename,
                "originalName": file.filename
            }
        })

    except Exception as e:
        print("Analyze image error:", e)
        return jsonify({"success": False, "message": "Error processing image"})


# -------- ADMIN --------
@app.route("/analysis-history")
@require_admin
def history():
    # Sort by createdAt in descending order (newest first)
    docs = list(analyses_col.find().sort("createdAt", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
        # Convert datetime to ISO string for frontend
        if isinstance(d.get("createdAt"), datetime):
            d["createdAt"] = d["createdAt"].isoformat() + "Z"
        # Handle case where it might be stored as string already
        elif isinstance(d.get("createdAt"), str):
            # Try to parse and reformat to ensure consistency
            try:
                dt = datetime.fromisoformat(d["createdAt"].replace("Z", ""))
                d["createdAt"] = dt.isoformat() + "Z"
            except:
                pass
    return jsonify({"success": True, "analyses": docs})


@app.route("/clear-history", methods=["DELETE"])
@require_admin
def clear_history():
    analyses_col.delete_many({})
    return jsonify({"success": True, "message": "History cleared"})


@app.route("/users")
@require_admin
def users():
    docs = list(users_col.find().sort("createdAt", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
        d.pop("password", None)
        # Convert datetime to ISO string if it's a datetime object
        if isinstance(d.get("createdAt"), datetime):
            d["createdAt"] = d["createdAt"].isoformat() + "Z"
    return jsonify({"success": True, "users": docs})


@app.route("/delete-user/<user_id>", methods=["DELETE"])
@require_admin
def delete_user(user_id):
    from bson.objectid import ObjectId

    try:
        obj_id = ObjectId(user_id)
    except:
        return jsonify({"success": False, "message": "Invalid User ID"})

    user = users_col.find_one({"_id": obj_id})
    if not user:
        return jsonify({"success": False, "message": "User not found"})

    # Do not delete admin account
    if user.get("email") == "adminbt2025@gmail.com" or user.get("phone") == "9036948454":
        return jsonify({"success": False, "message": "Admin cannot be deleted"})

    users_col.delete_one({"_id": obj_id})
    return jsonify({"success": True, "message": "User deleted successfully"})


# -------- MAIN SERVER START --------
if __name__ == "__main__":
    print("\n🚀 Server is running at: http://127.0.0.1:5000\n")
    app.run(port=5000, debug=True)