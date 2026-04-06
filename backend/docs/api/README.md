# API Documentation

## Overview

This section contains API endpoint documentation for the FYP-Backend application.

## API Endpoints

### Authentication Routes (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Verify email address
- `POST /auth/resend-verification` - Resend verification code

### Leaf Scan Routes (`/leafscan`)
- `POST /leafscan/predict` - Analyze leaf image and get disease prediction
- `GET /leafscan/history` - Get user's leaf scan history
- `PUT /leafscan/<scan_id>` - Update leaf scan record
- `DELETE /leafscan/<scan_id>` - Delete leaf scan record

### Insect Scan Routes (`/insectscan`)
- `POST /insectscan/predict` - Detect insects and classify pests
- `GET /insectscan/history` - Get user's insect scan history
- `PUT /insectscan/<scan_id>` - Update insect scan record
- `DELETE /insectscan/<scan_id>` - Delete insect scan record

### Plant Routes (`/plants`)
- `GET /plants` - Get all plants
- `GET /plants/<plant_id>` - Get specific plant information
- `GET /plants/disease/<disease_id>` - Get disease information

### Weather Routes (`/weather`)
- `GET /weather` - Get current weather information
- `GET /weather/<location>` - Get weather for location

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Request/Response Format

All API responses follow a standard format:

**Success Response:**
```json
{
  "success": true,
  "data": { },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error description",
  "status": 400
}
```

## Models

### User Model
```json
{
  "_id": "mongodb_id",
  "email": "user@example.com",
  "password_hash": "hashed_password",
  "is_verified": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Leaf Scan Model
```json
{
  "_id": "mongodb_id",
  "user_id": "user_id",
  "image_url": "s3://bucket/path/image.jpg",
  "prediction": "Early Blight",
  "confidence": 0.95,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Insect Scan Model
```json
{
  "_id": "mongodb_id",
  "user_id": "user_id",
  "image_url": "s3://bucket/path/image.jpg",
  "insect_detected": true,
  "pest_class": "Agrotis ipsilon",
  "confidence": 0.92,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

For detailed endpoint information, see the individual route files in `routes/`.
