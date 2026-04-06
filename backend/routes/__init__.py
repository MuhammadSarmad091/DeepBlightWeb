"""Routes package for API endpoints"""
from .leafscan import setup_leafscan_routes
from .insectscan import setup_insectscan_routes
from .plants import setup_plants_routes
from .weather import setup_weather_routes

__all__ = [
    "setup_leafscan_routes",
    "setup_insectscan_routes",
    "setup_plants_routes",
    "setup_weather_routes",
]
