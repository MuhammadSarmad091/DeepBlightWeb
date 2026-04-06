"""Authentication routes for user registration, verification, and login"""
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import errors
from datetime import datetime
import random
import string
import jwt
from flask_mail import Message

# Create the blueprint
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def generate_token(user_id: str, expires_hours: int = 24, app=None):
    """Generate JWT token for user"""
    from datetime import timedelta
    
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=expires_hours),
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def generate_verification_code(length=6):
    """Generates a random 6-digit verification code"""
    return "".join(random.choices(string.digits, k=length))


def setup_auth_routes(app, users_col, unverified_users_col, mail):
    """
    Setup authentication routes for the Flask app.
    
    Args:
        app: Flask app instance
        users_col: MongoDB users collection
        unverified_users_col: MongoDB unverified_users collection
        mail: Flask-Mail instance
    """
    
    @auth_bp.route("/register", methods=["POST"])
    def register():
        """Register a new user and send verification code to email"""
        data = request.get_json() or {}
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({"error": "username, email and password are required"}), 400
        if len(password) < 6:
            return jsonify({"error": "password must be at least 6 characters"}), 400

        # Check if user is already in the main users collection
        if users_col.find_one({"email": email}):
            return jsonify({"error": "email already registered"}), 409

        # Generate code and hash password
        verification_code = generate_verification_code()
        hashed_password = generate_password_hash(password)

        # Store in the temporary 'unverified_users' collection
        unverified_users_col.update_one(
            {"email": email},
            {
                "$set": {
                    "username": username,
                    "password": hashed_password,
                    "code": verification_code,
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )

        # Send the verification email
        try:
            msg = Message(
                subject="Your DeepBlight Verification Code",
                recipients=[email],
                body=f"Welcome to DeepBlight! Your verification code is: {verification_code}\n\nThis code will expire in 1 hour."
            )
            mail.send(msg)
        except Exception as e:
            print(f"Failed to send email: {e}")
            return jsonify({"error": "Could not send verification email. Please try again later."}), 500

        return jsonify({"message": "Verification code sent to email."}), 201


    @auth_bp.route("/verify", methods=["POST"])
    def verify():
        """Verify user email with verification code"""
        data = request.get_json() or {}
        email = data.get('email')
        code = data.get('code')

        if not email or not code:
            return jsonify({"error": "email and code are required"}), 400

        # Find the user in the temporary collection
        temp_user = unverified_users_col.find_one({"email": email, "code": code})

        if not temp_user:
            return jsonify({"error": "Invalid email or verification code."}), 404

        # Create the permanent user document
        user_doc = {
            "username": temp_user["username"],
            "email": temp_user["email"],
            "password": temp_user["password"],
            "created_at": datetime.utcnow(),
        }

        # Insert into the main 'users' collection
        try:
            result = users_col.insert_one(user_doc)
        except errors.DuplicateKeyError:
            return jsonify({"error": "This email has just been registered."}), 409

        # Clean up: Delete the record from the temporary collection
        unverified_users_col.delete_one({"email": email})

        return jsonify({"message": "User verified successfully. Please log in."}), 200


    @auth_bp.route("/login", methods=["POST"])
    def login():
        """Login user and return JWT token"""
        data = request.get_json() or {}
        email = (data.get("email") or "").lower().strip()
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({"error": "email and password are required"}), 400

        user = users_col.find_one({"email": email})
        if not user:
            return jsonify({"error": "invalid email or password"}), 401

        if not check_password_hash(user["password"], password):
            return jsonify({"error": "invalid email or password"}), 401

        user_id = str(user["_id"])
        token = generate_token(user_id, app=app)
        user_data = {"user_id": user_id, "username": user.get("username"), "email": user.get("email")}
        return jsonify({"message": "login successful", "token": token, "user": user_data})

    
    # Register the blueprint with the app
    app.register_blueprint(auth_bp)
