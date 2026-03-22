#!/usr/bin/env python3
"""
Focused test for Super Distribution APIs with date filters
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "https://retailer-network-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def test_sales_report_with_filters():
    print("🔍 Testing Sales Report with Date Filters...")
    
    # Create distributor
    print("\n1. Creating distributor...")
    data = {"phone": "5555555555"}
    requests.post(f"{BASE_URL}/auth/send-otp", json=data, headers=HEADERS, timeout=10)
    
    data = {
        "phone": "5555555555",
        "otp": "123456",
        "name": "Test Distributor Sales",
        "role": "distributor"
    }
    response = requests.post(f"{BASE_URL}/auth/verify-otp", json=data, headers=HEADERS, timeout=10)
    
    if response.status_code == 200:
        result = response.json()
        token = result["token"]
        headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        
        # Test sales report without filters
        print("\n2. Testing sales report without filters...")
        response = requests.get(f"{BASE_URL}/reports/sales", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Sales report retrieved")
            print(f"   Summary: {result.get('summary', {})}")
        
        # Test sales report with date filters
        print("\n3. Testing sales report with date filters...")
        start_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = requests.get(
            f"{BASE_URL}/reports/sales?start_date={start_date}&end_date={end_date}", 
            headers=headers, 
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Sales report with date filters retrieved")
            print(f"   Summary: {result.get('summary', {})}")
            print(f"   Date range: {start_date[:10]} to {end_date[:10]}")
        
        # Test referral system with distributor
        print("\n4. Testing referral system...")
        response = requests.get(f"{BASE_URL}/referral/info", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Referral info retrieved")
            print(f"   Referral code: {result.get('referral_code')}")
            print(f"   Total referrals: {result.get('total_referrals')}")
        
        # Test referral claim
        response = requests.post(f"{BASE_URL}/referral/claim", headers=headers, timeout=10)
        print(f"   Claim status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Referral claim processed: {result.get('message')}")

if __name__ == "__main__":
    test_sales_report_with_filters()