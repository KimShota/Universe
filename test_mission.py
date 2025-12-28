#!/usr/bin/env python3
"""
Test mission complete functionality
"""

import requests
import subprocess
from datetime import datetime, timezone

BACKEND_URL = "https://universe-app-2.preview.emergentagent.com/api"

def create_test_user():
    """Create test user and session"""
    mongosh_command = """
    use('test_database');
    var visitorId = 'mission_test_user';
    var sessionToken = 'mission_test_session';
    
    // Clean up first
    db.users.deleteMany({user_id: visitorId});
    db.user_sessions.deleteMany({user_id: visitorId});
    db.missions.deleteMany({user_id: visitorId});
    
    // Create user
    db.users.insertOne({
      user_id: visitorId,
      email: 'mission@example.com',
      name: 'Mission Test User',
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
    
    print('Mission test setup complete');
    """
    
    result = subprocess.run(
        ["mongosh", "--eval", mongosh_command],
        capture_output=True,
        text=True
    )
    
    print("Setup result:", result.stdout)
    return "mission_test_session"

def test_mission_complete(session_token):
    """Test mission complete"""
    headers = {
        "Authorization": f"Bearer {session_token}",
        "Content-Type": "application/json"
    }
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data = {"date": today}
    
    url = f"{BACKEND_URL}/mission/complete"
    print(f"Testing mission complete with date: {today}")
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"Request failed: {e}")
        return False

if __name__ == "__main__":
    session_token = create_test_user()
    success = test_mission_complete(session_token)
    
    if success:
        print("\n✅ Mission complete test successful!")
    else:
        print("\n❌ Mission complete test failed!")