"""Flask application configuration"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration class"""
    
    # Flask configuration
    SECRET_KEY = os.environ.get("SECRET_KEY")
    
    # MongoDB configuration
    MONGO_URI = os.environ.get("MONGO_URI")
    DATABASE_NAME = os.environ.get("DATABASE_NAME", "deepblight")
    
    # Mail configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_USERNAME')
    
    # AWS S3 configuration
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_S3_BUCKET = os.environ.get('AWS_S3_BUCKET')
    AWS_S3_REGION = os.environ.get('AWS_S3_REGION', 'us-east-1')
    
    # Model paths
    LEAF_MODEL_PATH = os.environ.get('LEAF_MODEL_PATH', './models/pretrained_models/DenseNet5d256New.h5')
    INSECT_DETECTOR_PATH = os.environ.get('INSECT_DETECTOR_PATH', './models/pretrained_models/insect_vs_noninsect_densenet201.h5')
    PEST_CLASSIFIER_PATH = os.environ.get('PEST_CLASSIFIER_PATH', './models/pretrained_models/DenseNet201_PotatoPest.h5')
    LEAF_DETECT_PATH = os.environ.get('LEAF_DETECT_PATH', './models/pretrained_models/leaf_detect.h5')


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
