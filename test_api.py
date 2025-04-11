import requests
import json
from datetime import datetime, timedelta

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1"

# Test user credentials
TEST_USER = {
    "email": "test@example.com",
    "password": "password123"
}

# Function to authenticate and get token
def get_auth_token():
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": TEST_USER["email"], "password": TEST_USER["password"]}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Authentication failed: {response.text}")
        return None

# Function to make authenticated requests
def make_request(method, endpoint, data=None, params=None):
    token = get_auth_token()
    if not token:
        return None
    
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{BASE_URL}/{endpoint}"
    
    if method.lower() == "get":
        response = requests.get(url, headers=headers, params=params)
    elif method.lower() == "post":
        response = requests.post(url, headers=headers, json=data)
    elif method.lower() == "put":
        response = requests.put(url, headers=headers, json=data)
    else:
        print(f"Unsupported method: {method}")
        return None
    
    return response

# Test 1: Get matching preferences
def test_get_matching_preferences():
    print("\n=== Testing Get Matching Preferences ===")
    response = make_request("get", "matching-preferences")
    
    if response and response.status_code == 200:
        print("Success! Matching preferences retrieved:")
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print(f"Failed to get matching preferences: {response.text if response else 'No response'}")
        return None

# Test 2: Update matching preferences
def test_update_matching_preferences(preferences=None):
    print("\n=== Testing Update Matching Preferences ===")
    if not preferences:
        preferences = {
            "max_detour_minutes": 20,
            "max_wait_minutes": 15,
            "max_walking_distance_meters": 1200,
            "prefer_same_enterprise": True,
            "prefer_same_destination": True,
            "prefer_recurring_rides": True
        }
    
    response = make_request("put", "matching-preferences", data=preferences)
    
    if response and response.status_code == 200:
        print("Success! Matching preferences updated:")
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print(f"Failed to update matching preferences: {response.text if response else 'No response'}")
        return None

# Test 3: Get travel patterns
def test_get_travel_patterns():
    print("\n=== Testing Get Travel Patterns ===")
    response = make_request("get", "user-travel-patterns")
    
    if response and response.status_code == 200:
        print("Success! Travel patterns retrieved:")
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print(f"Failed to get travel patterns: {response.text if response else 'No response'}")
        return None

# Test 4: Find matching rides
def test_find_matching_rides():
    print("\n=== Testing Find Matching Rides ===")
    # Prepare search parameters
    tomorrow = datetime.now() + timedelta(days=1)
    search_params = {
        "starting_hub_id": 1,  # Assuming hub ID 1 exists
        "destination_id": 2,   # Assuming destination ID 2 exists
        "departure_time": tomorrow.isoformat(),
        "time_flexibility": 30,
        "max_results": 5
    }
    
    response = make_request("post", "matching/find-rides", data=search_params)
    
    if response and response.status_code == 200:
        print("Success! Matching rides found:")
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print(f"Failed to find matching rides: {response.text if response else 'No response'}")
        return None

# Run all tests
if __name__ == "__main__":
    print("Starting API tests...")
    
    # Test matching preferences
    preferences = test_get_matching_preferences()
    if preferences:
        # Update with slightly different values
        updated_preferences = {
            "max_detour_minutes": preferences.get("max_detour_minutes", 15) + 5,
            "max_wait_minutes": preferences.get("max_wait_minutes", 10) + 5,
            "max_walking_distance_meters": preferences.get("max_walking_distance_meters", 1000) + 200
        }
        test_update_matching_preferences(updated_preferences)
    
    # Test travel patterns
    test_get_travel_patterns()
    
    # Test matching rides
    test_find_matching_rides()
    
    print("\nAPI tests completed!")
