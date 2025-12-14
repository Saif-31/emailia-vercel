from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64
from typing import List, Dict

def get_service(token_data: dict):
    """Create Gmail API service from token data"""
    # Use from_authorized_user_info - Google's recommended method
    credentials = Credentials.from_authorized_user_info(
        {
            'token': token_data['access_token'],
            'refresh_token': token_data['refresh_token'],
            'token_uri': token_data['token_uri'],
            'client_id': token_data['client_id'],
            'client_secret': token_data['client_secret'],
            'scopes': token_data.get('scopes', [])
        }
    )
    return build('gmail', 'v1', credentials=credentials)

def get_profile(token_data: dict) -> dict:
    """Get user Gmail profile"""
    service = get_service(token_data)
    return service.users().getProfile(userId='me').execute()

def fetch_unread_emails(token_data: dict, max_results: int = 10) -> List[Dict]:
    """Fetch unread emails from inbox"""
    service = get_service(token_data)
    
    results = service.users().messages().list(
        userId='me',
        q='is:unread',
        maxResults=max_results
    ).execute()
    
    messages = results.get('messages', [])
    
    emails = []
    for msg in messages:
        email_data = service.users().messages().get(
            userId='me',
            id=msg['id'],
            format='full'
        ).execute()
        
        headers = email_data['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
        sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
        
        body = get_email_body(email_data['payload'])
        
        emails.append({
            'id': msg['id'],
            'subject': subject,
            'sender': sender,
            'body': body
        })
    
    return emails

def get_email_body(payload: dict) -> str:
    """Extract email body from payload"""
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data', '')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8')
    
    if 'body' in payload and 'data' in payload['body']:
        data = payload['body']['data']
        return base64.urlsafe_b64decode(data).decode('utf-8')
    
    return ""

def mark_as_read(token_data: dict, email_id: str):
    """Mark email as read"""
    service = get_service(token_data)
    service.users().messages().modify(
        userId='me',
        id=email_id,
        body={'removeLabelIds': ['UNREAD']}
    ).execute()

def send_email(token_data: dict, to: str, subject: str, body: str):
    """Send email via Gmail API"""
    service = get_service(token_data)
    
    message = MIMEText(body)
    message['to'] = to
    message['subject'] = subject
    
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    
    service.users().messages().send(
        userId='me',
        body={'raw': raw}
    ).execute()

def forward_email_via_api(token_data: dict, email_id: str, to: str):
    """Forward an existing email"""
    service = get_service(token_data)
    
    original = service.users().messages().get(
        userId='me',
        id=email_id,
        format='raw'
    ).execute()
    
    message = MIMEMultipart()
    message['to'] = to
    message['subject'] = f"Fwd: {original.get('subject', 'Forwarded Email')}"
    
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    
    service.users().messages().send(
        userId='me',
        body={'raw': raw}
    ).execute()