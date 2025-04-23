"""
Test script for WebSocket functionality.
"""

import asyncio
import json
import websockets
import requests
import time

# Base URL for the API
BASE_URL = "http://127.0.0.1:8000/api/v1"
WS_URL = "ws://127.0.0.1:8000/ws/chat"

# Admin credentials
ADMIN_EMAIL = "admin@rideshare.com"
ADMIN_PASSWORD = "admin123"

async def test_websocket():
    """Test WebSocket functionality"""
    # Login to get token
    print("Logging in as admin...")
    response = requests.post(
        f"{BASE_URL}/auth/token",
        data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )

    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return

    token = response.json()["access_token"]
    print(f"Got token: {token[:10]}...")
    print(f"Full token: {token}")

    # Create a test channel
    print("\nCreating a test channel...")
    channel_data = {
        "name": "WebSocket Test Channel",
        "channel_type": "community",
        "member_ids": [],
        "description": "A test channel for WebSocket testing",
        "initial_message": "Welcome to the WebSocket test channel!"
    }

    response = requests.post(
        f"{BASE_URL}/chat/channels",
        json=channel_data,
        headers={"Authorization": f"Bearer {token}"}
    )

    if response.status_code not in [200, 201]:
        print(f"Failed to create channel: {response.text}")
        return

    channel_id = response.json().get("id") or response.json().get("channel_id")
    print(f"Created channel with ID: {channel_id}")

    # Connect to WebSocket
    print("\nConnecting to WebSocket...")
    try:
        async with websockets.connect(f"{WS_URL}?token={token}") as websocket:
            print("Connected to WebSocket")

            # Subscribe to channel
            print(f"Subscribing to channel {channel_id}...")
            subscribe_payload = json.dumps({
                "type": "subscribe",
                "channel_id": channel_id
            })
            print(f"Sending subscribe payload: {subscribe_payload}")
            await websocket.send(subscribe_payload)

            # Store the channel ID for later use
            subscribed_channel_id = channel_id

            # Wait for subscription confirmation
            response = await websocket.recv()
            print(f"Received: {response}")

            # Send a message via HTTP API
            print("\nSending a message via HTTP API...")
            message_data = {
                "content": "Hello from WebSocket test!"
            }

            # Print the URL we're sending to
            url = f"{BASE_URL}/chat/channels/{subscribed_channel_id}/messages"
            print(f"Sending message to URL: {url}")

            response = requests.post(
                url,
                json=message_data,
                headers={"Authorization": f"Bearer {token}"}
            )

            if response.status_code not in [200, 201]:
                print(f"Failed to send message: {response.status_code} - {response.text}")
                return

            print("Message sent successfully")
            print(f"Response: {response.text[:200]}...")

            # Wait for message via WebSocket
            print("\nWaiting for message via WebSocket...")
            try:
                # Send a ping to make sure the connection is still alive
                print("Sending ping to server...")
                await websocket.send(json.dumps({
                    "type": "ping",
                    "timestamp": time.time()
                }))

                # Set a timeout for receiving the message
                for i in range(10):  # Try up to 10 times
                    try:
                        print(f"Attempt {i+1}/10 to receive message...")
                        response = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        print(f"Received message: {response}")

                        # Parse the message
                        message_data = json.loads(response)
                        if message_data.get("type") == "new_message":
                            print("✅ WebSocket real-time messaging is working!")
                            break
                        elif message_data.get("type") == "pong":
                            print("Received pong response from server")
                        else:
                            print(f"Received message with type: {message_data.get('type')}. Waiting for new_message type...")
                    except asyncio.TimeoutError:
                        print("No message received yet, trying again...")
                else:  # This runs if the loop completes without a break
                    print("❌ Timed out waiting for message. WebSocket real-time messaging may not be working.")
                    print("This could be due to a timing issue or a mismatch in channel IDs.")
                    print("Check the server logs for more information.")
            except Exception as e:
                print(f"❌ Error waiting for message: {str(e)}")

            # Unsubscribe from channel
            print(f"\nUnsubscribing from channel {subscribed_channel_id}...")
            await websocket.send(json.dumps({
                "type": "unsubscribe",
                "channel_id": subscribed_channel_id
            }))

            # Wait for unsubscription confirmation
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"Received: {response}")
            except asyncio.TimeoutError:
                print("No response received for unsubscription")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
