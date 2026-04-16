import os
import numpy as np
from tensorflow.keras.models import load_model
import uuid

from datetime import datetime
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash
from pymongo import MongoClient, errors
from bson import ObjectId
from dotenv import load_dotenv
from flask_mail import Mail

# --- Import from new modular structure ---
from config import Config, DevelopmentConfig, ProductionConfig
from utils.DLModelfunctions import preprocess_for_inference, leaf_preprocess
from auth.routes import setup_auth_routes
from auth.decorators import token_required
from routes.leafscan import setup_leafscan_routes
from routes.plants import setup_plants_routes
from routes.insectscan import setup_insectscan_routes
from routes.weather import setup_weather_routes

# --- Load Environment Variables ---
load_dotenv()
FLASK_ENV = os.environ.get("FLASK_ENV", "development")

# --- Initialize Flask with Config ---
app = Flask(__name__)
if FLASK_ENV == "production":
    app.config.from_object(ProductionConfig)
else:
    app.config.from_object(DevelopmentConfig)

# --- Initialize Flask-Mail ---
mail = Mail(app)

# --- MongoDB Configuration from Config ---
MONGO_URI = app.config.get("MONGO_URI")
if not MONGO_URI:
    print("ERROR: MONGO_URI not set in environment variables or config")
    MONGO_URI = os.environ.get("MONGO_URI")

client = MongoClient(MONGO_URI)
db = client[app.config.get("DATABASE_NAME", "deepblight")]
users_col = db.users
unverified_users_col = db.unverified_users
leafscan_col = db.leafscan
insectscan_col = db.insectscan
password_resets_col = db.password_resets

print(f"✓ Connected to MongoDB database: {app.config.get('DATABASE_NAME', 'deepblight')}")

# --- Model Loading with Error Handling ---
def load_model_safe(model_path, model_name):
    """Safely load a model with error handling"""
    try:
        if os.path.exists(model_path):
            model = load_model(model_path)
            print(f"✓ {model_name} loaded successfully")
            return model
        else:
            print(f"✗ WARNING: {model_name} not found at {model_path}")
            return None
    except Exception as e:
        print(f"✗ ERROR loading {model_name}: {e}")
        return None

# --- Load all models ---
print("\n--- Loading ML Models ---")
model = load_model_safe("models/pretrained_models/DenseNet5d256New.h5", "Leaf detection model")
leaf_det_model = load_model_safe("models/pretrained_models/leaf_detect.h5", "Leaf detect alternative model")
insect_detector_model = load_model_safe("models/pretrained_models/insect_vs_noninsect_densenet201.h5", "Insect detector model")
insect_classifier_model = load_model_safe("models/pretrained_models/DenseNet201_PotatoPest.h5", "Pest classifier model")
print("--- ML Models Load Complete ---\n")

# --- Classes for Leaf Detection ---
class_names = ["Early_Blight", "Healthy", "Late_Blight", "Leaf_Roll", "Verticillium_Wilt"]

# --- Create Upload Folder ---
UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Create Indexes for Collections ---
try:
    users_col.create_index("email", unique=True)
    unverified_users_col.create_index("created_at", expireAfterSeconds=3600)
    password_resets_col.create_index("created_at", expireAfterSeconds=3600)
except errors.OperationFailure as e:
    print(f"Index creation failed (this might be okay if they already exist): {e}")

# --- Setup Authentication Routes ---
setup_auth_routes(app, users_col, unverified_users_col, mail, password_resets_col=password_resets_col)
# --- Setup Leafscan Routes ---
setup_leafscan_routes(app, users_col, leafscan_col, token_required, model=model, preprocess_fn=preprocess_for_inference, leaf_detect_model=leaf_det_model, leaf_det_preprocess_fn=leaf_preprocess, class_names=class_names, upload_folder=UPLOAD_FOLDER)
# --- Setup Insectscan Routes ---
setup_insectscan_routes(app, users_col, insectscan_col, token_required, detector_model=insect_detector_model, classifier_model=insect_classifier_model, upload_folder=UPLOAD_FOLDER)
# --- Setup Weather Routes ---
setup_weather_routes(app, users_col, token_required)
# --- Setup Plants Routes ---
setup_plants_routes(app, users_col, token_required)


# --- API Endpoints ---

@app.route("/")
def home():
    return jsonify({"message": "Flask Auth API running with verification"})


@app.route("/profile", methods=["GET"])
@token_required(users_col, app)
def profile():
    user = request.user
    return jsonify({"message": "profile", "user": user})

'''
# Temporary debug route - creates a hardcoded user (remove later)
@app.route("/debug/add_dummy_user", methods=["POST"])
def add_dummy_user():
    """Insert a hardcoded dummy user into the `users` collection. Remove this route when not needed."""
    try:
        username = "admin"
        email = "admin@gmail.com"
        password_plain = "admin"
        hashed = generate_password_hash(password_plain)

        user_doc = {
            "username": username,
            "email": email,
            "password": hashed,
            "created_at": datetime.utcnow(),
        }

        try:
            result = users_col.insert_one(user_doc)
        except errors.DuplicateKeyError:
            return jsonify({"error": "user already exists", "email": email}), 409

        return jsonify({"message": "dummy user added", "email": email, "user_id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"error": "failed to add dummy user", "details": str(e)}), 500
'''

if __name__ == "__main__":
    FLASK_HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
    FLASK_PORT = int(os.environ.get("FLASK_PORT", 5000))
    FLASK_DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in ['true', 'on', '1']
    
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG, use_reloader=False)

