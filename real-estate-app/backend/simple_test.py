#!/usr/bin/env python3
"""
Simple test to isolate the City import issue
"""

import sys
import os

# Add the data-collection directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data-collection'))

print("Testing individual imports...")

try:
    from database import DatabaseManager
    print("✓ Database import successful")
except Exception as e:
    print(f"❌ Database import failed: {e}")

try:
    from location_types.location import KHARKIV_CITY, getAllDistricts, getDistrictsForKharkiv
    print("✓ Location types import successful")
except Exception as e:
    print(f"❌ Location types import failed: {e}")

try:
    from models import PropertyListing
    print("✓ PropertyListing import successful")
except Exception as e:
    print(f"❌ PropertyListing import failed: {e}")

try:
    from models import City
    print("✓ City model import successful")
except Exception as e:
    print(f"❌ City model import failed: {e}")

try:
    from ml_model import RealEstateMLModel
    print("✓ ML model import successful")
except Exception as e:
    print(f"❌ ML model import failed: {e}")

try:
    from notifications import router as notifications_router
    print("✓ Notifications import successful")
except Exception as e:
    print(f"❌ Notifications import failed: {e}")
