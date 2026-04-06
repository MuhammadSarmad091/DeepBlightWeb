# FYP-Backend Modular Project Structure

## Overview
This document describes the reorganized, modular project structure for the FYP-Backend application. All code remains unchanged; only the file organization and placement has been improved for better maintainability and scalability.

## Directory Structure

```
FYP-backend/
│
├── app.py                           # Main Flask application entry point
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # Docker configuration
├── docker-compose.yml              # Docker compose configuration
├── .env                            # Environment variables (not in git)
├── .gitignore                      # Git ignore rules
│
├── config/                         # Configuration package
│   ├── __init__.py                # Configuration package init
│   └── config.py                  # Flask configuration classes (Config, DevelopmentConfig, ProductionConfig, TestingConfig)
│
├── auth/                           # Authentication package
│   ├── __init__.py
│   ├── routes.py                  # Authentication routes (login, register, verify, etc.)
│   └── decorators.py              # JWT token decorators and auth helpers
│
├── routes/                         # API Routes package (centralized routing)
│   ├── __init__.py                # Routes package init with setup functions
│   ├── leafscan.py                # Leaf scanning routes and endpoints
│   ├── insectscan.py              # Insect detection routes and endpoints
│   ├── plants.py                  # Plant database routes and endpoints
│   └── weather.py                 # Weather information routes and endpoints
│
├── ml_services/                    # Machine Learning services package
│   ├── __init__.py                # ML services package init
│   ├── leaf.py                    # Leaf detection service and utilities
│   └── prediction.py              # Pest/insect prediction service and utilities
│
├── utils/                          # Utility functions package
│   ├── __init__.py
│   ├── DLModelfunctions.py        # Model preprocessing and inference utilities
│   └── s3_utils.py                # AWS S3 integration and file handling utilities
│
├── models/                         # Models package
│   ├── __init__.py
│   ├── pretrained_models/         # Pre-trained deep learning models storage
│   │   ├── DenseNet5d256New.h5    # Leaf detection model
│   │   ├── leaf_detect.h5         # Alternative leaf detection model
│   │   └── DenseNet201_PotatoPest.h5  # Pest classification model
│   │
│   └── insect/                    # Insect-related model directory (for future expansion)
│
├── services/                       # Business logic services package
│   ├── __init__.py
│   └── (Place for future business logic helpers)
│
├── tests/                          # Testing package
│   ├── __init__.py
│   ├── test.py                    # General API tests
│   ├── testapp.py                 # Flask app testing utilities
│   ├── FlaskApp.py                # Alternative Flask test app
│   ├── FlaskAPI.ipynb             # Jupyter notebook for API testing
│   ├── p.ipynb                    # Jupyter notebook for exploration
│   └── testImg/                   # Test images for validation
│
├── documentation/                  # Documentation files
│   └── (Place for API docs, guides, etc.)
│
├── plants/                         # DEPRECATED - See routes/plants.py (kept for backward compatibility)
│   ├── __init__.py
│   └── routes.py
│
├── leafscan/                       # DEPRECATED - See routes/leafscan.py (kept for backward compatibility)
│   ├── __init__.py
│   └── routes.py
│
├── insectscan/                     # DEPRECATED - See routes/insectscan.py (kept for backward compatibility)
│   ├── __init__.py
│   └── routes.py
│
├── weather/                        # DEPRECATED - See routes/weather.py (kept for backward compatibility)
│   ├── __init__.py
│   └── routes.py
│
├── Model/                          # DEPRECATED - See models/pretrained_models/ (kept for backward compatibility)
│   └── DenseNet201_PotatoPest.h5
│
├── testImg/                        # DEPRECATED - See tests/testImg/ (kept for backward compatibility)
│
├── testingsModel/                  # DEPRECATED - See tests/ (kept for backward compatibility)
│
├── storage/                        # Runtime storage directory (local file uploads before S3)
│   ├── (user_id_1)/
│   └── (user_id_2)/
│
├── uploads/                        # Runtime uploads directory
│
├── __pycache__/                   # Python cache files (auto-generated)
│
└── README.md, AWS_DEPLOYMENT_GUIDE.md, etc.  # Documentation files

```

## Module Organization

### 1. **config/** - Configuration Management
- Centralized configuration for different environments
- Database connections, mail settings, AWS credentials, model paths
- `config.py` contains Config, DevelopmentConfig, ProductionConfig, TestingConfig classes

### 2. **auth/** - Authentication & Security
- **routes.py**: User registration, login, email verification, token generation
- **decorators.py**: JWT token validation, role-based access control

### 3. **routes/** - API Endpoints (Centralized)
- `leafscan.py`: Leaf disease detection routes
- `insectscan.py`: Insect detection and pest classification routes
- `plants.py`: Plant database and information routes
- `weather.py`: Weather information routes
- All routes are registered via setup functions

### 4. **ml_services/** - Machine Learning Services
- `leaf.py`: Leaf detection and preprocessing utilities
- `prediction.py`: Insect/pest prediction and inference logic

### 5. **utils/** - Utility Functions
- `DLModelfunctions.py`: Model loading, preprocessing, and inference helpers
- `s3_utils.py`: AWS S3 file operations, presigned URLs, file management

### 6. **models/** - Model Storage
- **pretrained_models/**: All trained .h5 model files
  - `DenseNet5d256New.h5` - Leaf detection model
  - `leaf_detect.h5` - Alternative leaf detection model
  - `DenseNet201_PotatoPest.h5` - Pest classification model
- **insect/**: Future insect model directory

### 7. **tests/** - Testing & Validation
- Test files for API endpoints
- Jupyter notebooks for exploration and testing
- Test images for model validation

## Import Updates

When refactoring your code to use the new structure, follow these import patterns:

```python
# Configuration
from config import Config, DevelopmentConfig

# Routes setup
from routes import (
    setup_leafscan_routes,
    setup_insectscan_routes,
    setup_plants_routes,
    setup_weather_routes
)

# ML Services
from ml_services.leaf import preprocess_single_image
from ml_services.prediction import load_models, classify_pest

# Utilities
from utils.DLModelfunctions import preprocess_for_inference
from utils.s3_utils import upload_file_obj_to_s3
```

## Migration Notes

### Backward Compatibility
- Original directories (leafscan/, insectscan/, plants/, weather/, Model/, testImg/, testingsModel/) 
  have been retained in place
- They can be safely deleted after confirming all imports have been updated

### Files Copied to New Locations
1. ✅ `DLModelfunctions.py` → `utils/DLModelfunctions.py`
2. ✅ `s3_utils.py` → `utils/s3_utils.py`
3. ✅ `leaf.py` → `ml_services/leaf.py`
4. ✅ `prediction.py` → `ml_services/prediction.py`
5. ✅ `DenseNet5d256New.h5` → `models/pretrained_models/DenseNet5d256New.h5`
6. ✅ `leaf_detect.h5` → `models/pretrained_models/leaf_detect.h5`
7. ✅ `Model/DenseNet201_PotatoPest.h5` → `models/pretrained_models/DenseNet201_PotatoPest.h5`
8. ✅ `leafscan/routes.py` → `routes/leafscan.py`
9. ✅ `insectscan/routes.py` → `routes/insectscan.py`
10. ✅ `plants/routes.py` → `routes/plants.py`
11. ✅ `weather/routes.py` → `routes/weather.py`
12. ✅ `testingsModel/*` → `tests/`
13. ✅ `testImg/` → `tests/testImg/`

## Key Improvements

### 1. **Separation of Concerns**
   - ML logic separated into `ml_services/`
   - Configuration centralized in `config/`
   - Routes centralized in `routes/`
   - Utilities grouped in `utils/`

### 2. **Scalability**
   - Easy to add new routes in `routes/`
   - Easy to add new ML services in `ml_services/`
   - Easy to add new utilities in `utils/`

### 3. **Maintainability**
   - Clear directory purpose
   - Logical grouping of related files
   - Better code organization

### 4. **Testing**
   - Dedicated `tests/` directory
   - Easy to organize and run tests
   - Test data organized separately

## Next Steps (Optional Refactoring)

1. Update `app.py` imports to use new structure:
   ```python
   from config import Config
   from routes import setup_leafscan_routes, setup_insectscan_routes, ...
   from ml_services.prediction import load_models
   ```

2. Update route files to import utilities from new locations:
   ```python
   from utils.s3_utils import upload_file_obj_to_s3
   from utils.DLModelfunctions import preprocess_for_inference
   ```

3. Update model paths in configuration:
   ```python
   LEAF_MODEL_PATH = './models/pretrained_models/DenseNet5d256New.h5'
   INSECT_DETECTOR_PATH = './models/pretrained_models/insect_vs_noninsect_densenet201.h5'
   ```

4. Delete old directories once migration is confirmed:
   - `rm -rf leafscan/ insectscan/ plants/ weather/`
   - `rm -rf Model/ testImg/ testingsModel/`
   - `rm DLModelfunctions.py s3_utils.py leaf.py prediction.py`

## Configuration File (config/config.py)

The new `config/config.py` file centralizes all configuration with environment variable support:

```python
class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    MONGO_URI = os.environ.get("MONGO_URI")
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    LEAF_MODEL_PATH = './models/pretrained_models/DenseNet5d256New.h5'
    # ... etc
```

This replaces scattered configuration throughout `app.py` and individual files.

---

**Structure reorganization complete!** No code logic has been changed - only file organization improved.
