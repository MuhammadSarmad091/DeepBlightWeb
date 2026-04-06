# Deployment Guides Index

Complete guides for deploying FYP-Backend to various environments.

## 📖 Available Guides

### Docker Deployment
- **[Docker Quick Start](DOCKER_QUICKSTART.md)** - Get started with Docker in minutes
- **[docker-compose.yml](../../docker-compose.yml)** - Multi-container setup (in root)
- **[Dockerfile](../../Dockerfile)** - Container image configuration (in root)

### Cloud Deployment
- **[AWS Deployment Guide](guides/AWS_DEPLOYMENT_GUIDE.md)** - Complete AWS deployment instructions
- **[AWS Docker Updates](guides/AWS_UPDATE_IMAGE.md)** - Updating Docker images on AWS ECR

### Infrastructure & Services
- **[AWS S3 Integration](guides/S3_INTEGRATION_GUIDE.md)** - Storage setup
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification

## 🚀 Quick Start

### Option 1: Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
echo "SECRET_KEY=dev" > .env
echo "MONGO_URI=mongodb://localhost:27017/" >> .env

# Run Flask
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```

### Option 2: Docker (Recommended)
```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f app
```

### Option 3: AWS Deployment
See **[AWS Deployment Guide](guides/AWS_DEPLOYMENT_GUIDE.md)** for step-by-step instructions.

## 📋 Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables set in `.env`
- [ ] Database connection tested
- [ ] AWS credentials configured
- [ ] S3 bucket permissions verified
- [ ] Email credentials validated
- [ ] Models downloaded and placed correctly
- [ ] Docker image built successfully
- [ ] Tests passing
- [ ] Security review completed

See **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** for detailed items.

## 🔧 Configuration

### Environment Variables Template

```env
# Flask Configuration
SECRET_KEY=your_secret_key_here
FLASK_ENV=production

# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/
DATABASE_NAME=deepblight

# Email (Gmail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# AWS
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket
AWS_S3_REGION=us-east-1
USE_S3=true

# Model Paths
LEAF_MODEL_PATH=./models/pretrained_models/DenseNet5d256New.h5
INSECT_DETECTOR_PATH=./models/pretrained_models/insect_vs_noninsect_densenet201.h5
PEST_CLASSIFIER_PATH=./models/pretrained_models/DenseNet201_PotatoPest.h5
```

## 📊 System Requirements

### Minimum Requirements
- Python 3.8+
- 2GB RAM
- 500MB disk space (models)
- Internet connection

### Recommended for Production
- Python 3.10+
- 8GB RAM
- GPU (NVIDIA with CUDA for faster inference)
- SSD with 1GB free space

### Docker Requirements
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM
- 2GB disk space

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit `.env` to git
   - Use strong SECRET_KEY
   - Rotate credentials regularly

2. **Database**
   - Enable authentication
   - Use IP whitelist
   - Encrypt connections

3. **AWS**
   - Use IAM roles instead of keys when possible
   - Limit S3 bucket permissions
   - Enable versioning
   - Set up CloudFront CDN

4. **API Security**
   - Implement rate limiting
   - HTTPS only
   - CORS configuration
   - Input validation

## 📈 Scaling

### Horizontal Scaling
- Use load balancer
- Multiple Flask instances
- Database replication

### Vertical Scaling
- Increase server resources
- GPU acceleration
- Caching (Redis)

## 📊 Monitoring

### Recommended Tools
- **Metrics**: Prometheus, CloudWatch
- **Logs**: ELK Stack, CloudWatch Logs
- **Monitoring**: Datadog, New Relic
- **APM**: New Relic, Datadog

## 🆘 Troubleshooting

See **[Troubleshooting Guide](../TROUBLESHOOTING.md)** for common issues and solutions.

## 📞 Support

For issues not covered:
1. Check the troubleshooting guide
2. Review relevant documentation
3. Check application logs
4. Contact DevOps team

---

**Last Updated:** March 30, 2026
