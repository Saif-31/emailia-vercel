from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from config import get_settings
import json
from pathlib import Path

router = APIRouter()
settings = get_settings()

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
]

def get_flow():
    """Create OAuth flow"""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]        
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI
    )
    return flow

@router.get("/connect")
def connect_gmail():
    """Initiate Gmail OAuth flow"""
    print("🔄 /connect endpoint called")
    flow = get_flow()
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    print(f"✅ Generated auth URL")
    return {"authorization_url": authorization_url, "state": state}    

@router.get("/callback")
def oauth_callback(code: str, state: str):
    """Handle OAuth callback"""
    try:
        print(f"🔄 Processing OAuth callback with code: {code[:20]}...")
        
        flow = get_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
        print(f"✅ Token fetched successfully")
        
        # Get user email
        service = build('gmail', 'v1', credentials=credentials)
        profile = service.users().getProfile(userId='me').execute()
        user_email = profile['emailAddress']
        print(f"📧 User email: {user_email}")
        
        # Save token to file (NOT database)
        token_dir = Path("tokens")
        token_dir.mkdir(exist_ok=True)
        
        token_file = token_dir / f"{user_email}_token.json"
        token_data = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        
        with open(token_file, 'w') as f:
            json.dump(token_data, f)
        
        print(f"💾 Token saved to file: {token_file}")
        
        # Redirect to frontend dashboard WITH email parameter
        redirect_url = f"http://localhost:3000/dashboard?email={user_email}"
        print(f"🔀 Redirecting to: {redirect_url}")
        return RedirectResponse(url=redirect_url, status_code=302)

    except Exception as e:
        print(f"❌ OAuth error: {str(e)}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(url=f"http://localhost:3000/?error={str(e)}", status_code=302)

@router.get("/status")
def check_auth_status(email: str):
    """Check if user has valid OAuth tokens"""
    token_file = Path(f"tokens/{email}_token.json")
    return {"authenticated": token_file.exists(), "email": email}

@router.delete("/disconnect")
def disconnect_gmail(email: str):
    """Remove OAuth tokens"""
    token_file = Path(f"tokens/{email}_token.json")
    if token_file.exists():
        token_file.unlink()
        return {"message": "Disconnected successfully"}
    raise HTTPException(status_code=404, detail="Token not found")