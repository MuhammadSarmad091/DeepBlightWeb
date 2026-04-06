# InsectScan + Weather API Documentation

This document covers all `insectscan` and `weather` endpoints used by the frontend.

## General behavior

- Base path: `/`
- All endpoints require authentication with `Authorization: Bearer <token>`.
- `insectscan` routes under `/insectscan`.
- `weather` routes under `/weather`.
- Default storage is S3 (`USE_S3` environment variable) with local fallback.

---

## 1) InsectScan routes (`/insectscan`)

### `POST /insectscan/save`
- Type: multipart/form-data
- Required fields:
  - `scan_id` (string)
  - `datetime` (ISO datetime string)
  - `predicted_class` (string)
  - `confidence_score` (numeric)
  - `image` file
- Success: 201
- Body:
  - `message`, `scan_record` with saved data including converted `datetime` and `created_at`
- Errors: 400 (missing/invalid), 409 (duplicate), 500 (server error)

### `DELETE /insectscan/delete`
- JSON body: `{ "scan_id": "..." }`
- Success: 200
- Errors: 400 (missing scan_id), 404 (not found), 500

### `GET /insectscan/getall`
- Return all scans for authenticated user.
- Success: 200 with `scans`, each has:
  - `_id`, `scan_id`, `image_url`, `image_exists`, `predicted_class`, `confidence_score`, `datetime`, `created_at`
- Errors: 500

### `POST /insectscan/getsome`
- JSON body:
  - `start_index` (int, >=0)
  - `scans_to_send` (int, >0)
- Success: 200, paginated response with `has_more`
- Errors: 400 invalid params, 500

### `POST /insectscan/getone`
- JSON body: `{ "scan_id": "..." }`
- Success: 200 with single `scan`
- Errors: 400/404/500

### `POST /insectscan/upload`
- Multipart fields:
  - `userid` (string, must match auth user)
  - `image` file
- Behavior: run `detect_insect`, if insect then `classify_pest`.
- Success: 200 and JSON: `predicted_class`, `confidence_score`, `next_scan_id`
- Errors: 400/403/500

### `POST /insectscan/getimages`
- JSON body: `{ "paths": ["...", ...] }`
- Returns base64 `image_data` for existing images.
- Success: 200, with each object: `path`, `found`, `image_data`
- Errors: 400/500

---

## 2) LeafScan routes (`/leafscan`)

### `POST /leafscan/save`
- Type: multipart/form-data
- Required fields:
  - `scan_id` (string)
  - `datetime` (ISO datetime string)
  - `predicted_class` (string)
  - `confidence_score` (numeric)
  - `image` file
- Success: 201
- Body: `message`, `scan_record` with saved data (converted `datetime`, `created_at`)
- Errors: 400 missing/invalid, 409 duplicate, 500 server error

### `DELETE /leafscan/delete`
- JSON body: `{ "scan_id": "..." }`
- Success: 200
- Errors: 400 (missing scan_id), 404 (not found), 500

### `GET /leafscan/getall`
- Return all scans for authenticated user.
- Success: 200 with `scans`, each has:
  - `_id`, `scan_id`, `image_url`, `image_exists`, `predicted_class`, `confidence_score`, `datetime`, `created_at`
- Errors: 500

### `POST /leafscan/getsome`
- JSON body:
  - `start_index` (int, >=0)
  - `scans_to_send` (int, >0)
- Success: 200, paginated response with `has_more`
- Errors: 400 invalid params, 500

### `POST /leafscan/getone`
- JSON body: `{ "scan_id": "..." }`
- Success: 200 with single `scan`
- Errors: 400/404/500

---

## 3) Weather routes (`/weather`)

### `GET /weather/current`
- Query params:
  - `location` (required)
  - `aqi` (`yes`/`no`, default `no`)
- Returns a wrapper:
  - `status`: `success`
  - `location`, `current`
- Errors: 400 missing location, 500 if Weather API key missing or failed

### `GET /weather/forecast`
- Query params:
  - `location` (required)
  - `days` (optional, int 1-10, default 1)
  - `aqi` (`yes`/`no`)
  - `alerts` (`yes`/`no`)
- Returns: `location`, `current`, `forecast`
- Errors: 400/500

### `GET /weather/weekly`
- Query params:
  - `location` (required)
  - `aqi` (optional)
- Fixed `days=7`.
- Returns: `forecast_days` simplified array.

### `GET /weather/hourly`
- Query params:
  - `location` (required)
  - `days` (1-10, optional)
- Returns: `hourly_forecast` array.

### `GET /weather/search`
- Query params: `query` (required)
- Returns location candidates (`results`).

### `GET /weather/alerts`
- Query params: `location` (required)
- Returns `alerts` object inside API response.

### `GET /weather/aqi`
- Query params: `location` (required)
- Returns `current.aqi` values.

### `GET /weather/astronomy`
- Query params:
  - `location` (required)
  - `days` (1-10, default 1)
- Returns `astronomy` array with sun/moon times and moon phase.

---

## 3) Notes for frontend

- Ensure `Authorization` header present for all requests.
- For image upload endpoints, use `FormData`.
- `image_url` may be S3 URL or presigned URL.
- Always validate required fields before network call.
- `scan_id` may be managed as numeric string in `upload` path.
