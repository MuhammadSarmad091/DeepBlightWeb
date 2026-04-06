# S3 Integration Reference Guide

## Overview

The application now supports storing leaf scan images in AWS S3 instead of local filesystem. This guide explains how the integration works and how to use it.

## Architecture Diagram

```
User App (Mobile/Web)
        ↓
  Flask API (Backend)
        ↓
   ┌────┴────┐
   ↓         ↓
 Local      S3
Storage    Bucket
(Dev)     (Prod)
```

## How It Works

### Local Storage (Development)
```
User uploads image → Flask receives file → Saved to ./storage/user_id/filename.ext → DB stores path
```

### S3 Storage (Production)
```
User uploads image → Flask receives file → Uploaded to S3 → DB stores S3 URL → Image retrievable
```

## Key Functions in `s3_utils.py`

### 1. Upload File Object to S3
```python
upload_file_obj_to_s3(file_obj, s3_key)
```
**Used in**: `/leafscan/save` endpoint
**What it does**: Takes a file object (from Flask request) and uploads to S3
**Returns**: (success: bool, s3_url: str, error: str)

**Example**:
```python
success, url, error = upload_file_obj_to_s3(file, "leafscans/user123/abc.jpg")
# Returns: (True, "s3://bucket/leafscans/user123/abc.jpg", None)
```

### 2. Delete File from S3
```python
delete_file_from_s3(s3_key)
```
**Used in**: `/leafscan/delete` endpoint
**What it does**: Deletes a file from S3 bucket
**Returns**: (success: bool, error: str)

**Example**:
```python
success, error = delete_file_from_s3("leafscans/user123/abc.jpg")
# Returns: (True, None)
```

### 3. Get File as Bytes
```python
get_file_from_s3_as_bytes(s3_key)
```
**Used in**: `/leafscan/getimages` endpoint
**What it does**: Downloads file from S3 as raw bytes (good for streaming)
**Returns**: (success: bool, file_bytes: bytes, error: str)

**Example**:
```python
success, file_bytes, error = get_file_from_s3_as_bytes("leafscans/user123/abc.jpg")
# Returns: (True, b'\xff\xd8\xff...', None)
```

### 4. Check if File Exists
```python
s3_file_exists(s3_key)
```
**Used in**: All GET endpoints to verify file availability
**What it does**: Checks if file exists in S3 without downloading
**Returns**: bool

**Example**:
```python
exists = s3_file_exists("leafscans/user123/abc.jpg")
# Returns: True
```

### 5. List Files in S3
```python
list_files_in_s3(prefix)
```
**Used in**: Future bulk operations
**What it does**: Lists all files with given prefix
**Returns**: (success: bool, files: list, error: str)

**Example**:
```python
success, files, error = list_files_in_s3("leafscans/user123/")
# Returns: (True, ["leafscans/user123/abc.jpg", "leafscans/user123/def.jpg"], None)
```

### 6. Generate Pre-signed URL
```python
generate_presigned_url(s3_key, expiration=3600)
```
**Used in**: Future feature for direct downloads
**What it does**: Creates temporary downloadable URL (1 hour default)
**Returns**: (success: bool, url: str, error: str)

**Example**:
```python
success, url, error = generate_presigned_url("leafscans/user123/abc.jpg")
# Returns: (True, "https://s3.amazonaws.com/...?expires=1234567890", None)
```

## Integration Points in Code

### Modified Endpoints

#### 1. `/leafscan/save` (POST)
**Before**: Saved to local `storage/` folder
**After**: Uploads to S3 bucket

```python
# Old
img_path = os.path.join(user_dir, unique_filename)
image_url = os.path.join(STORAGE_BASE_PATH, user_id, unique_filename)
file.save(img_path)

# New
s3_key = f"leafscans/{user_id}/{unique_filename}"
success, image_url, error = upload_file_obj_to_s3(file, s3_key)
# image_url = "s3://bucket-name/leafscans/user-id/file.jpg"
```

#### 2. `/leafscan/delete` (DELETE)
**Before**: Deleted local file
**After**: Deletes S3 object

```python
# Old
os.remove(image_url)

# New
s3_key = image_url.split("s3://", 1)[1].split("/", 1)[1]
delete_file_from_s3(s3_key)
```

#### 3. `/leafscan/getimages` (POST)
**Before**: Read local files
**After**: Downloads from S3

```python
# Old
with open(path, 'rb') as f:
    image_bytes = f.read()

# New
success, file_bytes, error = get_file_from_s3_as_bytes(s3_key)
```

#### 4. All GET Endpoints
**Before**: Used `os.path.exists()`
**After**: Uses `check_image_exists()` helper

```python
# New helper function
def check_image_exists(image_url: str) -> bool:
    if USE_S3 and image_url.startswith("s3://"):
        s3_key = image_url.split("s3://", 1)[1].split("/", 1)[1]
        return s3_file_exists(s3_key)
    else:
        return os.path.exists(image_url)
```

## Configuration

### Environment Variables

```env
# Enable/Disable S3
USE_S3=True              # True for S3, False for local storage

# AWS Credentials
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# S3 Bucket Configuration
AWS_S3_BUCKET_NAME=deepblight-leafscans
AWS_REGION=us-east-1
```

### Switching Between Storage Methods

**To use S3**:
```env
USE_S3=True
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=deepblight-leafscans
AWS_REGION=us-east-1
```

**To use Local Storage**:
```env
USE_S3=False
```

## Data Flow Examples

### Upload Image to Save Scan

```
1. User sends image to /leafscan/save
2. Request reaches Flask
3. File object extracted: file = request.files["image"]
4. Generate S3 key: "leafscans/{user_id}/{uuid}.ext"
5. Call: upload_file_obj_to_s3(file, s3_key)
6. S3 receives and stores file
7. S3 URL returned: "s3://bucket/leafscans/user_id/uuid.ext"
8. URL stored in MongoDB
9. Response sent to user
```

### Retrieve Images

```
1. User requests /leafscan/getimages
2. Request contains paths: ["s3://bucket/leafscans/user_id/file1.jpg", ...]
3. For each path:
   a. Extract S3 key from URL
   b. Call: get_file_from_s3_as_bytes(s3_key)
   c. Encode as Base64
   d. Add to response
4. Response sent with Base64 encoded images
```

### Delete Scan

```
1. User sends DELETE to /leafscan/delete
2. Scan found in MongoDB
3. Image URL extracted
4. Parse S3 URL to get key
5. Call: delete_file_from_s3(s3_key)
6. S3 deletes object
7. MongoDB document deleted
8. Response sent to user
```

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `s3: InvalidAccessKeyId` | Wrong AWS credentials | Check ACCESS_KEY_ID |
| `s3: InvalidSecretAccessKey` | Wrong secret key | Check SECRET_ACCESS_KEY |
| `An error occurred (NoSuchBucket) operation` | Bucket name wrong or doesn't exist | Create bucket, verify name |
| `An error occurred (AccessDenied)` | IAM user lacks permissions | Add S3 permissions to IAM user |
| `File not found in S3` | File was deleted or never uploaded | Check S3 console, verify key |
| `Request to S3 timed out` | Network issue or large file | Check network, retry later |

### Error Responses

The API returns structured error responses:

```json
{
  "error": "Failed to upload image to S3: Access Denied"
}
```

Check CloudWatch logs for detailed error info.

## Performance Considerations

### Upload Performance
- **Small files** (<5MB): Direct upload ~1 second
- **Large files** (>100MB): Consider multipart upload (automated by boto3)
- **Network**: Affects speed - usually 1-10 seconds

### Download Performance
- **Base64 encoding**: Adds ~33% to response size
- **Network**: Depends on internet speed
- **S3 region**: Use same region as compute for faster access

### Cost Optimization
- **Storage**: $0.023/GB/month
- **API Calls**: ~$0.0004 per 10,000 requests
- **Data Transfer**: $0.09/GB outbound
- **Lifecycle policies**: Move old scans to Glacier (cheaper)

## Security

### Access Control
- Images stored with S3 bucket ACLs
- Bucket not publicly accessible
- Only authenticated users can access via API

### Data Protection
- S3 encryption at rest (optional but recommended)
- HTTPS for all transfers
- No credentials in logs or error messages

### Audit Trail
- S3 has built-in versioning
- CloudTrail logs all API calls
- MongoDB tracks user associations

## Migration Guide

### Local to S3 Migration

If migrating existing local images to S3:

```python
import os
from s3_utils import upload_file_to_s3

# Find all local images
for root, dirs, files in os.walk("./storage"):
    for file in files:
        local_path = os.path.join(root, file)
        # Extract user_id from path
        user_id = root.split("/")[-1]
        s3_key = f"leafscans/{user_id}/{file}"
        
        # Upload to S3
        success, s3_url, error = upload_file_to_s3(local_path, s3_key)
        
        if success:
            # Update MongoDB
            db.leafscan.update_one(
                {"image_url": local_path},
                {"$set": {"image_url": s3_url}}
            )
```

## Testing S3 Integration

### Manual Testing

```bash
# Test S3 connectivity
curl -X GET http://localhost:5000/

# Register and login
# (see DOCKER_QUICKSTART.md for full test)

# Upload image
curl -X POST http://localhost:5000/leafscan/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "userid=USER_ID" \
  -F "image=@test_image.jpg"

# Get images
curl -X POST http://localhost:5000/leafscan/getimages \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paths": ["s3://bucket/leafscans/user_id/file.jpg"]}'
```

## Troubleshooting

### S3 Connection Issues

**Symptom**: "Unable to locate credentials"
```
Solution:
1. Check AWS_ACCESS_KEY_ID in .env
2. Check AWS_SECRET_ACCESS_KEY in .env
3. Verify IAM user has S3 permissions
4. Restart container
```

**Symptom**: "NoSuchBucket"
```
Solution:
1. Verify bucket exists in AWS console
2. Check AWS_S3_BUCKET_NAME spelling
3. Check AWS_REGION matches bucket region
```

**Symptom**: "AccessDenied"
```
Solution:
1. Verify IAM user has AmazonS3FullAccess
2. Check bucket policy allows the IAM user
3. Verify CORS configuration if cross-origin
```

### File Not Found Issues

**Symptom**: Image saved but not found later
```
Solution:
1. Verify image_url in MongoDB is correct format
2. Check S3 bucket for file in AWS console
3. Check CloudWatch logs for errors
4. Verify USE_S3=True matches actual storage used
```

## Future Enhancements

Potential improvements:

1. **Multipart Upload**: For files >100MB
2. **Pre-signed URLs**: Direct downloads without API
3. **CloudFront CDN**: Faster global delivery
4. **Image Optimization**: Compress before upload
5. **Batch Operations**: Upload/download multiple files
6. **Lifecycle Management**: Auto-archive old scans
7. **S3 Select**: Query images without downloading
8. **Encryption**: Server-side encryption with KMS

## References

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Boto3 Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/BestPractices.html)
- [IAM User Guide](https://docs.aws.amazon.com/iam/)

---

**For more help, see**:
- `AWS_DEPLOYMENT_GUIDE.md` - AWS setup
- `DOCKER_QUICKSTART.md` - Local testing
- `SETUP_SUMMARY.md` - Overview
