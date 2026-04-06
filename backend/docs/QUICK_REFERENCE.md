# Quick Reference Card

## Essential Commands

### Docker
```bash
# Build image
docker build -t deepblight-backend:latest .

# Run with compose
docker-compose up

# Run manually
docker run -p 5000:5000 --env-file .env deepblight-backend:latest

# Stop containers
docker-compose down

# View logs
docker logs <container_id>

# Access container
docker exec -it <container_id> bash
```

### AWS CLI
```bash
# Create ECR repository
aws ecr create-repository --repository-name deepblight-backend --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/deepblight-backend:latest
```

### Testing
```bash
# Health check
curl http://localhost:5000/

# Get token
TOKEN=$(curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r .token)

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/profile
```

## Environment Variables

### Required
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=deepblight
SECRET_KEY=your_secret_key
```

### S3 (if USE_S3=True)
```env
USE_S3=True
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=deepblight-leafscans
AWS_REGION=us-east-1
```

### Email
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

## File Locations

| File | Purpose |
|------|---------|
| `Dockerfile` | Docker image definition |
| `docker-compose.yml` | Local development setup |
| `.dockerignore` | Exclude files from image |
| `s3_utils.py` | S3 utility functions |
| `leafscan/routes.py` | Leafscan endpoints (modified) |
| `.env` | Configuration (modified) |
| `requirements.txt` | Python dependencies (modified) |

## API Endpoints

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/verify` - Verify email
- `POST /auth/login` - Login user

### Profile
- `GET /profile` - Get user profile

### Leafscan
- `POST /leafscan/upload` - Upload & predict
- `POST /leafscan/save` - Save scan
- `DELETE /leafscan/delete` - Delete scan
- `GET /leafscan/getall` - Get all scans
- `POST /leafscan/getsome` - Get paginated scans
- `POST /leafscan/getone` - Get single scan
- `POST /leafscan/getimages` - Get scan images

### Plants
- `GET /plants/get` - List plants
- `GET /plants/search` - Search plants
- `GET /plants/<id>` - Get plant details

## Storage Paths

### Local (USE_S3=False)
```
storage/
├── user_id_1/
│   ├── uuid1.jpg
│   └── uuid2.jpg
└── user_id_2/
    └── uuid3.jpg
```

### S3 (USE_S3=True)
```
s3://deepblight-leafscans/
└── leafscans/
    ├── user_id_1/
    │   ├── uuid1.jpg
    │   └── uuid2.jpg
    └── user_id_2/
        └── uuid3.jpg
```

## Database Structure

### Users Collection
```json
{
  "_id": ObjectId,
  "username": "string",
  "email": "string",
  "password": "hashed",
  "created_at": "datetime"
}
```

### Leafscan Collection
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "scan_id": "string",
  "image_url": "s3://bucket/leafscans/.../file.jpg",
  "predicted_class": "string",
  "confidence_score": 0.0,
  "datetime": "datetime",
  "created_at": "datetime"
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5000 in use | `lsof -i :5000` then `kill -9 <PID>` |
| Docker build fails | Check model files exist, update Dockerfile path |
| Container won't start | `docker logs <id>` to see error |
| S3 access denied | Check IAM permissions, AWS credentials |
| No MongoDB connection | Verify MONGO_URI, whitelist IP in Atlas |
| Email not sending | Check MAIL_PASSWORD is app password |

## Documentation Files

| File | Content |
|------|---------|
| `SETUP_SUMMARY.md` | Overview of changes |
| `AWS_DEPLOYMENT_GUIDE.md` | Complete AWS setup |
| `DOCKER_QUICKSTART.md` | Local Docker testing |
| `S3_INTEGRATION_GUIDE.md` | S3 technical details |
| `DEPLOYMENT_CHECKLIST.md` | Pre-deployment checklist |
| `FILES_CREATED_MODIFIED.md` | All changes summary |

## AWS S3 Setup (Quick)

1. Create bucket: `deepblight-leafscans`
2. Create IAM user: `deepblight-backend`
3. Attach policy: `AmazonS3FullAccess`
4. Generate access keys
5. Update `.env`:
   ```env
   USE_S3=True
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   ```
6. Test with `docker-compose up`

## Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| S3 Storage (100GB) | ~$2.30 |
| Data Transfer (100GB out) | ~$9.00 |
| ECS Fargate | ~$40.00 |
| MongoDB Atlas | ~$50.00 |
| **Total** | **~$101.30** |

## Performance Tips

1. **Use S3** in same region as compute
2. **Enable versioning** for recovery
3. **Set lifecycle policies** to move old to Glacier
4. **Use CloudFront** for CDN
5. **Monitor CloudWatch** for errors
6. **Set up cost alerts** in AWS

## Security Checklist

- [ ] Credentials in `.env` (not code)
- [ ] `.env` in `.gitignore`
- [ ] S3 bucket not public
- [ ] IAM user has minimal permissions
- [ ] MFA enabled on AWS account
- [ ] Rotate access keys every 90 days

## Deployment Checklist

- [ ] All model files present
- [ ] Docker build succeeds
- [ ] Local test passes
- [ ] S3 bucket created
- [ ] IAM user created
- [ ] `.env` configured
- [ ] Database connected
- [ ] Email working
- [ ] Ready for AWS deployment

## Useful Links

- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)
- [Boto3 Docs](https://boto3.amazonaws.com/)
- [Docker Docs](https://docs.docker.com/)
- [Flask Docs](https://flask.palletsprojects.com/)
- [MongoDB Docs](https://docs.mongodb.com/)

## Support Resources

- **Questions about S3?** → Read `S3_INTEGRATION_GUIDE.md`
- **Docker issues?** → Read `DOCKER_QUICKSTART.md`
- **AWS setup?** → Read `AWS_DEPLOYMENT_GUIDE.md`
- **Before deploying?** → Use `DEPLOYMENT_CHECKLIST.md`
- **Code changes?** → Check `FILES_CREATED_MODIFIED.md`

---

**Last Updated**: December 2025
**Version**: 1.0 - S3 & Docker Integration
