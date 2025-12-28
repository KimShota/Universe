#!/usr/bin/env python3
"""
Debug authentication for Universe App
"""

import requests
import subprocess
import time

BACKEND_URL = "https://universe-app-2.preview.emergentagent.com/api"

def create_test_user():
    """Create test user and session"""
    print("Creating test user and session...")
    
    mongosh_command = """
    use('test_database');
    var visitorId = 'debug_user_123';
    var sessionToken = 'debug_session_123';
    
    // Clean up first
    db.users.deleteMany({user_id: visitorId});
    db.user_sessions.deleteMany({user_id: visitorId});
    
    // Create user
    db.users.insertOne({
      user_id: visitorId,
      email: 'debug@example.com',
      name: 'Debug User',
      picture: 'https://via.placeholder.com/150',
      streak: 0,
      coins: 50,
      current_planet: 0,
      last_post_date: null,
      created_at: new Date()
    });
    
    // Create session
    db.user_sessions.insertOne({
      user_id: visitorId,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 7*24*60*60*1000),
      created_at: new Date()
    });
    
    print('User created: ' + visitorId);
    print('Session created: ' + sessionToken);
    """
    
    result = subprocess.run(
        ["mongosh", "--eval", mongosh_command],
        capture_output=True,
        text=True
    )
    
    print("MongoDB output:", result.stdout)
    if result.stderr:
        print("MongoDB errors:", result.stderr)
    
    return "debug_session_123"

def test_auth(session_token):
    """Test authentication"""
    print(f"\nTesting auth with session: {session_token}")
    
    headers = {
        "Authorization": f"Bearer {session_token}",
        "Content-Type": "application/json"
    }
    
    url = f"{BACKEND_URL}/auth/me"
    print(f"Making request to: {url}")
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response body: {response.text}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"Request failed: {e}")
        return False

def check_database():
    """Check database state"""
    print("\nChecking database state...")
    
    check_command = """
    use('test_database');
    print('Users:');
    db.users.find({user_id: 'debug_user_123'}).forEach(printjson);
    print('Sessions:');
    db.user_sessions.find({user_id: 'debug_user_123'}).forEach(printjson);
    """
    
    result = subprocess.run(
        ["mongosh", "--eval", check_command],
        capture_output=True,
        text=True
    )
    
    print("Database state:", result.stdout)

if __name__ == "__main__":
    session_token = create_test_user()
    check_database()
    success = test_auth(session_token)
    
    if success:
        print("\n✅ Authentication successful!")
    else:
        print("\n❌ Authentication failed!")