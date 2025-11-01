#!/usr/bin/env python3
"""
RemitChain Backend API Testing Suite
Tests all backend APIs systematically including auth flow and complete remittance process
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Base URL from environment
BASE_URL = "http://localhost:3000"

class RemitChainTester:
    def __init__(self):
        self.session = requests.Session()
        self.base_url = BASE_URL
        self.auth_cookies = None
        self.test_results = []
        
    def log_result(self, test_name, success, details, response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_public_apis(self):
        """Test public APIs that don't require authentication"""
        print("\n=== Testing Public APIs ===")
        
        # Test GET /api/rates
        try:
            response = self.session.get(f"{self.base_url}/api/rates")
            if response.status_code == 200:
                data = response.json()
                required_fields = ['base', 'spread', 'usdcInr', 'updatedAt']
                if all(field in data for field in required_fields):
                    self.log_result("GET /api/rates", True, 
                                  f"Returns FX rates: base={data['base']}, spread={data['spread']}, usdcInr={data['usdcInr']}")
                else:
                    self.log_result("GET /api/rates", False, 
                                  f"Missing required fields. Got: {list(data.keys())}", data)
            else:
                self.log_result("GET /api/rates", False, 
                              f"HTTP {response.status_code}", response.json() if response.content else None)
        except Exception as e:
            self.log_result("GET /api/rates", False, f"Exception: {str(e)}")
        
        # Test POST /api/remit/quote
        try:
            quote_payload = {
                "amountUSDC": "100",
                "corridor": "USDC-INR"
            }
            response = self.session.post(f"{self.base_url}/api/remit/quote", 
                                       json=quote_payload)
            if response.status_code == 200:
                data = response.json()
                required_fields = ['quoteId', 'amountUSDC', 'feeUSDC', 'totalUSDC', 'fx', 'netINR', 'expiresAt']
                if all(field in data for field in required_fields):
                    self.log_result("POST /api/remit/quote", True, 
                                  f"Quote generated: fee={data['feeUSDC']}, fx={data['fx']}, netINR={data['netINR']}")
                else:
                    self.log_result("POST /api/remit/quote", False, 
                                  f"Missing required fields. Got: {list(data.keys())}", data)
            else:
                self.log_result("POST /api/remit/quote", False, 
                              f"HTTP {response.status_code}", response.json() if response.content else None)
        except Exception as e:
            self.log_result("POST /api/remit/quote", False, f"Exception: {str(e)}")
    
    def test_authentication(self):
        """Test authentication flow"""
        print("\n=== Testing Authentication ===")
        
        # Test sign in with credentials
        try:
            # First, get CSRF token
            csrf_response = self.session.get(f"{self.base_url}/api/auth/csrf")
            if csrf_response.status_code == 200:
                csrf_token = csrf_response.json().get('csrfToken')
                
                # Sign in with test user
                signin_payload = {
                    "email": "alice@example.com",
                    "csrfToken": csrf_token,
                    "callbackUrl": f"{self.base_url}",
                    "json": "true"
                }
                
                signin_response = self.session.post(
                    f"{self.base_url}/api/auth/callback/credentials",
                    data=signin_payload,
                    allow_redirects=False
                )
                
                if signin_response.status_code in [200, 302]:
                    # Store cookies for authenticated requests
                    self.auth_cookies = self.session.cookies
                    self.log_result("POST /api/auth/callback/credentials", True, 
                                  f"Authentication successful (HTTP {signin_response.status_code})")
                else:
                    self.log_result("POST /api/auth/callback/credentials", False, 
                                  f"HTTP {signin_response.status_code}", 
                                  signin_response.json() if signin_response.content else None)
            else:
                self.log_result("GET /api/auth/csrf", False, f"HTTP {csrf_response.status_code}")
                
        except Exception as e:
            self.log_result("POST /api/auth/callback/credentials", False, f"Exception: {str(e)}")
        
        # Test session check
        try:
            session_response = self.session.get(f"{self.base_url}/api/auth/session")
            if session_response.status_code == 200:
                session_data = session_response.json()
                if session_data and 'user' in session_data:
                    self.log_result("GET /api/auth/session", True, 
                                  f"Session active for user: {session_data['user'].get('email', 'unknown')}")
                else:
                    self.log_result("GET /api/auth/session", True, 
                                  "No active session (expected for unauthenticated state)")
            else:
                self.log_result("GET /api/auth/session", False, 
                              f"HTTP {session_response.status_code}")
        except Exception as e:
            self.log_result("GET /api/auth/session", False, f"Exception: {str(e)}")
    
    def test_authenticated_apis(self):
        """Test APIs that require authentication"""
        print("\n=== Testing Authenticated APIs ===")
        
        # Test GET /api/contacts
        try:
            response = self.session.get(f"{self.base_url}/api/contacts")
            if response.status_code == 200:
                data = response.json()
                if 'contacts' in data:
                    self.log_result("GET /api/contacts", True, 
                                  f"Retrieved {len(data['contacts'])} contacts")
                else:
                    self.log_result("GET /api/contacts", False, 
                                  "Missing 'contacts' field in response", data)
            elif response.status_code == 401:
                self.log_result("GET /api/contacts", False, 
                              "Unauthorized - authentication may not be working properly")
            else:
                self.log_result("GET /api/contacts", False, 
                              f"HTTP {response.status_code}", 
                              response.json() if response.content else None)
        except Exception as e:
            self.log_result("GET /api/contacts", False, f"Exception: {str(e)}")
        
        # Test POST /api/contacts
        try:
            contact_payload = {
                "name": "Test Contact",
                "type": "ADDRESS",
                "value": "0x1234567890123456789012345678901234567890",
                "linkedAddress": "0x1234567890123456789012345678901234567890",
                "notes": "Test contact created by backend test"
            }
            response = self.session.post(f"{self.base_url}/api/contacts", 
                                       json=contact_payload)
            if response.status_code == 200:
                data = response.json()
                if 'contact' in data:
                    self.log_result("POST /api/contacts", True, 
                                  f"Contact created with ID: {data['contact'].get('id', 'unknown')}")
                else:
                    self.log_result("POST /api/contacts", False, 
                                  "Missing 'contact' field in response", data)
            elif response.status_code == 401:
                self.log_result("POST /api/contacts", False, 
                              "Unauthorized - authentication may not be working properly")
            else:
                self.log_result("POST /api/contacts", False, 
                              f"HTTP {response.status_code}", 
                              response.json() if response.content else None)
        except Exception as e:
            self.log_result("POST /api/contacts", False, f"Exception: {str(e)}")
    
    def test_remittance_flow(self):
        """Test complete remittance flow: intent -> confirm -> receipt"""
        print("\n=== Testing Complete Remittance Flow ===")
        
        intent_id = None
        receipt_id = None
        
        # Step 1: Create remittance intent
        try:
            intent_payload = {
                "receiverType": "ADDRESS",
                "receiverAddress": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
                "corridor": "USDC-INR",
                "amountUSDC": "100",
                "feeUSDC": "0.25"
            }
            response = self.session.post(f"{self.base_url}/api/remit/intent", 
                                       json=intent_payload)
            if response.status_code == 200:
                data = response.json()
                if 'intentId' in data:
                    intent_id = data['intentId']
                    self.log_result("POST /api/remit/intent", True, 
                                  f"Intent created with ID: {intent_id}")
                else:
                    self.log_result("POST /api/remit/intent", False, 
                                  "Missing 'intentId' field in response", data)
            elif response.status_code == 401:
                self.log_result("POST /api/remit/intent", False, 
                              "Unauthorized - authentication may not be working properly")
            else:
                self.log_result("POST /api/remit/intent", False, 
                              f"HTTP {response.status_code}", 
                              response.json() if response.content else None)
        except Exception as e:
            self.log_result("POST /api/remit/intent", False, f"Exception: {str(e)}")
        
        # Step 2: Confirm remittance (only if intent was created)
        if intent_id:
            try:
                # Generate a valid 64-character hex hash
                import hashlib
                hash_input = f"test_tx_{intent_id}_{int(time.time())}"
                tx_hash = "0x" + hashlib.sha256(hash_input.encode()).hexdigest()
                
                confirm_payload = {
                    "intentId": intent_id,
                    "txHash": tx_hash,
                    "senderAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
                }
                response = self.session.post(f"{self.base_url}/api/remit/confirm", 
                                           json=confirm_payload)
                if response.status_code == 200:
                    data = response.json()
                    if 'receiptId' in data:
                        receipt_id = data['receiptId']
                        sandbox_mode = data.get('sandbox', False)
                        fraud_flags = data.get('fraudFlags', 0)
                        self.log_result("POST /api/remit/confirm", True, 
                                      f"Remittance confirmed. Receipt ID: {receipt_id}, Sandbox: {sandbox_mode}, Fraud flags: {fraud_flags}")
                    else:
                        self.log_result("POST /api/remit/confirm", False, 
                                      "Missing 'receiptId' field in response", data)
                elif response.status_code == 401:
                    self.log_result("POST /api/remit/confirm", False, 
                                  "Unauthorized - authentication may not be working properly")
                else:
                    self.log_result("POST /api/remit/confirm", False, 
                                  f"HTTP {response.status_code}", 
                                  response.json() if response.content else None)
            except Exception as e:
                self.log_result("POST /api/remit/confirm", False, f"Exception: {str(e)}")
        
        # Step 3: Get receipt details (only if receipt was created)
        if receipt_id:
            try:
                response = self.session.get(f"{self.base_url}/api/remit/{receipt_id}")
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ['id', 'amountUSDC', 'feeUSDC', 'corridor', 'timestamp', 'fxAtSettlement']
                    if all(field in data for field in required_fields):
                        self.log_result("GET /api/remit/{id}", True, 
                                      f"Receipt retrieved: amount={data['amountUSDC']}, fee={data['feeUSDC']}, fx={data['fxAtSettlement']}")
                    else:
                        self.log_result("GET /api/remit/{id}", False, 
                                      f"Missing required fields. Got: {list(data.keys())}", data)
                elif response.status_code == 401:
                    self.log_result("GET /api/remit/{id}", False, 
                                  "Unauthorized - authentication may not be working properly")
                elif response.status_code == 403:
                    self.log_result("GET /api/remit/{id}", False, 
                                  "Forbidden - authorization check failed")
                else:
                    self.log_result("GET /api/remit/{id}", False, 
                                  f"HTTP {response.status_code}", 
                                  response.json() if response.content else None)
            except Exception as e:
                self.log_result("GET /api/remit/{id}", False, f"Exception: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid quote request
        try:
            invalid_payload = {"amountUSDC": "invalid", "corridor": "INVALID"}
            response = self.session.post(f"{self.base_url}/api/remit/quote", 
                                       json=invalid_payload)
            if response.status_code == 400:
                self.log_result("POST /api/remit/quote (invalid)", True, 
                              "Properly handles invalid input with 400 error")
            else:
                self.log_result("POST /api/remit/quote (invalid)", False, 
                              f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("POST /api/remit/quote (invalid)", False, f"Exception: {str(e)}")
        
        # Test accessing non-existent receipt
        try:
            fake_id = str(uuid.uuid4())
            response = self.session.get(f"{self.base_url}/api/remit/{fake_id}")
            if response.status_code == 404:
                self.log_result("GET /api/remit/{fake_id}", True, 
                              "Properly handles non-existent receipt with 404 error")
            else:
                self.log_result("GET /api/remit/{fake_id}", False, 
                              f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("GET /api/remit/{fake_id}", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting RemitChain Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"Test started at: {datetime.now().isoformat()}")
        
        # Run test suites in order
        self.test_public_apis()
        self.test_authentication()
        self.test_authenticated_apis()
        self.test_remittance_flow()
        self.test_error_handling()
        
        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        print(f"\nTest completed at: {datetime.now().isoformat()}")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = RemitChainTester()
    results = tester.run_all_tests()