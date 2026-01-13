import requests
import sys

# URL from config
BASE_URL = "http://192.180.3.76:8000"

def get_chat_history():
    # Login to get token
    login_url = f"{BASE_URL}/employee/login"
    payload = {
        "emp_id": "JACOBPEREZ001",
        "password": "kTpMtGl9"
    }
    
    try:
        session = requests.Session()
        resp = session.post(login_url, json=payload)
        resp.raise_for_status()
        token = resp.json()["access_token"]
        
        # Get chat history
        chat_url = f"{BASE_URL}/chat/history?limit=1"
        headers = {"Authorization": f"Bearer {token}"}
        
        chat_resp = session.get(chat_url, headers=headers)
        chat_resp.raise_for_status()
        
        data = chat_resp.json()
        if data:
            print("Message Timestamp format:", data[0].get("created_at"))
        else:
            print("No messages found.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_chat_history()
