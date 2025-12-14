from services import gmail_service
from config import get_settings
from email.mime.text import MIMEText
import base64

settings = get_settings()

def send_auto_reply(token_data: dict, to_email: str, original_subject: str, departments: list):
    """Send automatic acknowledgment reply to sender"""
    service = gmail_service.get_service(token_data)
    
    try:
        dept_text = ', '.join(departments) if departments else 'appropriate team'
        
        body = settings.AUTO_REPLY_TEMPLATE.format(department=dept_text)
        
        message = MIMEText(body, 'plain')
        message['to'] = to_email
        message['subject'] = f"Re: {original_subject}"
        
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        service.users().messages().send(
            userId='me',
            body={'raw': raw}
        ).execute()
        
        print(f"Auto-reply sent to {to_email}")
        
    except Exception as e:
        print(f"Failed to send auto-reply to {to_email}: {str(e)}")
        raise