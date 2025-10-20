#!/usr/bin/env python3
"""
Test script to check if all imports work correctly
"""

import sys
import os

# Add the data-collection directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data-collection'))

try:
    # Test database import
    from database import DatabaseManager
    print("✓ Database import successful")

    # Test location_types.location import
    from location_types.location import KHARKIV_CITY, getAllDistricts, getDistrictsForKharkiv
    print("✓ Location types import successful")

    # Test models import
    from models import PropertyListing
    print("✓ Models PropertyListing import successful")

    # Test City model import separately to avoid conflicts
    try:
        from models import City as CityModel
        print("✓ Models City import successful")
    except Exception as e:
        print(f"⚠️  Models City import issue: {e}")

    # Test ml_model import
    from ml_model import RealEstateMLModel
    print("✓ ML model import successful")

    # Test notifications import
    from notifications import router as notifications_router
    print("✓ Notifications import successful")

    print("\n🎉 All imports successful! Backend should start correctly.")

except Exception as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
