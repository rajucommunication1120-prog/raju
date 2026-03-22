#!/usr/bin/env python3
"""
Debug script to test distributor creation and role verification
"""

import requests
import json

BASE_URL = "https://retailer-network-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def test_distributor_creation():
    print("🔍 Testing Distributor Creation...")
    
    # Step 1: Send OTP
    print("\n1. Sending OTP...")
    data = {"phone": "7777777777"}  # Different phone number
    response = requests.post(f"{BASE_URL}/auth/send-otp", json=data, headers=HEADERS, timeout=10)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Step 2: Verify OTP with distributor role
    print("\n2. Verifying OTP with distributor role...")
    data = {
        "phone": "7777777777",  # Different phone number
        "otp": "123456",
        "name": "Test Distributor",
        "role": "distributor"
    }
    response = requests.post(f"{BASE_URL}/auth/verify-otp", json=data, headers=HEADERS, timeout=10)
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Response: {json.dumps(result, indent=2)}")
    
    if response.status_code == 200 and result.get("success"):
        token = result["token"]
        user = result["user"]
        print(f"   ✅ User Role: {user.get('role')}")
        print(f"   ✅ User ID: {user.get('id')}")
        
        # Step 3: Test distributor endpoint access
        print("\n3. Testing distributor stats access...")
        headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/distributor/stats", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Distributor stats accessible")
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"   ❌ Access denied: {response.text}")
            
        # Step 4: Test retailer creation
        print("\n4. Testing retailer creation...")
        data = {
            "phone": "8888888888",
            "name": "Test Retailer",
            "email": "retailer@test.com"
        }
        response = requests.post(f"{BASE_URL}/retailer/create", json=data, headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Retailer created successfully")
            print(f"   Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"   ❌ Retailer creation failed: {response.text}")
    else:
        print("   ❌ Distributor creation failed")

if __name__ == "__main__":
    test_distributor_creation()