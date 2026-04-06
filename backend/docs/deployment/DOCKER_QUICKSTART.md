# Quick Start: Local Testing with Docker

This guide helps you quickly test the Docker setup locally before deploying to AWS.

## Prerequisites
- Docker installed on your machine
- AWS S3 credentials (or use local storage by setting `USE_S3=False`)
- All required files in the project directory

## Step 1: Setup Environment File

Copy and customize the `.env` file:

```bash
# For LOCAL TESTING (using local storage, not S3):
USE_S3=False
AWS_ACCESS_KEY_ID=not_needed_for_local
AWS_SECRET_ACCESS_KEY=not_needed_for_local
AWS_S3_BUCKET_NAME=not_needed_for_local
AWS_REGION=us-east-1

# For AWS S3 (fill in your actual credentials):
USE_S3=True
AWS_ACCESS_KEY_ID=your_actual_access_key
AWS_SECRET_ACCESS_KEY=your_actual_secret_key
AWS_S3_BUCKET_NAME=deepblight-leafscans
AWS_REGION=us-east-1
```

## Step 2: Build Docker Image

```bash
cd /path/to/FYP-backend
docker build -t deepblight-backend:latest .
```

Expected output: `Successfully tagged deepblight-backend:latest`

## Step 3: Run Container Locally

### Option A: Using docker-compose (Recommended)

```bash
docker-compose up
```

The app will start and be accessible at `http://localhost:5000`

To stop: `Ctrl+C`
To remove containers: `docker-compose down`

### Option B: Using docker run (Manual)

```bash
docker run -d \
  --name deepblight \
  -p 5000:5000 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/storage:/app/storage \
  deepblight-backend:latest
```

To view logs:
```bash
docker logs -f deepblight
```

To stop:
```bash
docker stop deepblight
docker rm deepblight
```

## Step 4: Test the API

### Health Check
```bash
curl http://localhost:5000/
# Expected: {"message": "Flask Auth API running with verification"}
```

### Register User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Verify Email
```bash
# Check your email for verification code, then:
curl -X POST http://localhost:5000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"  # Use code from email
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "admin"
  }'
# Save the returned token
```

### Get Profile
```bash
curl -X GET http://localhost:5000/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Upload & Predict
```bash
curl -X POST http://localhost:5000/leafscan/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "userid=YOUR_USER_ID" \
  -F "image=@/path/to/test/image.jpg"
```

curl -X GET http://localhost:5000/plants/get \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjkzMjg5YzExYzdhMjQyMDJiZDcxOGNkIiwiZXhwIjoxNzY1Mjc0NTk1LCJpYXQiOjE3NjUxODgxOTV9.TCucR290SLtGtQvysyKempaFwbPF1pSC3hMMETiOwIM" \
  -F "userid=693289c11c7a24202bd718cd" \



## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
docker run -p 5001:5000 deepblight-backend:latest
```

### Container Exits Immediately
```bash
# Check logs for errors
docker logs deepblight

# Common issues:
# 1. Missing model files (DenseNet5d256New.h5, leaf_detect.h5)
# 2. MongoDB connection failed (check MONGO_URI)
# 3. Port already in use
```

### S3 Errors
```bash
# If using S3 and getting errors:
# 1. Verify credentials in .env
# 2. Check S3 bucket name is correct
# 3. Verify AWS region is correct
# 4. Check IAM user has S3 permissions
```

### Cannot Connect to MongoDB
```bash
# Make sure MONGO_URI in .env is correct
# For MongoDB Atlas, ensure:
# 1. Whitelist your IP in network access
# 2. Username and password are correct
# 3. Database name is correct
```

## Next Steps: Deploy to AWS

Once local testing works:
1. Follow steps in `AWS_DEPLOYMENT_GUIDE.md`
2. Push image to AWS ECR
3. Deploy using ECS or EC2

## Files Created/Modified

- `Dockerfile` - Container definition
- `docker-compose.yml` - Compose configuration
- `.dockerignore` - Files to exclude from image
- `s3_utils.py` - S3 utility functions
- `requirements.txt` - Added boto3
- `.env` - Updated with S3 configuration
- `leafscan/routes.py` - Updated to use S3
- `routes.txt` - Updated documentation
- `AWS_DEPLOYMENT_GUIDE.md` - Full deployment guide

## Storage Comparison

### Local Storage
- **Pros**: Fast, no AWS costs, good for development
- **Cons**: Lost if container/server deleted, not scalable
- **Use Case**: Development, testing

### AWS S3
- **Pros**: Persistent, scalable, cost-effective, secure
- **Cons**: Requires AWS account, slight latency, ongoing costs
- **Use Case**: Production, long-term storage

## Additional Commands

### Remove image
```bash
docker rmi deepblight-backend:latest
```

### View running containers
```bash
docker ps
```

### View all containers
```bash
docker ps -a
```

### Access container shell (useful for debugging)
```bash
docker exec -it deepblight bash
```

### View resource usage
```bash
docker stats deepblight
```

---

For more detailed information, see `AWS_DEPLOYMENT_GUIDE.md`
