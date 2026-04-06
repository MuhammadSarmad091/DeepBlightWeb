# Troubleshooting Guide

## Common Issues and Solutions

### 1. Model Loading Errors

#### Problem: `FileNotFoundError: Cannot find model file`
**Solution:**
- Ensure model files exist in `models/pretrained_models/`
- Check model paths in `.env` file:
  ```env
  LEAF_MODEL_PATH=./models/pretrained_models/DenseNet5d256New.h5
  PEST_CLASSIFIER_PATH=./models/pretrained_models/DenseNet201_PotatoPest.h5
  ```
- Verify paths are relative to `app.py` location

#### Problem: `Model weights not found`
**Solution:**
- Ensure model files are complete (220 MB total)
- Check file integrity with:
  ```bash
  ls -lh models/pretrained_models/
  ```

### 2. MongoDB Connection Issues

#### Problem: `Connection refused`
**Solution:**
- Verify MongoDB URI in `.env`:
  ```env
  MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/
  ```
- Check internet connectivity
- Verify IP whitelist in MongoDB Atlas
- Test connection:
  ```bash
  mongosh "mongodb+srv://user:password@cluster.mongodb.net/"
  ```

#### Problem: `Authentication failed`
**Solution:**
- Check username and password in MongoDB URI
- Ensure special characters are URL-encoded
- Verify database user has correct permissions

### 3. AWS S3 Issues

#### Problem: `Access Denied` when uploading files
**Solution:**
- Verify AWS credentials in `.env`:
  ```env
  AWS_ACCESS_KEY_ID=your_key
  AWS_SECRET_ACCESS_KEY=your_secret
  ```
- Check S3 bucket permissions (allow s3:PutObject)
- Ensure bucket name is correct:
  ```env
  AWS_S3_BUCKET=your_bucket_name
  ```

#### Problem: `Unable to generate presigned URL`
**Solution:**
- Check S3 file exists
- Verify AWS credentials have s3:GetObject permission
- Check URL expiration time is reasonable

### 4. Email Issues

#### Problem: `SMTP connection failed`
**Solution:**
- Verify email configuration in `.env`:
  ```env
  MAIL_SERVER=smtp.gmail.com
  MAIL_PORT=587
  MAIL_USE_TLS=True
  ```
- For Gmail, use App Password (not regular password)
- Generate App Password:
  1. Go to Google Account settings
  2. Security > App passwords
  3. Use generated password as `MAIL_PASSWORD`

#### Problem: `Authentication failed`
**Solution:**
- Verify correct email and password
- Check SMTP server settings
- Enable "Less secure apps" for Gmail (or use App Password)

### 5. JWT Token Issues

#### Problem: `Invalid token` or `Expired token`
**Solution:**
- Verify SECRET_KEY in `.env` is set:
  ```env
  SECRET_KEY=your_secret_key_here
  ```
- Check token expiration time in auth routes
- Token validity is 24 hours by default

#### Problem: `Unauthorized: Missing token`
**Solution:**
- Add Authorization header to request:
  ```
  Authorization: Bearer <jwt_token>
  ```
- Get token from login endpoint first

### 6. Docker Issues

#### Problem: `Container fails to start`
**Solution:**
- Check logs:
  ```bash
  docker logs <container_name>
  ```
- Verify `.env` file exists in project root
- Check Docker configuration:
  ```bash
  docker ps -a
  ```

#### Problem: `Port already in use`
**Solution:**
- Change port in `docker-compose.yml`:
  ```yaml
  ports:
    - "5001:5000"  # Change host port to 5001
  ```
- Or kill the process using the port

### 7. Model Prediction Issues

#### Problem: `Low confidence predictions`
**Solution:**
- Check image quality (clear, well-lit)
- Image should be 224x224 pixels
- Ensure image is not corrupted
- Try different image

#### Problem: `Incorrect predictions`
**Solution:**
- Model is trained on specific plant diseases
- Data might not match training data
- Consider retraining with new data

### 8. API Request Issues

#### Problem: `400 Bad Request`
**Solution:**
- Check request body format
- Verify JSON structure
- Ensure all required fields are present
- Check Content-Type header: `application/json`

#### Problem: `413 Payload Too Large`
**Solution:**
- Image files too large
- Resize images before upload
- Use compression

#### Problem: `429 Too Many Requests`
**Solution:**
- Implement rate limiting
- Add delays between requests
- Check if API has rate limit

### 9. File Upload Issues

#### Problem: `File not found after upload`
**Solution:**
- Check file permissions
- Verify upload directory exists
- Check S3 bucket configuration
- Verify file path in database

#### Problem: `Unsupported file format`
**Solution:**
- Only JPEG, PNG supported
- Check file extension
- Use proper MIME type: `image/jpeg`, `image/png`

### 10. Development Server Issues

#### Problem: `Cannot run Flask app`
**Solution:**
- Ensure Python virtual environment is activated:
  ```bash
  # Windows
  venv\Scripts\activate
  
  # Linux/Mac
  source venv/bin/activate
  ```
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```

#### Problem: `ImportError: No module named 'flask'`
**Solution:**
- Activate virtual environment
- Install packages:
  ```bash
  pip install -r requirements.txt
  ```

#### Problem: `ModuleNotFoundError`
**Solution:**
- Check imports use new module paths:
  ```python
  # Correct
  from utils.DLModelfunctions import preprocess_for_inference
  from ml_services.prediction import load_models
  
  # Incorrect (old)
  from DLModelfunctions import preprocess_for_inference
  from prediction import load_models
  ```

## General Debugging Steps

1. **Check Logs**
   ```bash
   # Docker
   docker logs <container_id>
   
   # Flask
   FLASK_ENV=development FLASK_DEBUG=1 flask run
   ```

2. **Verify Configuration**
   - Check `.env` file exists in root directory
   - Verify all required variables are set
   - No syntax errors in configuration files

3. **Test Components Individually**
   ```bash
   # Test MongoDB connection
   mongosh "mongodb_uri"
   
   # Test AWS S3
   aws s3 ls
   
   # Test Flask app
   python -c "from app import app; print('Flask OK')"
   ```

4. **Check Network**
   - Internet connectivity
   - Firewall rules
   - VPN if required
   - Proxy settings

5. **Review Recent Changes**
   - Check version history in `docs/`
   - Ensure imports are correct for new structure
   - Verify configuration updates

## Getting Help

- Check relevant documentation in `docs/`
- Review error messages carefully
- Check logs with `-v` or `--debug` flags
- Test with minimal reproducible example

---

Last Updated: March 30, 2026
