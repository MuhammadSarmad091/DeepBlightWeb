"""Auth package initialization"""
from .routes import setup_auth_routes
from .decorators import token_required

__all__ = ["setup_auth_routes", "token_required"]
