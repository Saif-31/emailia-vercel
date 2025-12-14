from services import gmail_service
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64

def forward_email(token_data: dict, email_id: str, recipients: list, subject: str, content: str):
    """Forward email to multiple recipients"""
    service = gmail_service.get_service(token_data)
    
    for recipient in recipients:
        try:
            message = MIMEMultipart()
            message['to'] = recipient
            message['subject'] = f"Fwd: {subject}"
            
            body = f"""---------- Forwarded message ---------
Subject: {subject}

{content}
"""
            
            message.attach(MIMEText(body, 'plain'))
            
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            service.users().messages().send(
                userId='me',
                body={'raw': raw}
            ).execute()
            
            print(f"Forwarded to {recipient}")
            
        except Exception as e:
            print(f"Failed to forward to {recipient}: {str(e)}")
            raise