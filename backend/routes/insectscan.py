"""Insectscan routes for saving and deleting insect scan records"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import os
import uuid
import base64
from bson import ObjectId
import numpy as np
from io import BytesIO
from PIL import Image
from utils.s3_utils import (
    upload_file_obj_to_s3, 
    delete_file_from_s3, 
    get_file_from_s3_as_bytes,
    s3_file_exists,
    list_files_in_s3,
    generate_presigned_url
)
from ml_services.prediction import (
    preprocess_image,
    detect_insect,
    classify_pest,
    BINARY_CLASS_NAMES,
    PEST_CLASS_NAMES,
)

# Create the blueprint
insectscan_bp = Blueprint("insectscan", __name__, url_prefix="/insectscan")

# Storage directory for temporary uploads (before S3)
STORAGE_BASE_PATH = "./storage"
USE_S3 = os.environ.get("USE_S3", "True").lower() in ["true", "1", "yes"]


def ensure_storage_directory(user_id):
    """Ensure user storage directory exists"""
    user_dir = os.path.join(STORAGE_BASE_PATH, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    return user_dir


def get_s3_key_from_url(image_url: str) -> str:
    """
    Extract S3 key from S3 URL (format: s3://bucket-name/key)
    
    Args:
        image_url: S3 URL
    
    Returns:
        S3 key
    """
    try:
        if image_url.startswith("s3://"):
            return image_url.split("s3://", 1)[1].split("/", 1)[1]
    except Exception as e:
        print(f"Error extracting S3 key: {e}")
    return None


def convert_s3_url_to_presigned(image_url: str, expiration: int = 3600) -> str:
    """
    Convert S3 URL to presigned URL for Android app to load image.
    
    Args:
        image_url: S3 URL or local path
        expiration: URL expiration time in seconds (default: 1 hour)
    
    Returns:
        Presigned URL if S3, local path if local storage
    """
    if not image_url:
        return None
    
    if USE_S3 and image_url.startswith("s3://"):
        s3_key = get_s3_key_from_url(image_url)
        if s3_key:
            success, presigned_url, error = generate_presigned_url(s3_key, expiration)
            if success:
                return presigned_url
            else:
                print(f"Error generating presigned URL for {s3_key}: {error}")
                return None
    
    # Return local path as-is
    return image_url


def check_image_exists(image_url: str) -> bool:
    """
    Check if image exists (either in S3 or locally)
    
    Args:
        image_url: Image URL or path
    
    Returns:
        True if image exists, False otherwise
    """
    if not image_url:
        return False
    
    if USE_S3 and image_url.startswith("s3://"):
        # Check S3 file existence
        try:
            s3_key = get_s3_key_from_url(image_url)
            return s3_file_exists(s3_key) if s3_key else False
        except Exception as e:
            print(f"Error checking S3 file: {e}")
            return False
    else:
        # Check local file existence
        return os.path.exists(image_url)


def setup_insectscan_routes(app, users_col, insectscan_col, token_required_decorator, detector_model, classifier_model, upload_folder="./uploads"):
    """
    Setup insectscan routes for the Flask app.
    
    Args:
        app: Flask app instance
        users_col: MongoDB users collection
        insectscan_col: MongoDB insectscan collection
        token_required_decorator: Token validation decorator
        detector_model: Insect detection model
        classifier_model: Pest classification model
    """
    
    @insectscan_bp.route("/save", methods=["POST"])
    @token_required_decorator(users_col, app)
    def save_insectscan():
        """
        Save a new insectscan record with image.
        
        Request multipart/form-data:
        {
            "scan_id": "unique-scan-id",
            "image": <binary image file>,
            "datetime": "2025-12-05T10:30:00",
            "predicted_class": "Agrotis ipsilon (Hufnagel)",
            "confidence_score": 0.85
        }
        
        Returns:
            - 201: {"message": "Scan saved successfully", "scan_record": {...}}
            - 400: {"error": "Missing required fields"} or {"error": "Invalid datetime format"}
            - 409: {"error": "Scan with this ID already exists for user"}
            - 500: {"error": "Failed to save scan"}
        """
        try:
            user_id = str(request.user["user_id"])
            
            # Get form fields (not JSON, since we have file upload)
            scan_id = request.form.get("scan_id")
            datetime_str = request.form.get("datetime")
            predicted_class = request.form.get("predicted_class")
            confidence_score_str = request.form.get("confidence_score")
            
            if not scan_id or not datetime_str or not predicted_class or not confidence_score_str:
                return jsonify({"error": "scan_id, datetime, predicted_class, and confidence_score are required"}), 400
            
            # Validate and convert confidence_score to float
            try:
                confidence_score = float(confidence_score_str)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid confidence_score format. Must be a valid number"}), 400
            
            # Validate datetime format
            try:
                scan_datetime = datetime.fromisoformat(datetime_str)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid datetime format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}), 400
            
            # Check if image file is provided
            if "image" not in request.files:
                return jsonify({"error": "No image file provided"}), 400
            
            file = request.files["image"]
            if file.filename == "":
                return jsonify({"error": "Empty filename"}), 400
            
            # Check if scan with this ID already exists for this user
            existing_scan = insectscan_col.find_one({
                "user_id": ObjectId(user_id),
                "scan_id": scan_id
            })
            
            if existing_scan:
                return jsonify({"error": "Scan with this ID already exists for user"}), 409
            
            # Generate unique filename
            file_ext = os.path.splitext(file.filename)[1]
            if not file_ext:
                file_ext = ".jpg"
            
            unique_filename = f"{uuid.uuid4().hex}{file_ext}"
            
            # Resize image to 256x256 for efficient memory usage
            try:
                img = Image.open(file)
                img = img.resize((256, 256), Image.LANCZOS)
                # Save resized image to BytesIO object
                img_byte_arr = BytesIO()
                img.save(img_byte_arr, format='JPEG', quality=95)
                img_byte_arr.seek(0)
                file = img_byte_arr
            except Exception as e:
                print(f"Warning: Could not resize image: {e}. Using original image.")
                # Reset file pointer to beginning for original file
                file.seek(0)
            
            # Upload to S3 or save locally
            if USE_S3:
                # S3 storage
                s3_key = f"insectscans/{user_id}/{unique_filename}"
                success, image_url, error = upload_file_obj_to_s3(file, s3_key)
                
                if not success:
                    return jsonify({"error": f"Failed to upload image to S3: {error}"}), 500
            else:
                # Local storage (fallback)
                user_dir = ensure_storage_directory(user_id)
                img_path = os.path.abspath(os.path.join(user_dir, unique_filename))
                image_url = os.path.join(STORAGE_BASE_PATH, user_id, unique_filename)
                
                # Handle both FileStorage and BytesIO objects
                if isinstance(file, BytesIO):
                    # BytesIO object (resized image)
                    with open(img_path, 'wb') as f:
                        f.write(file.getvalue())
                else:
                    # FileStorage object (original file)
                    file.save(img_path)
            
            # Create scan document
            scan_doc = {
                "user_id": ObjectId(user_id),
                "scan_id": scan_id,
                "image_url": image_url,
                "predicted_class": predicted_class,
                "confidence_score": confidence_score,
                "datetime": scan_datetime,
                "created_at": datetime.utcnow()
            }
            
            # Insert into database
            result = insectscan_col.insert_one(scan_doc)
            
            # Prepare response
            scan_doc["_id"] = str(result.inserted_id)
            scan_doc["user_id"] = user_id
            scan_doc["datetime"] = scan_doc["datetime"].isoformat()
            scan_doc["created_at"] = scan_doc["created_at"].isoformat()
            
            return jsonify({
                "message": "Scan saved successfully",
                "scan_record": scan_doc
            }), 201
            
        except Exception as e:
            print(f"Error saving insectscan: {e}")
            return jsonify({"error": "Failed to save scan"}), 500
    
    
    @insectscan_bp.route("/delete", methods=["DELETE"])
    @token_required_decorator(users_col, app)
    def delete_insectscan():
        """
        Delete a insectscan record and its associated image.
        
        Request JSON:
        {
            "scan_id": "unique-scan-id"
        }
        
        Returns:
            - 200: {"message": "Scan deleted successfully"}
            - 400: {"error": "scan_id is required"}
            - 404: {"error": "Scan not found"}
            - 500: {"error": "Failed to delete scan"}
        """
        try:
            user_id = str(request.user["user_id"])
            print(f"DEBUG insectscan delete: user_id={user_id}")
            data = request.get_json() or {}
            print(f"DEBUG insectscan delete: data={data}")
            
            # Validate required fields
            scan_id = data.get("scan_id")
            if not scan_id:
                print("DEBUG insectscan delete: scan_id missing")
                return jsonify({"error": "scan_id is required"}), 400
            
            print(f"DEBUG insectscan delete: looking for scan_id={scan_id}")
            # Find the scan in database
            scan = insectscan_col.find_one({
                "user_id": ObjectId(user_id),
                "scan_id": scan_id
            })
            
            if not scan:
                print("DEBUG insectscan delete: scan not found")
                return jsonify({"error": "Scan not found"}), 404
            
            print("DEBUG insectscan delete: scan found, deleting")
            
            # Delete the image file
            image_url = scan.get("image_url")
            if image_url:
                if USE_S3:
                    # Delete from S3
                    # Extract S3 key from URL (format: s3://bucket-name/key)
                    if image_url.startswith("s3://"):
                        s3_key = image_url.split("s3://", 1)[1].split("/", 1)[1]
                        success, error = delete_file_from_s3(s3_key)
                        if not success:
                            print(f"Warning: Could not delete file from S3 {s3_key}: {error}")
                else:
                    # Delete local file
                    if os.path.exists(image_url):
                        try:
                            os.remove(image_url)
                        except Exception as e:
                            print(f"Warning: Could not delete image file {image_url}: {e}")
            
            # Delete the scan record from database
            insectscan_col.delete_one({"_id": scan["_id"]})
            
            return jsonify({"message": "Scan deleted successfully"}), 200
            
        except Exception as e:
            print(f"Error deleting insectscan: {e}")
            return jsonify({"error": "Failed to delete scan"}), 500
    
    
    @insectscan_bp.route("/getall", methods=["GET"])
    @token_required_decorator(users_col, app)
    def get_all_scans():
        """
        Get all insectscans for the authenticated user.
        
        Returns:
            - 200: {
                "message": "Scans retrieved successfully",
                "total_scans": int,
                "scans": [
                  {
                    "_id": "...",
                    "user_id": "...",
                    "scan_id": "...",
                    "image_url": "...",
                    "image_exists": boolean,
                    "predicted_class": "...",
                    "confidence_score": float,
                    "datetime": "...",
                    "created_at": "..."
                  },
                  ...
                ]
              }
            - 500: {"error": "Failed to retrieve scans"}
        """
        try:
            user_id = str(request.user["user_id"])
            
            # Fetch all scans for the user, sorted by creation date descending
            scans = list(insectscan_col.find({
                "user_id": ObjectId(user_id)
            }).sort("created_at", -1))
            
            # Process scans and check if images exist
            processed_scans = []
            for scan in scans:
                scan["_id"] = str(scan["_id"])
                scan["user_id"] = user_id
                
                # Check if image file exists and convert to presigned URL
                image_url = scan.get("image_url")
                scan["image_exists"] = check_image_exists(image_url)
                scan["image_ref"] = image_url
                # Convert S3 URL to presigned URL for Android app
                scan["image_url"] = convert_s3_url_to_presigned(image_url) if image_url else None
                # Include prediction fields if present
                scan["predicted_class"] = scan.get("predicted_class")
                scan["confidence_score"] = float(scan.get("confidence_score", 1.0))
                
                # Convert datetime to ISO format
                if "datetime" in scan and hasattr(scan["datetime"], "isoformat"):
                    scan["datetime"] = scan["datetime"].isoformat()
                if "created_at" in scan and hasattr(scan["created_at"], "isoformat"):
                    scan["created_at"] = scan["created_at"].isoformat()
                
                processed_scans.append(scan)
            
            return jsonify({
                "message": "Scans retrieved successfully",
                "total_scans": len(processed_scans),
                "scans": processed_scans
            }), 200
            
        except Exception as e:
            print(f"Error retrieving all scans: {e}")
            return jsonify({"error": "Failed to retrieve scans"}), 500
    
    
    @insectscan_bp.route("/getsome", methods=["POST"])
    @token_required_decorator(users_col, app)
    def get_some_scans():
        """
        Get paginated insectscans for the authenticated user (for "Show More" functionality).
        
        Request JSON:
        {
            "start_index": int (required, starting index for pagination, default: 0),
            "scans_to_send": int (required, number of scans to return, default: 5)
        }
        
        Returns:
            - 200: {
                "message": "Scans retrieved successfully",
                "start_index": int,
                "scans_returned": int,
                "total_scans": int,
                "has_more": boolean,
                "scans": [...]
              }
            - 400: {"error": "start_index and scans_to_send must be positive integers"}
            - 500: {"error": "Failed to retrieve scans"}
        """
        try:
            user_id = str(request.user["user_id"])
            data = request.get_json() or {}
            
            # Get pagination parameters
            start_index = data.get("start_index", 0)
            scans_to_send = data.get("scans_to_send", 5)
            
            # Validate parameters
            try:
                start_index = int(start_index)
                scans_to_send = int(scans_to_send)
                
                if start_index < 0 or scans_to_send <= 0:
                    return jsonify({"error": "start_index and scans_to_send must be positive integers"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": "start_index and scans_to_send must be positive integers"}), 400
            
            # Get total count of scans for this user
            total_scans = insectscan_col.count_documents({"user_id": ObjectId(user_id)})
            
            # Fetch paginated scans, sorted by creation date descending
            scans = list(insectscan_col.find({
                "user_id": ObjectId(user_id)
            }).sort("created_at", -1).skip(start_index).limit(scans_to_send))
            
            # Process scans
            processed_scans = []
            for scan in scans:
                scan["_id"] = str(scan["_id"])
                scan["user_id"] = user_id
                
                # Check if image file exists and convert to presigned URL
                image_url = scan.get("image_url")
                scan["image_exists"] = check_image_exists(image_url)
                scan["image_ref"] = image_url
                # Convert S3 URL to presigned URL for Android app
                scan["image_url"] = convert_s3_url_to_presigned(image_url) if image_url else None
                # Include prediction fields if present
                scan["predicted_class"] = scan.get("predicted_class")
                scan["confidence_score"] = float(scan.get("confidence_score", 1.0))
                
                # Convert datetime to ISO format
                if "datetime" in scan and hasattr(scan["datetime"], "isoformat"):
                    scan["datetime"] = scan["datetime"].isoformat()
                if "created_at" in scan and hasattr(scan["created_at"], "isoformat"):
                    scan["created_at"] = scan["created_at"].isoformat()
                
                processed_scans.append(scan)
            
            # Check if there are more scans after this batch
            has_more = (start_index + len(processed_scans)) < total_scans
            
            return jsonify({
                "message": "Scans retrieved successfully",
                "start_index": start_index,
                "scans_returned": len(processed_scans),
                "total_scans": total_scans,
                "has_more": has_more,
                "scans": processed_scans
            }), 200
            
        except Exception as e:
            print(f"Error retrieving scans: {e}")
            return jsonify({"error": "Failed to retrieve scans"}), 500
    
    
    @insectscan_bp.route("/getone", methods=["POST"])
    @token_required_decorator(users_col, app)
    def get_one_scan():
        """
        Get a specific insectscan by scan_id for the authenticated user.
        
        Request JSON:
        {
            "scan_id": "string (required)"
        }
        
        Returns:
            - 200: {
                "message": "Scan retrieved successfully",
                "scan": {
                  "_id": "...",
                  "user_id": "...",
                  "scan_id": "...",
                  "image_url": "...",
                  "image_exists": boolean,
                  "predicted_class": "...",
                  "confidence_score": float,
                  "datetime": "...",
                  "created_at": "..."
                }
              }
            - 400: {"error": "scan_id is required"}
            - 401: {"error": "Authorization header missing"} | {"error": "Token expired"} | {"error": "Invalid token"} | {"error": "User not found"}
            - 404: {"error": "Scan not found"}
            - 500: {"error": "Failed to retrieve scan"}
        """
        try:
            user_id = str(request.user["user_id"])
            data = request.get_json() or {}
            
            # Validate required fields
            scan_id = data.get("scan_id")
            if not scan_id:
                return jsonify({"error": "scan_id is required"}), 400
            
            # Find the scan for this user
            scan = insectscan_col.find_one({
                "user_id": ObjectId(user_id),
                "scan_id": scan_id
            })
            
            if not scan:
                return jsonify({"error": "Scan not found"}), 404
            
            # Process scan
            scan["_id"] = str(scan["_id"])
            scan["user_id"] = user_id
            
            # Check if image file exists and convert to presigned URL
            image_url = scan.get("image_url")
            scan["image_exists"] = check_image_exists(image_url)
            scan["image_ref"] = image_url
            # Convert S3 URL to presigned URL for Android app
            scan["image_url"] = convert_s3_url_to_presigned(image_url) if image_url else None
            # Include prediction fields if present
            scan["predicted_class"] = scan.get("predicted_class")
            scan["confidence_score"] = float(scan.get("confidence_score", 1.0))
            
            # Convert datetime to ISO format
            if "datetime" in scan and hasattr(scan["datetime"], "isoformat"):
                scan["datetime"] = scan["datetime"].isoformat()
            if "created_at" in scan and hasattr(scan["created_at"], "isoformat"):
                scan["created_at"] = scan["created_at"].isoformat()
            
            return jsonify({
                "message": "Scan retrieved successfully",
                "scan": scan
            }), 200
            
        except Exception as e:
            print(f"Error retrieving scan: {e}")
            return jsonify({"error": "Failed to retrieve scan"}), 500
    
    
    @insectscan_bp.route("/upload", methods=["POST"])
    @token_required_decorator(users_col, app)
    def upload_and_predict():
        """
        Upload an image, run insect detection and pest classification, and return prediction plus next scan id for the user.

        Accepts multipart/form-data with fields:
          - image: <file> (required)
          - userid: string (required) -- must match authenticated user

        Returns:
          - 200: {
                "predicted_class": str,
                "confidence_score": float,
                "next_scan_id": str,
                "probabilities": [float, ...],
                "class_names": [str, ...],
            }
            (For "noninsect", probabilities are the insect vs non-insect detector; for a pest, they are all pest classes.)
          - 400/401/403/500 on errors
        """
        try:
            # userid may come in form fields (multipart) or JSON
            userid = (request.form.get("userid") or request.values.get("userid") or (request.get_json(silent=True) or {}).get("userid"))
            if not userid:
                return jsonify({"error": "userid is required"}), 400

            # Ensure provided userid matches authenticated user
            auth_user_id = str(request.user.get("user_id"))
            if userid != auth_user_id:
                return jsonify({"error": "Provided userid does not match authenticated user"}), 403

            # Check image
            if "image" not in request.files:
                return jsonify({"error": "No image file provided"}), 400
            file = request.files["image"]
            if file.filename == "":
                return jsonify({"error": "Empty filename"}), 400

            # Compute next scan id for this user (max existing numeric scan_id + 1)
            try:
                cursor = insectscan_col.find({"user_id": ObjectId(userid)}, {"scan_id": 1})
            except Exception:
                return jsonify({"error": "Invalid userid format"}), 400

            max_num = 0
            for doc in cursor:
                sid = doc.get("scan_id")
                try:
                    n = int(sid)
                    if n > max_num:
                        max_num = n
                except Exception:
                    continue
            next_scan_num = max_num + 1
            next_scan_id = str(next_scan_num)

            # Save uploaded image temporarily to upload_folder
            os.makedirs(upload_folder, exist_ok=True)
            filename = os.path.basename(file.filename).replace(" ", "_")
            name, ext = os.path.splitext(filename)
            if ext == "":
                ext = ".jpg"
            tmp_filename = f"{name}_{uuid.uuid4().hex}{ext}"
            tmp_path = os.path.join(upload_folder, tmp_filename)
            try:
                file.save(tmp_path)

                # Perform Insect Detection
                img_array_detector = preprocess_image(tmp_path, target_size=(150, 150))
                label, confidence, det_probs = detect_insect(detector_model, img_array_detector)
                
                if label == 'noninsect':
                    response = {
                        "predicted_class": "noninsect",
                        "confidence_score": float(confidence),
                        "next_scan_id": next_scan_id,
                        "probabilities": det_probs,
                        "class_names": list(BINARY_CLASS_NAMES),
                    }
                    return jsonify(response), 200
                
                # Perform Pest Classification
                img_array_classifier = preprocess_image(tmp_path, target_size=(224, 224))
                pest_label, pest_conf, pest_probs = classify_pest(classifier_model, img_array_classifier)
                
                response = {
                    "predicted_class": pest_label,
                    "confidence_score": float(pest_conf),
                    "next_scan_id": next_scan_id,
                    "probabilities": pest_probs,
                    "class_names": list(PEST_CLASS_NAMES),
                }
                return jsonify(response), 200
            finally:
                try:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                except Exception:
                    pass

        except Exception as e:
            print(f"Error processing upload: {e}")
            return jsonify({"error": "Failed to process image"}), 500

    @insectscan_bp.route("/getimages", methods=["POST"])
    @token_required_decorator(users_col, app)
    def get_images():
        """
        Retrieve multiple images from the backend by their paths.
        Images are returned as base64 encoded strings for easy transmission over HTTP.
        If an image file is not found, it's still returned with image_data as null.
        
        Request JSON:
        {
            "paths": ["storage/userid/uuid1.jpg", "storage/userid/uuid2.jpg", ...]
        }
        
        Returns:
            - 200: {
                "message": "Images retrieved",
                "total_requested": int,
                "total_found": int,
                "images": [
                  {
                    "path": "storage/userid/uuid1.jpg",
                    "found": boolean,
                    "image_data": "base64-encoded-image-string or null"
                  },
                  ...
                ]
              }
            - 400: {"error": "paths array is required"} | {"error": "paths must be a non-empty array"}
            - 401: {"error": "Authorization header missing"} | {"error": "Token expired"} | {"error": "Invalid token"} | {"error": "User not found"}
            - 500: {"error": "Failed to retrieve images"}
        """
        try:
            data = request.get_json() or {}
            
            # Validate required fields
            paths = data.get("paths")
            if not paths:
                return jsonify({"error": "paths array is required"}), 400
            
            if not isinstance(paths, list):
                return jsonify({"error": "paths must be an array"}), 400
            
            if len(paths) == 0:
                return jsonify({"error": "paths must be a non-empty array"}), 400
            
            # Process each path and retrieve image
            images_result = []
            total_found = 0
            
            for path in paths:
                if not isinstance(path, str):
                    images_result.append({
                        "path": str(path),
                        "found": False,
                        "image_data": None
                    })
                    continue
                
                image_data = None
                found = False
                
                # Check if file exists and read it
                if USE_S3 and path.startswith("s3://"):
                    # Get from S3
                    try:
                        s3_key = path.split("s3://", 1)[1].split("/", 1)[1]
                        success, file_bytes, error = get_file_from_s3_as_bytes(s3_key)
                        if success:
                            image_data = base64.b64encode(file_bytes).decode('utf-8')
                            found = True
                            total_found += 1
                        else:
                            print(f"Warning: Could not retrieve file from S3 {path}: {error}")
                    except Exception as e:
                        print(f"Warning: Error processing S3 path {path}: {e}")
                else:
                    # Get from local storage
                    if os.path.exists(path):
                        try:
                            with open(path, 'rb') as f:
                                image_bytes = f.read()
                                # Encode image as base64 for transmission
                                image_data = base64.b64encode(image_bytes).decode('utf-8')
                                found = True
                                total_found += 1
                        except Exception as e:
                            print(f"Warning: Could not read image file {path}: {e}")
                            found = False
                    else:
                        print(f"Warning: Image file not found: {path}")
                        found = False
                
                images_result.append({
                    "path": path,
                    "found": found,
                    "image_data": image_data
                })
            
            return jsonify({
                "message": "Images retrieved",
                "total_requested": len(paths),
                "total_found": total_found,
                "images": images_result
            }), 200
            
        except Exception as e:
            print(f"Error retrieving images: {e}")
            return jsonify({"error": "Failed to retrieve images"}), 500
    
    
    # Register the blueprint with the app
    app.register_blueprint(insectscan_bp)