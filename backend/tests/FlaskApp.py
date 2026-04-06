import cv2
import numpy as np
from tensorflow.keras.models import load_model
from flask import Flask, request, jsonify
import os
import uuid

# ---------------- Load trained model ----------------
model = load_model("DenseNet2d256New.h5",compile = False)  # update path if needed

# ---------------- Classes ----------------
class_names = ["Early_Blight", "Healthy", "Late_Blight"]

# ---------------- Flask Setup ----------------
app = Flask(__name__)

# Folder to temporarily save uploaded images
UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ----------- Normalization (Equation 1 from paper) -----------
def normalize_image(img, nmin=0, nmax=255):
    img = img.astype(np.float32)
    min_val = np.min(img)
    max_val = np.max(img)
    if max_val - min_val == 0:
        return np.full_like(img, nmin, dtype=np.uint8)
    
    norm = (img - min_val) * ((nmax - nmin) / (max_val - min_val)) + nmin
    return norm.astype(np.uint8)


# ----------- CLAHE (applied on L channel in LAB space) -----------
def apply_clahe(img, clip_limit=2.0, tile_grid_size=(8, 8)):
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    cl = clahe.apply(l)
    merged = cv2.merge((cl, a, b))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)


# ----------- Resize to 256×256 with Nearest Neighbor -----------
def resize_image(img, size=(256, 256)):
    return cv2.resize(img, size, interpolation=cv2.INTER_NEAREST)


# ----------- Preprocessing Pipeline -----------
def preprocess_for_inference(img_path):
    img = cv2.imread(img_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    img = normalize_image(img, 0, 255)
    img = apply_clahe(img)
    img = resize_image(img, size=(256, 256))

    img = img.astype(np.float32) / 255.0  # scale for model inference
    img = np.expand_dims(img, axis=0)     # add batch dimension
    return img


# ----------- Endpoint for image upload -----------
@app.route("/upload", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    # Strip any client-side path and do a simple sanitize
    filename = os.path.basename(file.filename)           # remove path components
    filename = filename.replace(" ", "_")                # basic sanitization
    if filename == "" or filename.startswith("."):
        return jsonify({"error": "Invalid filename"}), 400

    name, ext = os.path.splitext(filename)
    if ext == "":
        ext = ".jpg"  # fallback extension if none provided

    unique_filename = f"{name}_{uuid.uuid4().hex}{ext}"
    img_path = os.path.join(UPLOAD_FOLDER, unique_filename)

    try:
        # Save the uploaded image temporarily
        file.save(img_path)

        # Process and run inference
        processed_img = preprocess_for_inference(img_path)
        pred_probs = model.predict(processed_img)
        pred_class = np.argmax(pred_probs, axis=1)[0]

        # Print results on server console
        print(f"Predicted class: {class_names[pred_class]}")
        print(f"Class probabilities: {pred_probs[0]}")

        # Prepare JSON response for Android app
        response = {
            "predicted_class": class_names[pred_class],
            "probabilities": pred_probs[0].tolist()
        }

        return jsonify(response), 200
    finally:
        # Clean up temporary file
        try:
            if os.path.exists(img_path):
                os.remove(img_path)
        except Exception:
            pass


# ----------- Start server on a specific port -----------
if __name__ == "__main__":
    # Example: http://<your_ip>:5001/upload
    app.run(host="0.0.0.0", port=5001, debug=True)
