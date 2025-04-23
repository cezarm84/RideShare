"""
Test script for the enhanced messaging API endpoints.
"""

import requests
import json
import time

# Base URL for the API
BASE_URL = "http://127.0.0.1:8000/api/v1"

# Admin credentials
ADMIN_EMAIL = "admin@rideshare.com"
ADMIN_PASSWORD = "admin123"

# Test user credentials (create this user if it doesn't exist)
TEST_USER_EMAIL = "test_messaging@example.com"
TEST_USER_PASSWORD = "password123"

def login(email, password):
    """Login and get access token"""
    response = requests.post(
        f"{BASE_URL}/auth/token",
        data={"username": email, "password": password}
    )
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return None

    return response.json()["access_token"]

def create_test_user(admin_token):
    """Create a test user if it doesn't exist"""
    # Check if user exists
    response = requests.get(
        f"{BASE_URL}/users/by-email/{TEST_USER_EMAIL}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    if response.status_code == 200:
        print("Test user already exists")
        return response.json()["id"]

    # Create user
    user_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "first_name": "Test",
        "last_name": "User",
        "phone_number": "1234567890",
        "is_active": True
    }

    response = requests.post(
        f"{BASE_URL}/users",
        json=user_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    if response.status_code != 201:
        # If user already exists, try to get the user ID
        if "Email already registered" in response.text:
            print("Test user already exists, trying to get user ID")
            # Get all users and find the test user
            users_response = requests.get(
                f"{BASE_URL}/users",
                headers={"Authorization": f"Bearer {admin_token}"}
            )

            if users_response.status_code == 200:
                users = users_response.json()
                for user in users:
                    if user.get("email") == TEST_USER_EMAIL:
                        print(f"Found test user with ID: {user['id']}")
                        return user["id"]

            print("Could not find test user ID")
            return None
        else:
            print(f"Failed to create test user: {response.text}")
            return None

    print("Test user created successfully")
    return response.json()["id"]

def test_create_channel(token, member_ids):
    """Test creating a channel"""
    channel_data = {
        "name": "Test Channel",
        "channel_type": "community",
        "member_ids": member_ids,
        "description": "A test channel for API testing",
        "initial_message": "Welcome to the test channel!"
    }

    response = requests.post(
        f"{BASE_URL}/chat/channels",
        json=channel_data,
        headers={"Authorization": f"Bearer {token}"}
    )

    if response.status_code not in [200, 201]:
        print(f"Failed to create channel: {response.text}")
        return None

    print("Channel created successfully")
    channel_id = response.json().get("id") or response.json().get("channel_id")
    return channel_id

def test_get_channels(token):
    """Test getting all channels"""
    response = requests.get(
        f"{BASE_URL}/chat/channels",
        headers={"Authorization": f"Bearer {token}"}
    )

    if response.status_code != 200:
        print(f"Failed to get channels: {response.text}")
        return None

    channels = response.json()
    print(f"Found {len(channels)} channels")
    return channels

def test_get_channel(token, channel_id):
    """Test getting a specific channel"""
    response = requests.get(
        f"{BASE_URL}/chat/channels/{channel_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    if response.status_code != 200:
        print(f"Failed to get channel: {response.text}")
        return None

    channel = response.json()
    print(f"Channel name: {channel['name']}")
    return channel

def test_send_message(token, channel_id, content):
    """Test sending a message"""
    message_data = {
        "content": content
    }

    response = requests.post(
        f"{BASE_URL}/chat/channels/{channel_id}/messages",
        json=message_data,
        headers={"Authorization": f"Bearer {token}"}
    )

    if response.status_code not in [200, 201]:
        print(f"Failed to send message: {response.status_code} - {response.text}")
        return None

    print("Message sent successfully")
    return response.json()

def test_get_messages(token, channel_id):
    """Test getting messages"""
    response = requests.get(
        f"{BASE_URL}/chat/channels/{channel_id}/messages",
        headers={"Authorization": f"Bearer {token}"}
    )

    if response.status_code != 200:
        print(f"Failed to get messages: {response.text}")
        return None

    messages = response.json()
    print(f"Found {len(messages)} messages")
    return messages

def main():
    """Run the tests"""
    print("Testing enhanced messaging API...")

    # Login as admin
    print("\n1. Logging in as admin...")
    admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not admin_token:
        print("Admin login failed. Exiting.")
        return

    # Create a channel with just the admin user
    print("\n2. Creating a channel...")
    channel_id = test_create_channel(admin_token, [])
    if not channel_id:
        print("Failed to create channel. Exiting.")
        return

    # Get all channels
    print("\n3. Getting all channels...")
    channels = test_get_channels(admin_token)
    if not channels:
        print("Failed to get channels. Exiting.")
        return

    # Get specific channel
    print("\n4. Getting specific channel...")
    channel = test_get_channel(admin_token, channel_id)
    if not channel:
        print("Failed to get channel. Exiting.")
        return

    # Send a message as admin
    print("\n5. Sending a message as admin...")
    admin_message = test_send_message(admin_token, channel_id, "Hello from admin!")
    if not admin_message:
        print("Failed to send admin message. Exiting.")
        return

    # Send another message as admin
    print("\n6. Sending another message as admin...")
    admin_message2 = test_send_message(admin_token, channel_id, "This is a second message!")
    if not admin_message2:
        print("Failed to send second admin message. Exiting.")
        return

    # Get messages
    print("\n7. Getting messages...")
    messages = test_get_messages(admin_token, channel_id)
    if not messages:
        print("Failed to get messages. Exiting.")
        return

    print("\nAll tests completed successfully!")

if __name__ == "__main__":
    main()
