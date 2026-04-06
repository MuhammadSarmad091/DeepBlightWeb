import os
import requests
from datetime import datetime

# Use raw string or forward slashes to avoid escape-sequence issues
img_path = r".\testImg\zeller_insect.jpg"   # or: "./testImg/EB.JPG"

if not os.path.exists(img_path):
    print("File not found:", os.path.abspath(img_path))
    raise SystemExit(1)

# First, login to get token
login_url = "http://localhost:5000/auth/login"
login_data = {"email": "i220942@nu.edu.pk", "password": "i220942"}
login_resp = requests.post(login_url, json=login_data)

if login_resp.status_code != 200:
    print("Login failed:", login_resp.text)
    raise SystemExit(1)

token = login_resp.json()["token"]
userid = "6936ac81353d864e673bf72e"

print("Login successful, token obtained.")

# Now, upload image
upload_url = "http://localhost:5000/insectscan/upload"
headers = {"Authorization": f"Bearer {token}"}
with open(img_path, "rb") as f:
    files = {"image": f}
    data = {"userid": userid}
    upload_resp = requests.post(upload_url, headers=headers, files=files, data=data)

print("Upload response:", upload_resp.status_code)
print(upload_resp.text)

if upload_resp.status_code != 200:
    print("Upload failed")
    raise SystemExit(1)

upload_data = upload_resp.json()
predicted_class = upload_data["predicted_class"]
confidence_score = upload_data["confidence_score"]
next_scan_id = upload_data["next_scan_id"]

print(f"Predicted: {predicted_class}, Confidence: {confidence_score}, Next ID: {next_scan_id}")

# Now, save the scan
save_url = "http://localhost:5000/insectscan/save"
scan_datetime = datetime.now().isoformat()
with open(img_path, "rb") as f:
    files = {"image": f}
    data = {
        "scan_id": next_scan_id,
        "datetime": scan_datetime,
        "predicted_class": predicted_class,
        "confidence_score": str(confidence_score)
    }
    save_resp = requests.post(save_url, headers=headers, files=files, data=data)

print("Save response:", save_resp.status_code)
print(save_resp.text)