# FYP-Backend Documentation

Complete documentation for the FYP-Backend Flask application - Plant Disease Detection and Insect Pest Identification System.

## 📚 Documentation Structure

```
docs/
├── README.md                           # This file - Documentation overview
├── TROUBLESHOOTING.md                  # Troubleshooting guide
├── CODE_UPDATES.md                     # Code fixes and updates
├── PROJECT_STRUCTURE.md                # Project architecture and organization
├── MODULAR_STRUCTURE_SUMMARY.md       # Summary of modular restructuring
├── SETUP_SUMMARY.md                    # Initial setup and installation guide
├── QUICK_REFERENCE.md                  # Quick reference for common tasks
├── INDEX.md                            # Documentation index
├── FILES_CREATED_MODIFIED.md           # Version history and changes
│
├── guides/                             # Setup and integration guides
│   ├── AWS_DEPLOYMENT_GUIDE.md        # AWS deployment instructions
│   ├── AWS_UPDATE_IMAGE.md            # Updating AWS Docker images
│   └── S3_INTEGRATION_GUIDE.md         # S3 storage integration
│
├── deployment/                         # Docker and production setup
│   ├── Dockerfile                     # Docker image configuration
│   ├── docker-compose.yml             # Docker compose configuration
│   ├── DOCKER_QUICKSTART.md           # Docker quick start guide
│   └── DEPLOYMENT_CHECKLIST.md        # Pre-deployment checklist
│
└── api/                                # API reference and examples
    └── (API endpoints documentation)
```

## 🚀 Quick Navigation

### Getting Started
- **[Setup Summary](SETUP_SUMMARY.md)** - Installation and initial setup
- **[Quick Reference](QUICK_REFERENCE.md)** - Quick commands and common tasks

### Project Information
- **[Project Structure](PROJECT_STRUCTURE.md)** - Detailed architecture documentation
- **[Modular Structure](MODULAR_STRUCTURE_SUMMARY.md)** - Modular organization overview

### Deployment & Infrastructure
- **[Docker Quick Start](deployment/DOCKER_QUICKSTART.md)** - Getting started with Docker
- **[Deployment Checklist](deployment/DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[AWS Deployment](guides/AWS_DEPLOYMENT_GUIDE.md)** - AWS deployment guide
- **[AWS Updates](guides/AWS_UPDATE_IMAGE.md)** - Updating Docker images on AWS

### Integration & Configuration
- **[S3 Integration](guides/S3_INTEGRATION_GUIDE.md)** - AWS S3 setup and usage
- **[Configuration](../config/)** - Configuration classes and environment variables

## 📋 Key Features

### Machine Learning
- **Leaf Disease Detection** - DenseNet-based leaf disease classification
- **Insect Pest Identification** - Binary insect detection and multi-class pest classification
- **Model Architecture** - Pre-trained DenseNet201 models

### API Endpoints
- **Authentication** - User registration, login, email verification
- **Leaf Scanning** - Upload and analyze leaf images
- **Insect Scanning** - Detect insects and classify pests
- **Plant Info** - Plant database and information
- **Weather** - Weather information integration

### Storage
- **AWS S3** - Cloud image storage with presigned URLs
- **MongoDB** - User data and scan history

## 🗂️ Project Root Structure

```
FYP-backend/
├── .config/                 # Configuration files (routes, mongo URI)
│   ├── mongouri.txt
│   └── routes.txt
├── .env                     # Environment variables (not in git)
├── .gitignore
├── app.py                   # Main Flask application
├── requirements.txt         # Python dependencies
├── Dockerfile               # Docker image configuration ⭐
├── docker-compose.yml       # Docker compose setup ⭐
│
├── docs/                    # 📚 Documentation (this folder)
├── config/                  # Configuration management
├── auth/                    # Authentication routes & decorators
├── routes/                  # API endpoints
├── ml_services/             # ML models and inference
├── utils/                   # Helper utilities
├── models/pretrained_models/# Pre-trained model files
├── services/                # Business logic layer
└── tests/                   # Tests and test data
```

## 🔧 Core Components

### Configuration (`config/`)
Centralized configuration for different environments:
- `config.py` - Config, DevelopmentConfig, ProductionConfig, TestingConfig

### Authentication (`auth/`)
- `routes.py` - Login, registration, verification endpoints
- `decorators.py` - JWT token validation

### API Routes (`routes/`)
- `leafscan.py` - Leaf disease detection endpoints
- `insectscan.py` - Pest detection endpoints
- `plants.py` - Plant information endpoints
- `weather.py` - Weather information endpoints

### ML Services (`ml_services/`)
- `leaf.py` - Leaf detection and preprocessing
- `prediction.py` - Pest classification and inference

### Utilities (`utils/`)
- `DLModelfunctions.py` - Model preprocessing and loading
- `s3_utils.py` - AWS S3 file operations

### Models (`models/pretrained_models/`)
- `DenseNet5d256New.h5` - Leaf detection model (71 MB)
- `DenseNet201_PotatoPest.h5` - Pest classifier model (71 MB)
- `leaf_detect.h5` - Alternative leaf detection model (77 MB)

## 📝 Environment Variables

Create a `.env` file in the root directory with:

```env
# Flask
SECRET_KEY=your_secret_key_here

# MongoDB
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/

# Database
DATABASE_NAME=deepblight

# Mail (Gmail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_S3_REGION=us-east-1
USE_S3=True

# Model Paths
LEAF_MODEL_PATH=./models/pretrained_models/DenseNet5d256New.h5
INSECT_DETECTOR_PATH=./models/pretrained_models/insect_vs_noninsect_densenet201.h5
PEST_CLASSIFIER_PATH=./models/pretrained_models/DenseNet201_PotatoPest.h5
LEAF_DETECT_PATH=./models/pretrained_models/leaf_detect.h5
```

## 🐳 Docker

See `deployment/Dockerfile` and `deployment/docker-compose.yml` for containerization setup.

Quick start:
```bash
docker-compose up -d
```

## 📦 Python Dependencies

Install dependencies:
```bash
pip install -r requirements.txt
```

Main packages:
- **Flask** - Web framework
- **TensorFlow/Keras** - Deep learning
- **PyMongo** - MongoDB driver
- **Flask-Mail** - Email sending
- **boto3** - AWS S3
- **python-dotenv** - Environment variables

## ✅ Deployment Checklist

Before deploying to production, review:
- [Deployment Checklist](deployment/DEPLOYMENT_CHECKLIST.md)
- [AWS Deployment Guide](guides/AWS_DEPLOYMENT_GUIDE.md)

## 🔗 Related Documentation Files

- **[Version History](FILES_CREATED_MODIFIED.md)** - Timeline of changes
- **[Documentation Index](INDEX.md)** - Comprehensive documentation index

---

For detailed information on any topic, please refer to the appropriate documentation file listed above.

**Last Updated:** March 30, 2026
