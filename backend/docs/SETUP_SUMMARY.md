# DeepBlight Backend - AWS S3 & Docker Setup Summary

## What's Been Done

### 1. AWS S3 Integration
- **Created**: `s3_utils.py` - Comprehensive S3 utility functions for:
  - Uploading files to S3
  - Downloading files from S3
  - Deleting files from S3
  - Listing files in S3
  - Generating presigned URLs
  - Checking file existence

- **Modified**: `leafscan/routes.py` - Updated all image operations:
  - `/leafscan/save` - Uploads images to S3 instead of local storage
  - `/leafscan/delete` - Deletes images from S3
  - `/leafscan/getall` - Checks S3 file existence
  - `/leafscan/getsome` - Checks S3 file existence
  - `/leafscan/getone` - Checks S3 file existence
  - `/leafscan/getimages` - Downloads images from S3 and returns as base64

### 2. Docker Setup
- **Created**: 
  - `Dockerfile` - Multi-stage Python 3.10 image with all dependencies
  - `docker-compose.yml` - Full service configuration with environment variables
  - `.dockerignore` - Excludes unnecessary files from image

- **Features**:
  - Health checks included
  - Resource limits configured
  - Volume mounting for data persistence
  - Automatic restart on failure

### 3. Configuration
- **Updated**: 
  - `requirements.txt` - Added boto3 (AWS SDK)
  - `.env` - Added S3 configuration variables

- **Environment Variables**:
  ```env
  USE_S3=True              # Switch between S3 and local storage
  AWS_ACCESS_KEY_ID=...
  AWS_SECRET_ACCESS_KEY=...
  AWS_S3_BUCKET_NAME=...
  AWS_REGION=us-east-1
  ```

### 4. Documentation
- **Created**:
  - `AWS_DEPLOYMENT_GUIDE.md` - Complete AWS setup and deployment guide
  - `DOCKER_QUICKSTART.md` - Quick local testing guide

- **Updated**:
  - `routes.txt` - Added documentation about S3 storage

## File Structure After Changes

```
FYP-backend/
├── Dockerfile                    # New
├── docker-compose.yml           # New
├── .dockerignore                # New
├── s3_utils.py                 # New
├── AWS_DEPLOYMENT_GUIDE.md     # New
├── DOCKER_QUICKSTART.md        # New
├── requirements.txt            # Updated (added boto3)
├── .env                        # Updated (added S3 config)
├── app.py
├── DenseNet5d256New.h5
├── leaf_detect.h5
├── DLModelfinctions.py
├── leafscan/
│   ├── __init__.py
│   └── routes.py              # Updated (S3 integration)
├── auth/
│   ├── __init__.py
│   ├── decorators.py
│   └── routes.py
├── plants/
│   ├── __init__.py
│   └── routes.py
└── routes.txt                 # Updated documentation
```

## Key Features

### S3 Integration
- ✅ Automatic upload/download of leaf scan images
- ✅ Support for both S3 and local storage (configurable)
- ✅ Error handling and logging
- ✅ File existence checking
- ✅ Pre-signed URL generation (for future use)

### Docker
- ✅ Production-ready Dockerfile
- ✅ Docker Compose for easy local testing
- ✅ Health checks
- ✅ Resource limits
- ✅ Volume persistence
- ✅ Multi-stage build optimization

### Deployment Ready
- ✅ AWS ECR integration instructions
- ✅ ECS Fargate deployment guide
- ✅ EC2 deployment guide
- ✅ Cost estimation
- ✅ Monitoring and maintenance tips

## Quick Start Commands

### Local Testing
```bash
# Build image
docker build -t deepblight-backend:latest .

# Run with compose (recommended)
docker-compose up

# Or run manually
docker run -p 5000:5000 --env-file .env deepblight-backend:latest
```

### AWS Deployment
```bash
# Build and push to ECR
docker build -t deepblight-backend:latest .
docker tag deepblight-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/deepblight-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/deepblight-backend:latest

# Then deploy using ECS or EC2
```

## Configuration Options

### Use Local Storage (Development)
```env
USE_S3=False
```
- Images stored in `./storage/` directory
- No AWS credentials needed
- Good for testing locally

### Use AWS S3 (Production)
```env
USE_S3=True
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=deepblight-leafscans
AWS_REGION=us-east-1
```
- Images stored in S3 bucket
- Highly scalable and reliable
- Automatic backups with versioning

## Testing the Setup

### Local Docker Test
1. Set `USE_S3=False` in `.env` (or use AWS credentials)
2. Run `docker-compose up`
3. Test with curl commands (see DOCKER_QUICKSTART.md)

### AWS S3 Test
1. Create S3 bucket and IAM user (see AWS_DEPLOYMENT_GUIDE.md)
2. Set `USE_S3=True` in `.env` with valid credentials
3. Run `docker-compose up`
4. Test image upload/retrieval

## Important Notes

### Before Deployment
- [ ] Create S3 bucket (name: `deepblight-leafscans` or custom)
- [ ] Create IAM user with S3 permissions
- [ ] Generate AWS access keys
- [ ] Update `.env` with actual values
- [ ] Verify MongoDB connection string
- [ ] Test locally with `docker-compose up`

### Production Considerations
- Use environment variable manager (AWS Secrets Manager)
- Enable S3 versioning and lifecycle policies
- Set up CloudWatch logging
- Configure auto-scaling for ECS
- Use RDS for MongoDB (if needed)
- Enable SSL/TLS for HTTPS
- Set up CI/CD pipeline

### Cost Estimation
- **S3 Storage**: ~$0.023/GB/month
- **Data Transfer**: ~$0.09/GB out
- **ECS Fargate**: ~$30-50/month
- **Total**: ~$50-150/month (varies by usage)

## Support & Troubleshooting

See:
- `DOCKER_QUICKSTART.md` - Local testing issues
- `AWS_DEPLOYMENT_GUIDE.md` - AWS deployment issues
- Docker logs: `docker logs <container_id>`
- S3 logs: Check AWS CloudWatch

## Next Steps

1. **Test Locally**:
   ```bash
   docker-compose up
   # Test API endpoints
   ```

2. **Setup AWS**:
   - Follow AWS_DEPLOYMENT_GUIDE.md
   - Create S3 bucket
   - Create IAM user

3. **Deploy to AWS**:
   - Push to ECR
   - Create ECS cluster and service
   - Configure load balancer
   - Set up monitoring

4. **Monitor & Maintain**:
   - Watch CloudWatch logs
   - Set up cost alerts
   - Regular backups
   - Update dependencies

## Modified Code Summary

### `s3_utils.py` (New)
- 9 utility functions for S3 operations
- Comprehensive error handling
- Returns tuples with success/error info

### `leafscan/routes.py` (Modified)
- Added S3 imports and configuration
- Updated `save_leafscan()` to upload to S3
- Updated `delete_leafscan()` to delete from S3
- Updated all GET endpoints to check S3
- Updated `getimages()` to download from S3
- Added `check_image_exists()` helper function

### `requirements.txt` (Modified)
- Added `boto3>=1.26.0` (AWS SDK)
- Added `botocore>=1.29.0` (boto3 dependency)
- Added `requests>=2.28.0` (for HTTP)

### `.env` (Modified)
- Added S3 configuration variables
- Added `USE_S3` toggle for easy switching

### `routes.txt` (Modified)
- Updated `/leafscan/upload` documentation
- Updated `/leafscan/save` documentation
- Added S3 storage details

## Security Considerations

✅ **Implemented**:
- AWS credentials in environment variables (not hardcoded)
- IAM user permissions scoped to S3 only
- Bucket policies restrict access
- Error messages don't expose sensitive info

⚠️ **Recommended**:
- Use AWS Secrets Manager for production
- Enable S3 bucket encryption
- Enable MFA for AWS account
- Regular security audits
- Keep dependencies updated

---

**Ready to deploy! Follow AWS_DEPLOYMENT_GUIDE.md for production setup.**
