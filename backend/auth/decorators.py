"""Authentication decorators"""
from functools import wraps
from flask import request, jsonify
import jwt
from bson import ObjectId


def token_required(users_col, app):
    """
    Decorator to verify JWT token and attach user to request.
    
    Args:
        users_col: MongoDB users collection
        app: Flask app instance (for SECRET_KEY)
    
    Returns:
        Decorated function that validates the Authorization header
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get("Authorization", None)
            if not auth_header:
                return jsonify({"error": "Authorization header missing"}), 401

            parts = auth_header.split()
            if len(parts) != 2 or parts[0].lower() != "bearer":
                return jsonify({"error": "Authorization header must be 'Bearer <token>'"}), 401

            token = parts[1]
            try:
                payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
                user_id = payload.get("user_id")
                if not user_id:
                    raise jwt.InvalidTokenError()
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401
            
            user = users_col.find_one({"_id": ObjectId(user_id)}, {"password": 0})
            if not user:
                return jsonify({"error": "User not found"}), 401
            
            print(f"Authenticated user ID: {user_id}")
            user["user_id"] = str(user["_id"])
            del user["_id"]
            if "created_at" in user and hasattr(user["created_at"], "isoformat"):
                user["created_at"] = user["created_at"].isoformat()

            request.user = user
            return f(*args, **kwargs)
        return decorated
    return decorator


def admin_required(f):
    """
    Use only after @token_required — expects request.user with role == 'admin'.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        user = getattr(request, "user", None) or {}
        if user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)

    return decorated
