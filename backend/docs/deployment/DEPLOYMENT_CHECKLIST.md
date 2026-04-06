# AWS S3 & Docker Deployment Checklist

Use this checklist to ensure everything is ready before deployment.

## Pre-Deployment Checklist

### Local Setup
- [ ] Clone/download the repository
- [ ] Verify all model files exist:
  - [ ] `DenseNet5d256New.h5` (disease detection model)
  - [ ] `leaf_detect.h5` (leaf detection model)
- [ ] Python 3.10+ installed
- [ ] Docker installed and running
- [ ] Git configured (for version control)

### Dependencies
- [ ] `requirements.txt` contains all packages (including boto3)
- [ ] Virtual environment created (if needed)
- [ ] All dependencies installed: `pip install -r requirements.txt`

### Database
- [ ] MongoDB Atlas account created
- [ ] Database cluster running
- [ ] Database user created with proper permissions
- [ ] Network access configured (whitelist IPs)
- [ ] Connection string tested in `.env` file

### Email Configuration
- [ ] Gmail account ready
- [ ] 2-Factor Authentication enabled
- [ ] App-specific password generated
- [ ] Updated in `.env` as `MAIL_PASSWORD`

### Local Testing
- [ ] Set `USE_S3=False` in `.env` (for initial testing)
- [ ] Docker image builds: `docker build -t deepblight-backend:latest .`
- [ ] Container runs: `docker-compose up`
- [ ] Health check passes: `curl http://localhost:5000/`
- [ ] Test endpoints work (see DOCKER_QUICKSTART.md)

## AWS Setup

### AWS Account
- [ ] AWS account created
- [ ] Billing alerts configured
- [ ] Root account secured with MFA
- [ ] IAM user created for development

### S3 Bucket
- [ ] Bucket created: `deepblight-leafscans` (or custom name)
- [ ] Region selected: `us-east-1` (or your region)
- [ ] Versioning enabled (recommended)
- [ ] Public access blocked
- [ ] CORS configured
- [ ] Lifecycle policies set (optional)

### IAM User for Backend
- [ ] IAM user created: `deepblight-backend`
- [ ] S3 full access policy attached
- [ ] Access keys generated
- [ ] Access Key ID saved securely
- [ ] Secret Access Key saved securely
- [ ] Keys never shared or committed to git

### AWS Credentials
- [ ] Credentials saved securely (not in code!)
- [ ] Added to `.env` file:
  ```env
  AWS_ACCESS_KEY_ID=your_key
  AWS_SECRET_ACCESS_KEY=your_secret
  AWS_S3_BUCKET_NAME=deepblight-leafscans
  AWS_REGION=us-east-1
  ```
- [ ] `.env` added to `.gitignore`

## S3 Configuration Testing

### S3 Connection Test
- [ ] Set `USE_S3=True` in `.env`
- [ ] Added valid AWS credentials
- [ ] Docker image rebuilt
- [ ] Container started: `docker-compose up`
- [ ] S3 connection successful (check logs)
- [ ] Test file upload to S3 (via API)
- [ ] Test file retrieval from S3
- [ ] Test file deletion from S3

## Docker Configuration

### Dockerfile
- [ ] Dockerfile created and reviewed
- [ ] All dependencies included
- [ ] Model files copied
- [ ] Port 5000 exposed
- [ ] Health check configured
- [ ] Image builds without errors

### Docker Compose
- [ ] docker-compose.yml created
- [ ] All environment variables included
- [ ] Volume mounts configured
- [ ] Resource limits set
- [ ] Health check configured
- [ ] Services start without errors

### Docker Image
- [ ] Image built successfully
- [ ] Image size reasonable (~2-3 GB)
- [ ] No dangling layers
- [ ] Scanned for vulnerabilities (optional)

## Documentation
- [ ] README.md updated with new setup
- [ ] AWS_DEPLOYMENT_GUIDE.md reviewed
- [ ] DOCKER_QUICKSTART.md tested
- [ ] SETUP_SUMMARY.md read and understood
- [ ] s3_utils.py functions documented
- [ ] routes.txt updated with S3 info
- [ ] Code comments added for clarity

## AWS ECR Setup (For AWS Deployment)

- [ ] ECR repository created: `deepblight-backend`
- [ ] Repository URI noted
- [ ] ECR access configured
- [ ] Docker credentials configured for ECR

## AWS ECS Setup (For AWS Deployment)

- [ ] ECS cluster created or selected
- [ ] Task definition created
- [ ] Container image specified
- [ ] Memory/CPU allocated
- [ ] Environment variables configured
- [ ] IAM role created for tasks
- [ ] Service created or updated
- [ ] Load balancer configured (if using)
- [ ] Security groups configured

## Environment & Configuration

### Required Environment Variables
- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `DATABASE_NAME` - Database name (default: deepblight)
- [ ] `SECRET_KEY` - Flask secret key
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key
- [ ] `AWS_S3_BUCKET_NAME` - S3 bucket name
- [ ] `AWS_REGION` - AWS region (default: us-east-1)
- [ ] `MAIL_SERVER` - SMTP server (default: smtp.gmail.com)
- [ ] `MAIL_PORT` - SMTP port (default: 587)
- [ ] `MAIL_USE_TLS` - Use TLS (default: True)
- [ ] `MAIL_USERNAME` - Email address
- [ ] `MAIL_PASSWORD` - Email app password
- [ ] `TREFLE_API_TOKEN` - Trefle API token
- [ ] `USE_S3` - Use S3 or local storage (True/False)

### Optional Environment Variables
- [ ] `FLASK_DEBUG` - Debug mode (default: False for production)
- [ ] `FLASK_HOST` - Host address (default: 0.0.0.0)
- [ ] `FLASK_PORT` - Port number (default: 5000)

## Security Checklist

### Code Security
- [ ] No credentials in code or comments
- [ ] `.env` file in `.gitignore`
- [ ] `mongouri.txt` in `.gitignore`
- [ ] Secrets Manager considered for production
- [ ] No test data with real credentials

### AWS Security
- [ ] IAM user has minimal required permissions
- [ ] S3 bucket not publicly accessible
- [ ] MFA enabled on root account
- [ ] Access keys rotated regularly (schedule: every 90 days)
- [ ] CloudTrail enabled for audit logs

### Application Security
- [ ] JWT token expiration set (24 hours)
- [ ] Password hashing implemented
- [ ] Email verification required
- [ ] Input validation present
- [ ] CORS configured appropriately

## Performance Optimization

### Docker
- [ ] Multi-stage build considered
- [ ] Layer caching optimized
- [ ] Image size minimized
- [ ] Health checks configured

### S3
- [ ] Bucket in same region as compute
- [ ] CloudFront CDN considered
- [ ] Lifecycle policies for cost optimization
- [ ] Versioning enabled for recovery

### Database
- [ ] Indexes created on frequently queried fields
- [ ] Connection pooling configured
- [ ] Query performance optimized

## Monitoring & Logging

- [ ] CloudWatch logs enabled
- [ ] Log retention set (e.g., 30 days)
- [ ] Alarms configured for errors
- [ ] Cost alerts configured
- [ ] Health check monitoring enabled
- [ ] Application metrics tracked

## Backup & Disaster Recovery

- [ ] MongoDB backup strategy defined
- [ ] S3 versioning enabled
- [ ] Cross-region replication considered
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined
- [ ] Disaster recovery plan documented

## Production Deployment

### Before Going Live
- [ ] All tests pass
- [ ] All checklist items completed
- [ ] Code reviewed and tested
- [ ] Documentation complete
- [ ] Team notified
- [ ] Rollback plan in place

### First Deployment
- [ ] Deploy to staging first
- [ ] Monitor for 24 hours
- [ ] Test all functionality
- [ ] Check logs for errors
- [ ] Monitor performance metrics

### Post-Deployment
- [ ] Monitor CloudWatch logs
- [ ] Check application metrics
- [ ] Verify S3 uploads/downloads
- [ ] Test user workflows
- [ ] Monitor cost metrics
- [ ] Document any issues

## Maintenance Schedule

### Daily
- [ ] Check CloudWatch logs for errors
- [ ] Monitor application health

### Weekly
- [ ] Review CloudWatch metrics
- [ ] Check cost trends
- [ ] Test backup/recovery (optional)

### Monthly
- [ ] Update dependencies (if patches available)
- [ ] Review security audit
- [ ] Analyze performance metrics
- [ ] Review user feedback

### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Capacity planning
- [ ] Cost optimization review

### Annually
- [ ] AWS Security Best Practices review
- [ ] Disaster recovery drill
- [ ] Infrastructure audit
- [ ] Security training

## Troubleshooting Reference

See these files for help:
- `DOCKER_QUICKSTART.md` - Local Docker issues
- `AWS_DEPLOYMENT_GUIDE.md` - AWS deployment issues
- CloudWatch Logs - Application errors
- Docker logs - Container issues
- S3 console - File/bucket issues

## Sign-off

- [ ] All checklist items completed
- [ ] Ready for deployment
- [ ] Team members notified
- [ ] Deployment date confirmed

**Deployment Ready: ✅**

---

**Questions or Issues?**
1. Check the relevant guide (Docker, AWS, etc.)
2. Review CloudWatch logs for errors
3. Test locally first
4. Check AWS IAM permissions
5. Verify all environment variables
