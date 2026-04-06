"""Weather routes for accessing weather data based on location using weatherapi.com"""
from flask import Blueprint, request, jsonify
import requests
import os
from datetime import datetime

# Create the blueprint
weather_bp = Blueprint("weather", __name__, url_prefix="/weather")

# Weather API configuration
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY")
WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1"


def setup_weather_routes(app, users_col, token_required_decorator):
    """
    Setup weather routes for the Flask app.
    
    Args:
        app: Flask app instance
        users_col: MongoDB users collection
        token_required_decorator: Token validation decorator
    """
    
    @weather_bp.route("/current", methods=["GET"])
    @token_required_decorator(users_col, app)
    def get_current_weather():
        """
        Get current weather for a specific location.
        
        Query Parameters:
            - location: string (required) - City name, coordinates (lat,lon), or postal code
            - aqi: string (optional) - "yes" to include air quality data
        
        Returns:
            - 200: {
                "status": "success",
                "location": {...},
                "current": {
                    "temp_c": float,
                    "temp_f": float,
                    "condition": {...},
                    "humidity": int,
                    "wind_kph": float,
                    "wind_mph": float,
                    "pressure_mb": float,
                    "precip_mm": float,
                    "feelslike_c": float,
                    "feelslike_f": float,
                    "uv": float,
                    "aqi": {...} (if requested)
                }
              }
            - 400: {"error": "location parameter is required"}
            - 401: {"error": "Unauthorized"}
            - 500: {"error": "Failed to fetch weather data"}
        """
        try:
            location = request.args.get("location")
            aqi = request.args.get("aqi", "no")
            
            if not location:
                return jsonify({"error": "location parameter is required"}), 400
            
            if not WEATHER_API_KEY:
                return jsonify({"error": "Weather API key not configured"}), 500
            
            # Call weatherapi.com current weather endpoint
            params = {
                "key": WEATHER_API_KEY,
                "q": location,
                "aqi": aqi
            }
            
            response = requests.get(f"{WEATHER_API_BASE_URL}/current.json", params=params)
            
            if response.status_code == 200:
                data = response.json()
                return jsonify({
                    "status": "success",
                    "location": data.get("location"),
                    "current": data.get("current")
                }), 200
            elif response.status_code == 400:
                return jsonify({"error": "Location not found"}), 404
            else:
                return jsonify({"error": "Failed to fetch weather data"}), 500
                
        except Exception as e:
            print(f"Error fetching current weather: {e}")
            return jsonify({"error": "Failed to fetch weather data"}), 500
    
    
    @weather_bp.route("/forecast", methods=["GET"])
    @token_required_decorator(users_col, app)
    def get_weather_forecast():
        """
        Get weather forecast for a specific location (10 days).
        
        Query Parameters:
            - location: string (required) - City name, coordinates (lat,lon), or postal code
            - days: int (optional) - Number of days (1-10, default: 1)
            - aqi: string (optional) - "yes" to include air quality data
            - alerts: string (optional) - "yes" to include weather alerts
        
        Returns:
            - 200: {
                "status": "success",
                "location": {...},
                "current": {...},
                "forecast": {
                    "forecastday": [
                        {
                            "date": "YYYY-MM-DD",
                            "day": {
                                "maxtemp_c": float,
                                "mintemp_c": float,
                                "avgtemp_c": float,
                                "condition": {...},
                                "totalprecip_mm": float,
                                "avghumidity": int,
                                "chance_of_rain": int,
                                "uv": float
                            },
                            "astro": {
                                "sunrise": "HH:MM",
                                "sunset": "HH:MM",
                                "moonrise": "HH:MM",
                                "moonset": "HH:MM"
                            },
                            "hour": [...] (hourly data)
                        }
                    ]
                }
              }
            - 400: {"error": "location parameter is required"}
            - 401: {"error": "Unauthorized"}
            - 500: {"error": "Failed to fetch forecast data"}
        """
        try:
            location = request.args.get("location")
            days = request.args.get("days", 1)
            aqi = request.args.get("aqi", "no")
            alerts = request.args.get("alerts", "no")
            
            if not location:
                return jsonify({"error": "location parameter is required"}), 400
            
            if not WEATHER_API_KEY:
                return jsonify({"error": "Weather API key not configured"}), 500
            
            # Validate days parameter
            try:
                days = int(days)
                if days < 1 or days > 10:
                    days = 1
            except (ValueError, TypeError):
                days = 1
            
            # Call weatherapi.com forecast endpoint
            params = {
                "key": WEATHER_API_KEY,
                "q": location,
                "days": days,
                "aqi": aqi,
                "alerts": alerts
            }
            
            response = requests.get(f"{WEATHER_API_BASE_URL}/forecast.json", params=params)
            
            if response.status_code == 200:
                data = response.json()
                return jsonify({
                    "status": "success",
                    "location": data.get("location"),
                    "current": data.get("current"),
                    "forecast": data.get("forecast")
                }), 200
            elif response.status_code == 400:
                return jsonify({"error": "Location not found"}), 404
            else:
                return jsonify({"error": "Failed to fetch forecast data"}), 500
                
        except Exception as e:
            print(f"Error fetching weather forecast: {e}")
            return jsonify({"error": "Failed to fetch forecast data"}), 500
    
    
    @weather_bp.route("/weekly", methods=["GET"])
    @token_required_decorator(users_col, app)
    def get_weekly_forecast():
        """
        Get 7-day detailed weather forecast for a location.
        
        Query Parameters:
            - location: string (required) - City name, coordinates (lat,lon), or postal code
            - aqi: string (optional) - "yes" to include air quality data
        
        Returns:
            - 200: {
                "status": "success",
                "location": {...},
                "forecast_days": [
                    {
                        "date": "YYYY-MM-DD",
                        "day_of_week": "Monday",
                        "maxtemp_c": float,
                        "mintemp_c": float,
                        "avgtemp_c": float,
                        "condition": "Rainy",
                        "chance_of_rain": int,
                        "totalprecip_mm": float,
                        "avghumidity": int,
                        "uv": float,
                        "sunset": "HH:MM",
                        "sunrise": "HH:MM"
                    }
                ]
              }
            - 400: {"error": "location parameter is required"}
            - 401: {"error": "Unauthorized"}
            - 500: {"error": "Failed to fetch weekly forecast"}
        """
        try:
            location = request.args.get("location")
            aqi = request.args.get("aqi", "no")
            
            if not location:
                return jsonify({"error": "location parameter is required"}), 400
            
            if not WEATHER_API_KEY:
                return jsonify({"error": "Weather API key not configured"}), 500
            
            # Call weatherapi.com forecast endpoint for 7 days
            params = {
                "key": WEATHER_API_KEY,
                "q": location,
                "days": 7,
                "aqi": aqi
            }
            
            response = requests.get(f"{WEATHER_API_BASE_URL}/forecast.json", params=params)
            
            if response.status_code == 200:
                data = response.json()
                forecast_days = []
                
                for day_data in data.get("forecast", {}).get("forecastday", []):
                    forecast_days.append({
                        "date": day_data.get("date"),
                        "day_of_week": datetime.strptime(day_data.get("date"), "%Y-%m-%d").strftime("%A"),
                        "maxtemp_c": day_data.get("day", {}).get("maxtemp_c"),
                        "mintemp_c": day_data.get("day", {}).get("mintemp_c"),
                        "avgtemp_c": day_data.get("day", {}).get("avgtemp_c"),
                        "condition": day_data.get("day", {}).get("condition", {}).get("text"),
                        "chance_of_rain": day_data.get("day", {}).get("chance_of_rain"),
                        "totalprecip_mm": day_data.get("day", {}).get("totalprecip_mm"),
                        "avghumidity": day_data.get("day", {}).get("avghumidity"),
                        "uv": day_data.get("day", {}).get("uv"),
                        "sunset": day_data.get("astro", {}).get("sunset"),
                        "sunrise": day_data.get("astro", {}).get("sunrise")
                    })
                
                return jsonify({
                    "status": "success",
                    "location": data.get("location"),
                    "forecast_days": forecast_days
                }), 200
            elif response.status_code == 400:
                return jsonify({"error": "Location not found"}), 404
            else:
                return jsonify({"error": "Failed to fetch weekly forecast"}), 500
                
        except Exception as e:
            print(f"Error fetching weekly forecast: {e}")
            return jsonify({"error": "Failed to fetch weekly forecast"}), 500
    
    
    @weather_bp.route("/hourly", methods=["GET"])
    @token_required_decorator(users_col, app)
    def get_hourly_forecast():
        """
        Get hourly weather forecast for a specific location (24-hour or multi-day).
        
        Query Parameters:
            - location: string (required) - City name, coordinates (lat,lon), or postal code
            - days: int (optional) - Number of days (1-10, default: 1)
        
        Returns:
            - 200: {
                "status": "success",
                "location": {...},
                "hourly_forecast": [
                    {
                        "time": "YYYY-MM-DD HH:MM",
                        "temp_c": float,
                        "temp_f": float,
                        "condition": "Rainy",
                        "humidity": int,
                        "chance_of_rain": int,
                        "wind_kph": float,
                        "feelslike_c": float
                    }
                ]
              }
            - 400: {"error": "location parameter is required"}
            - 401: {"error": "Unauthorized"}
            - 500: {"error": "Failed to fetch hourly forecast"}
        """
        try:
            location = request.args.get("location")
            days = request.args.get("days", 1)
            
            if not location:
                return jsonify({"error": "location parameter is required"}), 400
            
            if not WEATHER_API_KEY:
                return jsonify({"error": "Weather API key not configured"}), 500
            
            # Validate days parameter
            try:
                days = int(days)
                if days < 1 or days > 10:
                    days = 1
            except (ValueError, TypeError):
                days = 1
            
            # Call weatherapi.com forecast endpoint
            params = {
                "key": WEATHER_API_KEY,
                "q": location,
                "days": days
            }
            
            response = requests.get(f"{WEATHER_API_BASE_URL}/forecast.json", params=params)
            
            if response.status_code == 200:
                data = response.json()
                hourly_forecast = []
                
                for day_data in data.get("forecast", {}).get("forecastday", []):
                    for hour_data in day_data.get("hour", []):
                        hourly_forecast.append({
                            "time": hour_data.get("time"),
                            "temp_c": hour_data.get("temp_c"),
                            "temp_f": hour_data.get("temp_f"),
                            "condition": hour_data.get("condition", {}).get("text"),
                            "humidity": hour_data.get("humidity"),
                            "chance_of_rain": hour_data.get("chance_of_rain"),
                            "wind_kph": hour_data.get("wind_kph"),
                            "feelslike_c": hour_data.get("feelslike_c")
                        })
                
                return jsonify({
                    "status": "success",
                    "location": data.get("location"),
                    "hourly_forecast": hourly_forecast
                }), 200
            elif response.status_code == 400:
                return jsonify({"error": "Location not found"}), 404
            else:
                return jsonify({"error": "Failed to fetch hourly forecast"}), 500
                
        except Exception as e:
            print(f"Error fetching hourly forecast: {e}")
            return jsonify({"error": "Failed to fetch hourly forecast"}), 500
    
    
    @weather_bp.route("/search", methods=["GET"])
    @token_required_decorator(users_col, app)
    def search_locations():
        """
        Search for locations by name (useful for autocomplete).
        
        Query Parameters:
            - query: string (required) - Location name to search for
        
        Returns:
            - 200: {
                "status": "success",
                "results": [
                    {
                        "id": int,
                        "name": "London",
                        "region": "England",
                        "country": "United Kingdom",
                        "lat": float,
                        "lon": float,
                        "url": "string"
                    }
                ]
              }
            - 400: {"error": "query parameter is required"}
            - 401: {"error": "Unauthorized"}
            - 500: {"error": "Failed to search locations"}
        """
        try:
            query = request.args.get("query")
            
            if not query:
                return jsonify({"error": "query parameter is required"}), 400
            
            if not WEATHER_API_KEY:
                return jsonify({"error": "Weather API key not configured"}), 500
            
            # Call weatherapi.com search endpoint
            params = {
                "key": WEATHER_API_KEY,
                "q": query
            }
            
            response = requests.get(f"{WEATHER_API_BASE_URL}/search.json", params=params)
            
            if response.status_code == 200:
                results = response.json()
                return jsonify({
                    "status": "success",
                    "results": results
                }), 200
            else:
                return jsonify({"error": "Failed to search locations"}), 500
                
        except Exception as e:
            print(f"Error searching locations: {e}")
            return jsonify({"error": "Failed to search locations"}), 500
    
    
    @weather_bp.route("/alerts", methods=["GET"])
    @token_required_decorator(users_col, app)
    def get_weather_alerts():
        """
        Get weather alerts for a specific location.
        
        Query Parameters:
            - location: string (required) - City name, coordinates (lat,lon), or postal code
        
        Returns:
            - 200: {
                "status": "success",
                "location": {...},
                "alerts": {
                    "alert": [
                        {
                            "headline": "string",
                            "desc": "string",
                            "severity": "Warning|Moderate|Severe",
                            "effective": "YYYY-MM-DD HH:MM",
                            "expires": "YYYY-MM-DD HH:MM"
                        }
                    ]
                }
              }
            - 400: {"error": "location parameter is required"}
            - 401: {"error": "Unauthorized"}
            - 500: {"error": "Failed to fetch alerts"}
        """
        try:
            location = request.args.get("location")
            
            if not location:
                return jsonify({"error": "location parameter is required"}), 400
            
            if not WEATHER_API_KEY:
                return jsonify({"error": "Weather API key not configured"}), 500
            
            # Call weatherapi.com current endpoint with alerts
            params = {
                "key": WEATHER_API_KEY,
                "q": location,
                "alerts": "yes"
            }
            
            response = requests.get(f"{WEATHER_API_BASE_URL}/current.json", params=params)
            
            if response.status_code == 200:
                data = response.json()
                alerts = data.get("alerts", {})
                return jsonify({
                    "status": "success",
                    "location": data.get("location"),
                    "alerts": alerts
                }), 200
            elif response.status_code == 400:
                return jsonify({"error": "Location not found"}), 404
            else:
                return jsonify({"error": "Failed to fetch alerts"}), 500
                
        except Exception as e:
            print(f"Error fetching weather alerts: {e}")
            return jsonify({"error": "Failed to fetch alerts"}), 500
    
    
    @weather_bp.route("/aqi", methods=["GET"])
    @token_required_decorator(users_col, app)
    def get_air_quality():
        """
        Get air quality index (AQI) data for a specific location.
        
        Query Parameters:
            - location: string (required) - City name, coordinates (lat,lon), or postal code
        
        Returns:
            - 200: {
                "status": "success",
                "location": {...},
                "current": {
                    "aqi": {
                        "us_epa_index": int,
                        "gb_defra_index": int,
                        "co_ugm3": float,
                        "no2_ugm3": float,
                        "o3_ugm3": float,
                        "pm2_5_ugm3": float,
                        "pm10_ugm3": float,
                        "so2_ugm3": float
                    }
                }
              }
            - 400: {"error": "location parameter is required"}
            - 401: {"error": "Unauthorized"}
            - 500: {"error": "Failed to fetch AQI data"}
        """
        try:
            location = request.args.get("location")
            
            if not location:
                return jsonify({"error": "location parameter is required"}), 400
            
            if not WEATHER_API_KEY:
                return jsonify({"error": "Weather API key not configured"}), 500
            
            # Call weatherapi.com current endpoint with AQI
            params = {
                "key": WEATHER_API_KEY,
                "q": location,
                "aqi": "yes"
            }
            
            response = requests.get(f"{WEATHER_API_BASE_URL}/current.json", params=params)
            
            if response.status_code == 200:
                data = response.json()
                return jsonify({
                    "status": "success",
                    "location": data.get("location"),
                    "current": {
                        "aqi": data.get("current", {}).get("air_quality", {})
                    }
                }), 200
            elif response.status_code == 400:
                return jsonify({"error": "Location not found"}), 404
            else:
                return jsonify({"error": "Failed to fetch AQI data"}), 500
                
        except Exception as e:
            print(f"Error fetching air quality data: {e}")
            return jsonify({"error": "Failed to fetch AQI data"}), 500
    
    
    @weather_bp.route("/astronomy", methods=["GET"])
    @token_required_decorator(users_col, app)
    def get_astronomy_data():
        """
        Get astronomy data (sunrise, sunset, moon phase, etc.) for a location.
        
        Query Parameters:
            - location: string (required) - City name, coordinates (lat,lon), or postal code
            - days: int (optional) - Number of days (1-10, default: 1)
        
        Returns:
            - 200: {
                "status": "success",
                "location": {...},
                "astronomy": [
                    {
                        "date": "YYYY-MM-DD",
                        "sunrise": "HH:MM",
                        "sunset": "HH:MM",
                        "moonrise": "HH:MM",
                        "moonset": "HH:MM",
                        "moon_phase": "New Moon|Waxing Crescent|...",
                        "moon_illumination": float
                    }
                ]
              }
            - 400: {"error": "location parameter is required"}
            - 401: {"error": "Unauthorized"}
            - 500: {"error": "Failed to fetch astronomy data"}
        """
        try:
            location = request.args.get("location")
            days = request.args.get("days", 1)
            
            if not location:
                return jsonify({"error": "location parameter is required"}), 400
            
            if not WEATHER_API_KEY:
                return jsonify({"error": "Weather API key not configured"}), 500
            
            # Validate days parameter
            try:
                days = int(days)
                if days < 1 or days > 10:
                    days = 1
            except (ValueError, TypeError):
                days = 1
            
            # Call weatherapi.com forecast endpoint for astronomy data
            params = {
                "key": WEATHER_API_KEY,
                "q": location,
                "days": days
            }
            
            response = requests.get(f"{WEATHER_API_BASE_URL}/forecast.json", params=params)
            
            if response.status_code == 200:
                data = response.json()
                astronomy_data = []
                
                for day_data in data.get("forecast", {}).get("forecastday", []):
                    astronomy_data.append({
                        "date": day_data.get("date"),
                        "sunrise": day_data.get("astro", {}).get("sunrise"),
                        "sunset": day_data.get("astro", {}).get("sunset"),
                        "moonrise": day_data.get("astro", {}).get("moonrise"),
                        "moonset": day_data.get("astro", {}).get("moonset"),
                        "moon_phase": day_data.get("astro", {}).get("moon_phase"),
                        "moon_illumination": day_data.get("astro", {}).get("moon_illumination")
                    })
                
                return jsonify({
                    "status": "success",
                    "location": data.get("location"),
                    "astronomy": astronomy_data
                }), 200
            elif response.status_code == 400:
                return jsonify({"error": "Location not found"}), 404
            else:
                return jsonify({"error": "Failed to fetch astronomy data"}), 500
                
        except Exception as e:
            print(f"Error fetching astronomy data: {e}")
            return jsonify({"error": "Failed to fetch astronomy data"}), 500
    
    
    # Register the blueprint with the app
    app.register_blueprint(weather_bp)
