"# FYP-Backend - Plant Disease & Pest Detection System

A Flask-based REST API for plant leaf disease detection and insect pest identification using deep learning models.

## 🚀 Quick Start

1. **Activate virtual environment:**
   ```bash
   venv\Scripts\activate
   ```

2. **Start the app:**
   ```bash
   python app.py
   ```

3. **Test it works:**
   ```bash
   curl http://localhost:5000/
   ```

Expected response:
```json
{"message":"Flask Auth API running with verification"}
```

## 📚 Documentation

### Start Here
- **[Quick Start Guide](docs/QUICK_START.md)** - Get running in 2 minutes
- **[Before/After Summary](docs/BEFORE_AFTER.md)** - See what was fixed
- **[Complete Summary](docs/COMPLETE_SUMMARY.md)** - Full details

### Detailed Guides
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Architecture overview
- **[Code Updates](docs/CODE_UPDATES.md)** - What code was changed
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues

### Deployment & Integration
- **[Deployment](docs/deployment/README.md)** - Docker, AWS, production
- **[AWS Guide](docs/guides/AWS_DEPLOYMENT_GUIDE.md)** - AWS deployment
- **[S3 Integration](docs/guides/S3_INTEGRATION_GUIDE.md)** - AWS S3 setup

### API Reference
- **[API Endpoints](docs/api/README.md)** - HTTP endpoints and models

## 📋 Key Features

### Machine Learning
- **Leaf Disease Detection** - DenseNet-based classification
- **Pest Identification** - Insect detection and classification
- **Pre-trained Models** - Ready to use, 219 MB total

### API Capabilities
- **Authentication** - JWT-based user auth
- **Image Analysis** - Leaf and pest detection via image upload
- **History Tracking** - Store and retrieve analysis history
- **Cloud Storage** - AWS S3 integration
- **Weather API** - Location-based weather data

## 🛠️ Tech Stack

- **Framework:** Flask
- **Database:** MongoDB
- **ML Framework:** TensorFlow/Keras
- **Storage:** AWS S3
- **Deployment:** Docker
- **Language:** Python 3.8+

## 📁 Project Structure

```
FYP-backend/
├── app.py                      Main Flask app
├── Dockerfile                  Docker config
├── docker-compose.yml          Docker Compose config
├── requirements.txt            Python dependencies
├── .env                        Environment variables (create this)
│
├── docs/                       📚 All documentation
│   ├── QUICK_START.md         Start here!
│   ├── deployment/            Docker & deployment
│   ├── guides/                AWS & S3 guides
│   └── api/                   API reference
│
├── config/                     Configuration package
├── auth/                       Authentication routes
├── routes/                     API endpoints (leaf, insect, plant, weather)
├── ml_services/                ML models and inference
├── utils/                      Utility functions
├── models/pretrained_models/   Deep learning models
├── services/                   Business logic
└── tests/                      Testing
```

## 🔧 Configuration

### Environment Variables (.env file)

Create `.env` in project root:

```env
# Flask
SECRET_KEY=your_secret_key_here
FLASK_ENV=development

# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/
DATABASE_NAME=deepblight

# Email (Gmail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket
USE_S3=True
```

## 📦 Installation

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Create .env File
```bash
# Copy template and edit
cp .env.example .env
```

### 3. Run the App
```bash
python app.py
```

## 🚢 Docker Deployment

### Using Docker Compose
```bash
docker-compose up -d
```

See [Deployment Guide](docs/deployment/README.md) for details.

## 🧪 API Routes

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Verify email

### Leaf Analysis
- `POST /leafscan/predict` - Analyze leaf image
- `GET /leafscan/history` - Get analysis history

### Pest Detection
- `POST /insectscan/predict` - Detect pests
- `GET /insectscan/history` - Get detection history

### Plant Information
- `GET /plants` - Get plant list
- `GET /plants/<id>` - Get plant details

### Weather
- `GET /weather/current` - Current weather

See [API Reference](docs/api/README.md) for complete details.

## ⚙️ Development

### Run with Debug Mode
```bash
FLASK_ENV=development FLASK_DEBUG=1 python app.py
```

### Run Tests
```bash
pytest tests/
```

### Code Organization

All code follows a modular structure:
- **Routes**: API endpoints organized by feature
- **ML Services**: Model inference and preprocessing
- **Utils**: Helper functions and AWS integration
- **Config**: Centralized configuration management
- **Auth**: Authentication and authorization

See [Project Structure](docs/PROJECT_STRUCTURE.md) for details.

## 🐛 Troubleshooting

See [Troubleshooting Guide](docs/TROUBLESHOOTING.md) for:
- MongoDB connection issues
- Model loading problems
- AWS S3 errors
- Email configuration
- And more...

## 📊 Status

### ✅ Working
- Authentication & JWT
- Leaf disease detection
- Pest classification (with error handling)
- Plant database queries
- Weather information
- AWS S3 integration
- MongoDB operations

### ⚠️ Notes
- Insect detection model may be missing (gracefully handled)
- App won't crash if models are missing

## 🤝 Contributing

When adding features:
1. Follow the modular structure
2. Place code in appropriate package
3. Update documentation
4. Test thoroughly
5. Use proper imports (from package.module)

## 📝 License

[Add your license here]

## 👥 Authors

FYP Team - 2026

## 🔗 Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [TensorFlow Documentation](https://www.tensorflow.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

---

**Status:** ✅ Ready to use  
**Last Updated:** March 30, 2026
" 
