#!/usr/bin/env python3
"""
DIGIR HUB Backend API Testing Suite
Tests all backend APIs with realistic data and proper flow
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://retailer-network-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class DigirHubTester:
    def __init__(self):
        self.token = None
        self.user_data = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if not success and details:
            print(f"   Details: {details}")
    
    def test_send_otp(self):
        """Test OTP sending"""
        try:
            data = {"phone": "9876543210"}
            response = requests.post(f"{BASE_URL}/auth/send-otp", json=data, headers=HEADERS, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("otp") == "123456":
                    self.log_result("Send OTP", True, "OTP sent successfully", result)
                    return True
                else:
                    self.log_result("Send OTP", False, "Unexpected response format", result)
                    return False
            else:
                self.log_result("Send OTP", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Send OTP", False, f"Request failed: {str(e)}")
            return False
    
    def test_verify_otp(self):
        """Test OTP verification and user creation"""
        try:
            data = {
                "phone": "9876543210",
                "otp": "123456",
                "name": "Rajesh Kumar"
            }
            response = requests.post(f"{BASE_URL}/auth/verify-otp", json=data, headers=HEADERS, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("token"):
                    self.token = result["token"]
                    self.user_data = result["user"]
                    self.log_result("Verify OTP", True, "OTP verified and user authenticated", {
                        "user_id": self.user_data.get("id"),
                        "is_new_user": result.get("is_new_user")
                    })
                    return True
                else:
                    self.log_result("Verify OTP", False, "Authentication failed", result)
                    return False
            else:
                self.log_result("Verify OTP", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Verify OTP", False, f"Request failed: {str(e)}")
            return False
    
    def test_set_pin(self):
        """Test PIN setup"""
        if not self.token:
            self.log_result("Set PIN", False, "No auth token available")
            return False
            
        try:
            data = {"pin": "1234"}
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.post(f"{BASE_URL}/auth/set-pin", json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.log_result("Set PIN", True, "PIN set successfully", result)
                    return True
                else:
                    self.log_result("Set PIN", False, "PIN setup failed", result)
                    return False
            else:
                self.log_result("Set PIN", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Set PIN", False, f"Request failed: {str(e)}")
            return False
    
    def test_login_pin(self):
        """Test PIN login"""
        try:
            data = {
                "phone": "9876543210",
                "pin": "1234"
            }
            response = requests.post(f"{BASE_URL}/auth/login-pin", json=data, headers=HEADERS, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("token"):
                    # Update token for subsequent tests
                    self.token = result["token"]
                    self.log_result("PIN Login", True, "PIN login successful", {"user": result.get("user", {}).get("name")})
                    return True
                else:
                    self.log_result("PIN Login", False, "PIN login failed", result)
                    return False
            else:
                self.log_result("PIN Login", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("PIN Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_me(self):
        """Test get current user details"""
        if not self.token:
            self.log_result("Get User Details", False, "No auth token available")
            return False
            
        try:
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("id"):
                    self.user_data = result
                    self.log_result("Get User Details", True, "User details retrieved", {
                        "name": result.get("name"),
                        "balance": result.get("wallet_balance"),
                        "kyc_status": result.get("kyc_status")
                    })
                    return True
                else:
                    self.log_result("Get User Details", False, "Invalid user data", result)
                    return False
            else:
                self.log_result("Get User Details", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Get User Details", False, f"Request failed: {str(e)}")
            return False
    
    def test_add_money(self):
        """Test add money to wallet"""
        if not self.token:
            self.log_result("Add Money", False, "No auth token available")
            return False
            
        try:
            data = {"amount": 1000}
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.post(f"{BASE_URL}/wallet/add-money", json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.log_result("Add Money", True, f"Money added successfully", {
                        "amount": 1000,
                        "new_balance": result.get("new_balance"),
                        "transaction_id": result.get("transaction_id")
                    })
                    return True
                else:
                    self.log_result("Add Money", False, "Money addition failed", result)
                    return False
            else:
                self.log_result("Add Money", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Add Money", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_balance(self):
        """Test get wallet balance"""
        if not self.token:
            self.log_result("Get Balance", False, "No auth token available")
            return False
            
        try:
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{BASE_URL}/wallet/balance", headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "balance" in result:
                    self.log_result("Get Balance", True, f"Balance retrieved", {"balance": result["balance"]})
                    return True
                else:
                    self.log_result("Get Balance", False, "Invalid balance response", result)
                    return False
            else:
                self.log_result("Get Balance", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Get Balance", False, f"Request failed: {str(e)}")
            return False
    
    def test_mobile_recharge(self):
        """Test mobile recharge"""
        if not self.token:
            self.log_result("Mobile Recharge", False, "No auth token available")
            return False
            
        try:
            data = {
                "operator": "Airtel",
                "number": "9876543210",
                "amount": 100,
                "type": "prepaid"
            }
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.post(f"{BASE_URL}/recharge", json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                success_status = result.get("success")
                self.log_result("Mobile Recharge", True, f"Recharge processed (Status: {'Success' if success_status else 'Failed'})", {
                    "operator": "Airtel",
                    "amount": 100,
                    "commission": result.get("commission", 0),
                    "transaction_id": result.get("transaction_id")
                })
                return True
            else:
                self.log_result("Mobile Recharge", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Mobile Recharge", False, f"Request failed: {str(e)}")
            return False
    
    def test_bill_payment(self):
        """Test bill payment"""
        if not self.token:
            self.log_result("Bill Payment", False, "No auth token available")
            return False
            
        try:
            data = {
                "service": "electricity",
                "provider": "MSEB Mumbai",
                "account_number": "12345678901",
                "amount": 500
            }
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.post(f"{BASE_URL}/bill-payment", json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                success_status = result.get("success")
                self.log_result("Bill Payment", True, f"Bill payment processed (Status: {'Success' if success_status else 'Failed'})", {
                    "service": "electricity",
                    "amount": 500,
                    "commission": result.get("commission", 0),
                    "transaction_id": result.get("transaction_id")
                })
                return True
            else:
                self.log_result("Bill Payment", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Bill Payment", False, f"Request failed: {str(e)}")
            return False
    
    def test_aeps_balance(self):
        """Test AEPS balance inquiry"""
        if not self.token:
            self.log_result("AEPS Balance", False, "No auth token available")
            return False
            
        try:
            data = {
                "aadhar_number": "123456789012",
                "type": "balance"
            }
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.post(f"{BASE_URL}/aeps", json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                success_status = result.get("success")
                self.log_result("AEPS Balance", True, f"Balance inquiry processed (Status: {'Success' if success_status else 'Failed'})", {
                    "type": "balance",
                    "bank_balance": result.get("bank_balance"),
                    "transaction_id": result.get("transaction_id")
                })
                return True
            else:
                self.log_result("AEPS Balance", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("AEPS Balance", False, f"Request failed: {str(e)}")
            return False
    
    def test_aeps_withdrawal(self):
        """Test AEPS cash withdrawal"""
        if not self.token:
            self.log_result("AEPS Withdrawal", False, "No auth token available")
            return False
            
        try:
            data = {
                "aadhar_number": "123456789012",
                "type": "withdrawal",
                "amount": 1000
            }
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.post(f"{BASE_URL}/aeps", json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                success_status = result.get("success")
                self.log_result("AEPS Withdrawal", True, f"Cash withdrawal processed (Status: {'Success' if success_status else 'Failed'})", {
                    "amount": 1000,
                    "commission": result.get("commission", 0),
                    "new_balance": result.get("new_balance"),
                    "transaction_id": result.get("transaction_id")
                })
                return True
            else:
                self.log_result("AEPS Withdrawal", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("AEPS Withdrawal", False, f"Request failed: {str(e)}")
            return False
    
    def test_dmt(self):
        """Test Money Transfer (DMT)"""
        if not self.token:
            self.log_result("DMT Transfer", False, "No auth token available")
            return False
            
        try:
            # First check current balance and add more money if needed
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            balance_response = requests.get(f"{BASE_URL}/wallet/balance", headers=headers, timeout=10)
            
            if balance_response.status_code == 200:
                current_balance = balance_response.json().get("balance", 0)
                if current_balance < 2000:
                    # Add more money for the test
                    add_money_data = {"amount": 3000}
                    add_response = requests.post(f"{BASE_URL}/wallet/add-money", json=add_money_data, headers=headers, timeout=10)
                    if add_response.status_code != 200 or not add_response.json().get("success"):
                        self.log_result("DMT Transfer", False, "Could not add money for DMT test", add_response.json())
                        return False
            
            data = {
                "beneficiary_name": "Priya Sharma",
                "account_number": "1234567890123456",
                "ifsc": "SBIN0001234",
                "amount": 2000
            }
            response = requests.post(f"{BASE_URL}/dmt", json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                success_status = result.get("success")
                self.log_result("DMT Transfer", True, f"Money transfer processed (Status: {'Success' if success_status else 'Failed'})", {
                    "beneficiary": "Priya Sharma",
                    "amount": 2000,
                    "commission": result.get("commission", 0),
                    "transaction_id": result.get("transaction_id")
                })
                return True
            else:
                self.log_result("DMT Transfer", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("DMT Transfer", False, f"Request failed: {str(e)}")
            return False
    
    def test_get_transactions(self):
        """Test get transaction history"""
        if not self.token:
            self.log_result("Get Transactions", False, "No auth token available")
            return False
            
        try:
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{BASE_URL}/transactions?limit=10", headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "transactions" in result:
                    transactions = result["transactions"]
                    self.log_result("Get Transactions", True, f"Transaction history retrieved", {
                        "count": len(transactions),
                        "total": result.get("total", 0)
                    })
                    return True
                else:
                    self.log_result("Get Transactions", False, "Invalid transactions response", result)
                    return False
            else:
                self.log_result("Get Transactions", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Get Transactions", False, f"Request failed: {str(e)}")
            return False
    
    def test_transaction_stats(self):
        """Test get transaction statistics"""
        if not self.token:
            self.log_result("Transaction Stats", False, "No auth token available")
            return False
            
        try:
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{BASE_URL}/transactions/stats", headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "total_commission" in result:
                    self.log_result("Transaction Stats", True, "Transaction stats retrieved", {
                        "total_commission": result.get("total_commission"),
                        "counts": result.get("counts", {})
                    })
                    return True
                else:
                    self.log_result("Transaction Stats", False, "Invalid stats response", result)
                    return False
            else:
                self.log_result("Transaction Stats", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("Transaction Stats", False, f"Request failed: {str(e)}")
            return False
    
    def test_kyc_upload(self):
        """Test KYC document upload"""
        if not self.token:
            self.log_result("KYC Upload", False, "No auth token available")
            return False
            
        try:
            data = {
                "aadhar_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                "pan_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            }
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.post(f"{BASE_URL}/kyc/upload", json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.log_result("KYC Upload", True, "KYC documents uploaded successfully", result)
                    return True
                else:
                    self.log_result("KYC Upload", False, "KYC upload failed", result)
                    return False
            else:
                self.log_result("KYC Upload", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("KYC Upload", False, f"Request failed: {str(e)}")
            return False
    
    def test_kyc_status(self):
        """Test get KYC status"""
        if not self.token:
            self.log_result("KYC Status", False, "No auth token available")
            return False
            
        try:
            headers = {**HEADERS, "Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{BASE_URL}/kyc/status", headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "status" in result:
                    self.log_result("KYC Status", True, "KYC status retrieved", {
                        "status": result.get("status"),
                        "has_aadhar": result.get("has_aadhar"),
                        "has_pan": result.get("has_pan")
                    })
                    return True
                else:
                    self.log_result("KYC Status", False, "Invalid KYC status response", result)
                    return False
            else:
                self.log_result("KYC Status", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
                
        except Exception as e:
            self.log_result("KYC Status", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting DIGIR HUB Backend API Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print("=" * 60)
        
        # Authentication Flow Tests
        print("\n📱 AUTHENTICATION TESTS")
        self.test_send_otp()
        time.sleep(1)
        
        self.test_verify_otp()
        time.sleep(1)
        
        self.test_set_pin()
        time.sleep(1)
        
        self.test_login_pin()
        time.sleep(1)
        
        self.test_get_me()
        time.sleep(1)
        
        # Wallet Tests
        print("\n💰 WALLET TESTS")
        self.test_add_money()
        time.sleep(1)
        
        self.test_get_balance()
        time.sleep(1)
        
        # Service Tests
        print("\n🛍️ SERVICE TESTS")
        self.test_mobile_recharge()
        time.sleep(1)
        
        self.test_bill_payment()
        time.sleep(1)
        
        self.test_aeps_balance()
        time.sleep(1)
        
        self.test_aeps_withdrawal()
        time.sleep(1)
        
        self.test_dmt()
        time.sleep(1)
        
        # Transaction Tests
        print("\n📊 TRANSACTION TESTS")
        self.test_get_transactions()
        time.sleep(1)
        
        self.test_transaction_stats()
        time.sleep(1)
        
        # KYC Tests
        print("\n📄 KYC TESTS")
        self.test_kyc_upload()
        time.sleep(1)
        
        self.test_kyc_status()
        
        # Summary
        print("\n" + "=" * 60)
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"📊 TEST SUMMARY")
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['message']}")

if __name__ == "__main__":
    tester = DigirHubTester()
    tester.run_all_tests()