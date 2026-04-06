import os
import requests
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
TREFLE_API_TOKEN = os.environ.get("TREFLE_API_TOKEN")

# Base URL for Trefle API
TREFLE_BASE_URL = "https://trefle.io/api/v1"


def setup_plants_routes(app, users_col, token_required_decorator):
    """
    Setup plants routes using a Blueprint
    
    Args:
        app: Flask app instance
        users_col: MongoDB users collection
        token_required_decorator: Token validation decorator
    """
    plants_bp = Blueprint('plants', __name__, url_prefix='/plants')

    @plants_bp.route("/get", methods=["GET"])
    @token_required_decorator(users_col, app)
    def get_plants():
        """
        Get a paginated list of plants from Trefle API
        Query Parameters:
            - page: int (optional, default=1)
            - per_page: int (optional, default=20, max=100)
        """
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)

            # Validate parameters
            if page < 1:
                return jsonify({"error": "page must be greater than 0"}), 400
            if per_page < 1 or per_page > 100:
                return jsonify({"error": "per_page must be between 1 and 100"}), 400

            # Make request to Trefle API
            url = f"{TREFLE_BASE_URL}/plants"
            headers = {
                "Authorization": f"Bearer {TREFLE_API_TOKEN}"
            }
            params = {
                "page": page,
                "per_page": per_page
            }

            response = requests.get(url, headers=headers, params=params, timeout=10)

            if response.status_code != 200:
                return jsonify({"error": f"Trefle API error: {response.status_code}", "details": response.text}), response.status_code

            data = response.json()
            return jsonify(data), 200

        except requests.exceptions.Timeout:
            return jsonify({"error": "Request to Trefle API timed out"}), 504
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"Request failed: {str(e)}"}), 500
        except Exception as e:
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    @plants_bp.route("/search", methods=["GET"])
    @token_required_decorator(users_col, app)
    def search_plants():
        """
        Search for plants by name
        Query Parameters:
            - q: string (required, search query)
            - page: int (optional, default=1)
            - per_page: int (optional, default=10, max=100)
        """
        try:
            search_query = request.args.get('q', None, type=str)

            if not search_query or search_query.strip() == "":
                return jsonify({"error": "search query 'q' is required"}), 400

            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)

            # Validate parameters
            if page < 1:
                return jsonify({"error": "page must be greater than 0"}), 400
            if per_page < 1 or per_page > 100:
                return jsonify({"error": "per_page must be between 1 and 100"}), 400

            # Make request to Trefle API
            url = f"{TREFLE_BASE_URL}/plants/search"
            headers = {
                "Authorization": f"Bearer {TREFLE_API_TOKEN}"
            }
            params = {
                "q": search_query,
                "page": page,
                "per_page": per_page
            }

            response = requests.get(url, headers=headers, params=params, timeout=10)

            if response.status_code != 200:
                return jsonify({"error": f"Trefle API error: {response.status_code}", "details": response.text}), response.status_code

            data = response.json()
            return jsonify(data), 200

        except requests.exceptions.Timeout:
            return jsonify({"error": "Request to Trefle API timed out"}), 504
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"Request failed: {str(e)}"}), 500
        except Exception as e:
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    @plants_bp.route("/<int:plant_id>", methods=["GET"])
    @token_required_decorator(users_col, app)
    def get_plant_by_id(plant_id):
        """
        Get detailed information about a plant by its ID
        URL Parameters:
            - plant_id: int (required, plant ID from Trefle)
        """
        try:
            if plant_id < 1:
                return jsonify({"error": "plant_id must be greater than 0"}), 400

            # Make request to Trefle API
            url = f"{TREFLE_BASE_URL}/plants/{plant_id}"
            headers = {
                "Authorization": f"Bearer {TREFLE_API_TOKEN}"
            }

            print(f"Requesting URL: {url} with headers: {headers}")

            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code == 404:
                return jsonify({"error": "Plant not found"}), 404
            elif response.status_code != 200:
                return jsonify({"error": f"Trefle API error: {response.status_code}", "details": response.text}), response.status_code


            data = response.json()
            # plantlist = data.get("data", {})
            # plantobj = next((plant for plant in plantlist if plant.get("id") == plant_id), {})

            print(data)

            return jsonify(data), 200

        except requests.exceptions.Timeout:
            return jsonify({"error": "Request to Trefle API timed out"}), 504
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"Request failed: {str(e)}"}), 500
        except Exception as e:
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    # Register the blueprint
    app.register_blueprint(plants_bp)
