#!/usr/bin/env python3
"""
Universe App Backend Testing Suite
Tests all backend APIs according to the test plan in test_result.md
"""

import requests
import json
import subprocess
import time
import os
from datetime import datetime, timezone

# Backend URL from frontend environment
BACKEND_URL = "https://universe-app-2.preview.emergentagent.com/api"

class UniverseBackendTester:
    def __init__(self):
        self.session_token = None
        self.user_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def create_test_user_and_session(self):
        """Create test user and session using mongosh"""
        print("\n=== Creating Test User and Session ===")
        
        try:
            # Create test user and session using mongosh
            mongosh_command = """
            use('test_database');
            var visitorId = 'user_' + Date.now();
            var sessionToken = 'test_session_' + Date.now();
            var email = 'test.user.' + Date.now() + '@example.com';
            
            db.users.insertOne({
              user_id: visitorId,
              email: email,
              name: 'Test Creator',
              picture: 'https://via.placeholder.com/150',
              streak: 0,
              coins: 50,
              current_planet: 0,
              last_post_date: null,
              created_at: new Date()
            });
            
            db.user_sessions.insertOne({
              user_id: visitorId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000),
              created_at: new Date()
            });
            
            print('SESSION_TOKEN:' + sessionToken);
            print('USER_ID:' + visitorId);
            print('EMAIL:' + email);
            """
            
            result = subprocess.run(
                ["mongosh", "--eval", mongosh_command],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                self.log_result("Create Test User", False, f"MongoDB command failed: {result.stderr}")
                return False
            
            # Parse output to get session token and user ID
            output_lines = result.stdout.split('\n')
            for line in output_lines:
                if line.startswith('SESSION_TOKEN:'):
                    self.session_token = line.replace('SESSION_TOKEN:', '')
                elif line.startswith('USER_ID:'):
                    self.user_id = line.replace('USER_ID:', '')
                elif line.startswith('EMAIL:'):
                    self.email = line.replace('EMAIL:', '')
            
            if not self.session_token or not self.user_id:
                self.log_result("Create Test User", False, "Failed to extract session token or user ID")
                return False
            
            self.log_result("Create Test User", True, f"Created user {self.user_id} with session {self.session_token[:20]}...")
            return True
            
        except Exception as e:
            self.log_result("Create Test User", False, f"Exception: {str(e)}")
            return False
    
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with authentication"""
        url = f"{BACKEND_URL}{endpoint}"
        
        if headers is None:
            headers = {}
        
        # Add authorization header
        if self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        
        headers["Content-Type"] = "application/json"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None
    
    def test_auth_me(self):
        """Test GET /api/auth/me"""
        print("\n=== Testing Authentication ===")
        
        response = self.make_request("GET", "/auth/me")
        
        if response is None:
            self.log_result("Auth Me", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if data.get("user_id") == self.user_id:
                self.log_result("Auth Me", True, "Authentication successful", data)
                return True
            else:
                self.log_result("Auth Me", False, f"User ID mismatch: expected {self.user_id}, got {data.get('user_id')}")
                return False
        else:
            self.log_result("Auth Me", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_user_profile(self):
        """Test GET /api/user/profile"""
        print("\n=== Testing User Profile ===")
        
        response = self.make_request("GET", "/user/profile")
        
        if response is None:
            self.log_result("User Profile", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["user_id", "email", "name", "streak", "coins", "current_planet"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                self.log_result("User Profile", True, "Profile data retrieved successfully", data)
                return True
            else:
                self.log_result("User Profile", False, f"Missing fields: {missing_fields}")
                return False
        else:
            self.log_result("User Profile", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_mission_today_not_completed(self):
        """Test GET /api/mission/today (should show not completed)"""
        print("\n=== Testing Mission Today (Not Completed) ===")
        
        response = self.make_request("GET", "/mission/today")
        
        if response is None:
            self.log_result("Mission Today (Not Completed)", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if data.get("completed") == False:
                self.log_result("Mission Today (Not Completed)", True, "Mission correctly shows as not completed", data)
                return True
            else:
                self.log_result("Mission Today (Not Completed)", False, f"Expected completed=False, got {data.get('completed')}")
                return False
        else:
            self.log_result("Mission Today (Not Completed)", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_mission_complete(self):
        """Test POST /api/mission/complete"""
        print("\n=== Testing Mission Complete ===")
        
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        data = {"date": today}
        
        response = self.make_request("POST", "/mission/complete", data)
        
        if response is None:
            self.log_result("Mission Complete", False, "Request failed")
            return False
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("coins_earned") == 10:
                self.log_result("Mission Complete", True, "Mission completed successfully", response_data)
                return True
            else:
                self.log_result("Mission Complete", False, f"Expected 10 coins, got {response_data.get('coins_earned')}")
                return False
        else:
            self.log_result("Mission Complete", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_mission_today_completed(self):
        """Test GET /api/mission/today (should show completed)"""
        print("\n=== Testing Mission Today (Completed) ===")
        
        response = self.make_request("GET", "/mission/today")
        
        if response is None:
            self.log_result("Mission Today (Completed)", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if data.get("completed") == True:
                self.log_result("Mission Today (Completed)", True, "Mission correctly shows as completed", data)
                return True
            else:
                self.log_result("Mission Today (Completed)", False, f"Expected completed=True, got {data.get('completed')}")
                return False
        else:
            self.log_result("Mission Today (Completed)", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_sos_complete(self):
        """Test POST /api/sos/complete"""
        print("\n=== Testing SOS Complete ===")
        
        data = {
            "issue_type": "embarrassed",
            "asteroids": [
                "I'm not good enough to create content",
                "People will judge my content negatively", 
                "I don't have anything valuable to share"
            ],
            "affirmations": [
                "I have unique perspectives worth sharing",
                "My content helps and inspires others",
                "I am constantly learning and improving",
                "My voice matters in this space"
            ]
        }
        
        response = self.make_request("POST", "/sos/complete", data)
        
        if response is None:
            self.log_result("SOS Complete", False, "Request failed")
            return False
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("coins_earned") == 10:
                self.log_result("SOS Complete", True, "SOS completed successfully", response_data)
                return True
            else:
                self.log_result("SOS Complete", False, f"Expected 10 coins, got {response_data.get('coins_earned')}")
                return False
        else:
            self.log_result("SOS Complete", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_sos_history(self):
        """Test GET /api/sos/history"""
        print("\n=== Testing SOS History ===")
        
        response = self.make_request("GET", "/sos/history")
        
        if response is None:
            self.log_result("SOS History", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "history" in data and isinstance(data["history"], list):
                self.log_result("SOS History", True, f"Retrieved {len(data['history'])} SOS entries", data)
                return True
            else:
                self.log_result("SOS History", False, "Invalid response format")
                return False
        else:
            self.log_result("SOS History", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_creator_universe_get(self):
        """Test GET /api/creator-universe"""
        print("\n=== Testing Creator Universe Get ===")
        
        response = self.make_request("GET", "/creator-universe")
        
        if response is None:
            self.log_result("Creator Universe Get", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["user_id", "overarching_goal", "content_pillars"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields and isinstance(data.get("content_pillars"), list):
                self.log_result("Creator Universe Get", True, "Creator universe retrieved successfully", data)
                return True
            else:
                self.log_result("Creator Universe Get", False, f"Missing fields: {missing_fields}")
                return False
        else:
            self.log_result("Creator Universe Get", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_creator_universe_update(self):
        """Test PUT /api/creator-universe"""
        print("\n=== Testing Creator Universe Update ===")
        
        data = {
            "overarching_goal": "Become a successful content creator and inspire others",
            "content_pillars": [
                {
                    "title": "Educational Content",
                    "ideas": ["Tutorial videos", "How-to guides", "Tips and tricks"]
                },
                {
                    "title": "Behind the Scenes",
                    "ideas": ["Daily routines", "Workspace tours", "Process videos"]
                },
                {
                    "title": "Community Building",
                    "ideas": ["Q&A sessions", "Live streams", "Community challenges"]
                },
                {
                    "title": "Personal Growth",
                    "ideas": ["Journey updates", "Lessons learned", "Motivational content"]
                }
            ]
        }
        
        response = self.make_request("PUT", "/creator-universe", data)
        
        if response is None:
            self.log_result("Creator Universe Update", False, "Request failed")
            return False
        
        if response.status_code == 200:
            response_data = response.json()
            if (response_data.get("overarching_goal") == data["overarching_goal"] and 
                len(response_data.get("content_pillars", [])) == 4):
                self.log_result("Creator Universe Update", True, "Creator universe updated successfully", response_data)
                return True
            else:
                self.log_result("Creator Universe Update", False, "Update data doesn't match")
                return False
        else:
            self.log_result("Creator Universe Update", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_content_tips_quiz(self):
        """Test POST /api/content-tips/quiz"""
        print("\n=== Testing Content Tips Quiz ===")
        
        data = {
            "tip_id": "what-to-post",
            "score": 3
        }
        
        response = self.make_request("POST", "/content-tips/quiz", data)
        
        if response is None:
            self.log_result("Content Tips Quiz", False, "Request failed")
            return False
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("coins_earned") == 10:
                self.log_result("Content Tips Quiz", True, "Quiz completed successfully", response_data)
                return True
            else:
                self.log_result("Content Tips Quiz", False, f"Expected 10 coins, got {response_data.get('coins_earned')}")
                return False
        else:
            self.log_result("Content Tips Quiz", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_content_tips_progress(self):
        """Test GET /api/content-tips/progress"""
        print("\n=== Testing Content Tips Progress ===")
        
        response = self.make_request("GET", "/content-tips/progress")
        
        if response is None:
            self.log_result("Content Tips Progress", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "progress" in data and isinstance(data["progress"], list):
                self.log_result("Content Tips Progress", True, f"Retrieved progress for {len(data['progress'])} tips", data)
                return True
            else:
                self.log_result("Content Tips Progress", False, "Invalid response format")
                return False
        else:
            self.log_result("Content Tips Progress", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data from database"""
        print("\n=== Cleaning Up Test Data ===")
        
        try:
            cleanup_command = f"""
            use('test_database');
            db.users.deleteMany({{user_id: '{self.user_id}'}});
            db.user_sessions.deleteMany({{user_id: '{self.user_id}'}});
            db.missions.deleteMany({{user_id: '{self.user_id}'}});
            db.sos_completions.deleteMany({{user_id: '{self.user_id}'}});
            db.creator_universe.deleteMany({{user_id: '{self.user_id}'}});
            db.content_tips_progress.deleteMany({{user_id: '{self.user_id}'}});
            print('Cleanup completed');
            """
            
            result = subprocess.run(
                ["mongosh", "--eval", cleanup_command],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.log_result("Cleanup", True, "Test data cleaned up successfully")
            else:
                self.log_result("Cleanup", False, f"Cleanup failed: {result.stderr}")
                
        except Exception as e:
            self.log_result("Cleanup", False, f"Cleanup exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Universe App Backend Testing Suite")
        print(f"Backend URL: {BACKEND_URL}")
        
        # Setup
        if not self.create_test_user_and_session():
            print("❌ Failed to create test user and session. Aborting tests.")
            return
        
        # High Priority Tests
        print("\n" + "="*60)
        print("HIGH PRIORITY TESTS")
        print("="*60)
        
        # Authentication & User Management
        self.test_auth_me()
        self.test_user_profile()
        
        # Mission System
        self.test_mission_today_not_completed()
        self.test_mission_complete()
        self.test_mission_today_completed()
        
        # SOS System
        self.test_sos_complete()
        self.test_sos_history()
        
        # Medium Priority Tests
        print("\n" + "="*60)
        print("MEDIUM PRIORITY TESTS")
        print("="*60)
        
        # Creator's Universe
        self.test_creator_universe_get()
        self.test_creator_universe_update()
        
        # Content Tips
        self.test_content_tips_quiz()
        self.test_content_tips_progress()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        if passed == len(self.test_results):
            print("\n🎉 ALL TESTS PASSED!")
        else:
            print(f"\n⚠️  {failed} tests failed. Check details above.")

if __name__ == "__main__":
    tester = UniverseBackendTester()
    tester.run_all_tests()