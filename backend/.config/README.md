# Configuration Files Reference

This directory contains configuration files and reference data for the FYP-Backend application.

## Files in .config/

### mongouri.txt
Contains MongoDB connection URI reference.

**Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Note:** Keep actual credentials in `.env` file, not in this file.

### routes.txt
Contains API route reference and endpoint mappings.

## Environment Configuration

The main configuration is in `../.env` file (root directory).

**Required Environment Variables:**

```env
# Flask
SECRET_KEY=your_secret_key_here
FLASK_ENV=development|production

# MongoDB
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/
DATABASE_NAME=deepblight

# Email
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_S3_REGION=us-east-1
USE_S3=True|False

# Model Paths
LEAF_MODEL_PATH=./models/pretrained_models/DenseNet5d256New.h5
INSECT_DETECTOR_PATH=./models/pretrained_models/insect_vs_noninsect_densenet201.h5
PEST_CLASSIFIER_PATH=./models/pretrained_models/DenseNet201_PotatoPest.h5
LEAF_DETECT_PATH=./models/pretrained_models/leaf_detect.h5
```

## Configuration Classes

See `../config/config.py` for Python configuration classes:

- **Config** - Base configuration
- **DevelopmentConfig** - Development environment
- **ProductionConfig** - Production environment
- **TestingConfig** - Testing environment

## Security Notes

- ✅ Keep `.env` in `.gitignore`
- ✅ Use strong SECRET_KEY
- ✅ Use App Passwords for Gmail
- ✅ Never commit API keys
- ✅ Rotate credentials regularly
- ✅ Use environment variables in production

---

Last Updated: March 30, 2026
