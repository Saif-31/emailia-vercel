from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services import gmail_service, classifier_service
from google.oauth2.credentials import Credentials
from config import get_settings
import database as db
import json
from pathlib import Path
import asyncio

router = APIRouter()
settings = get_settings()

class FetchEmailsRequest(BaseModel):
    user_email: str
    max_results: int = 10

class ManualForwardRequest(BaseModel):
    email_id: int
    recipient_email: str
    user_email: str

def get_token_data(user_email: str) -> dict:
    """Load token data from file and convert to expected format"""
    token_file = Path(f"tokens/{user_email}_token.json")
    
    if not token_file.exists():
        raise HTTPException(status_code=401, detail="No authentication found. Please connect your Gmail account.")
    
    with open(token_file, 'r') as f:
        token_data = json.load(f)
    
    return {
        'access_token': token_data['token'],
        'refresh_token': token_data['refresh_token'],
        'token_uri': token_data['token_uri'],
        'client_id': token_data['client_id'],
        'client_secret': token_data['client_secret'],
        'scopes': token_data.get('scopes', [])
    }

async def process_emails_stream(user_email: str, max_results: int):
    """Stream processing events to frontend"""
    try:
        # Send initial status
        yield f"data: {json.dumps({'type': 'status', 'message': 'Initializing...', 'step': 1, 'total': 5})}\n\n"
        await asyncio.sleep(0.1)
        
        # Get token data
        token_data = get_token_data(user_email)
        yield f"data: {json.dumps({'type': 'status', 'message': 'Connected to Gmail API', 'step': 2, 'total': 5})}\n\n"
        await asyncio.sleep(0.1)
        
        # Fetch emails
        yield f"data: {json.dumps({'type': 'status', 'message': f'Fetching {max_results} unread emails...', 'step': 3, 'total': 5})}\n\n"
        await asyncio.sleep(0.1)
        
        emails = gmail_service.fetch_unread_emails(token_data, max_results=max_results)
        
        yield f"data: {json.dumps({'type': 'fetched', 'count': len(emails), 'message': f'Found {len(emails)} unread emails'})}\n\n"
        await asyncio.sleep(0.1)
        
        if len(emails) == 0:
            yield f"data: {json.dumps({'type': 'complete', 'message': 'No unread emails found', 'processed': 0})}\n\n"
            return
        
        # Process each email
        processed_count = 0
        for idx, email_data in enumerate(emails, 1):
            # Send email processing start
            yield f"data: {json.dumps({'type': 'processing', 'current': idx, 'total': len(emails), 'subject': email_data['subject'], 'sender': email_data['sender']})}\n\n"
            await asyncio.sleep(0.1)
            
            # Classify
            yield f"data: {json.dumps({'type': 'classifying', 'subject': email_data['subject']})}\n\n"
            await asyncio.sleep(0.1)
            
            # ✅ Rate limiting is handled inside classifier_service.classify_email()
            # The decorator will automatically wait 6 seconds between API calls
            classification = classifier_service.classify_email(
                subject=email_data['subject'],
                content=email_data['body']
            )
            
            department = classification['categories'][0] if classification['categories'] else 'Unknown'
            recipients = classification.get('recipients', [])
            
            yield f"data: {json.dumps({'type': 'classified', 'department': department, 'confidence': classification['confidence'], 'recipients': recipients})}\n\n"
            await asyncio.sleep(0.1)
            
            # Save to database
            db.save_classification(
                email_id=email_data['id'],
                sender=email_data['sender'],
                subject=email_data['subject'],
                content=email_data['body'],
                categories=json.dumps(classification['categories']),
                confidence=classification['confidence'],
                recipients=json.dumps(recipients)
            )
            
            # Send auto-reply
            yield f"data: {json.dumps({'type': 'replying', 'sender': email_data['sender']})}\n\n"
            await asyncio.sleep(0.1)
            
            sender_email = email_data['sender'].split('<')[-1].strip('>')
            auto_reply_body = f"""Hello,

Thank you for contacting us. Your email has been received and automatically routed to our {department} department.

Our team will review your message and respond as soon as possible.

Best regards,
Emailia Auto-Routing System
"""
            
            try:
                gmail_service.send_email(
                    token_data=token_data,
                    to=sender_email,
                    subject=f"Re: {email_data['subject']}",
                    body=auto_reply_body
                )
                yield f"data: {json.dumps({'type': 'replied', 'to': sender_email})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'reply_failed', 'error': str(e)})}\n\n"
            
            await asyncio.sleep(0.1)
            
            # Add to review queue if low confidence
            if classification['confidence'] < 0.7:
                db.add_to_review_queue(
                    email_id=email_data['id'],
                    sender=email_data['sender'],
                    subject=email_data['subject'],
                    content=email_data['body'],
                    reason=f"Low confidence: {classification['confidence']}"
                )
                yield f"data: {json.dumps({'type': 'review_queued', 'reason': 'Low confidence'})}\n\n"
                await asyncio.sleep(0.1)
            
            # Mark as read
            gmail_service.mark_as_read(token_data, email_data['id'])
            
            processed_count += 1
            yield f"data: {json.dumps({'type': 'email_complete', 'current': idx, 'total': len(emails)})}\n\n"
            await asyncio.sleep(0.1)
            
            # ✅ No additional sleep needed here - rate limiting is handled by the decorator in classifier_service
        
        # Send completion
        yield f"data: {json.dumps({'type': 'complete', 'message': f'Successfully processed {processed_count} emails', 'processed': processed_count})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

@router.get("/fetch-and-process-stream")
async def fetch_and_process_stream(user_email: str, max_results: int = 10):
    """Stream email processing events via SSE"""
    return StreamingResponse(
        process_emails_stream(user_email, max_results),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/fetch-and-process")
async def fetch_and_process_emails(request: FetchEmailsRequest):
    """Fetch emails from Gmail and process them (non-streaming)"""
    try:
        print(f"🔄 Fetching emails for {request.user_email}")
        
        token_data = get_token_data(request.user_email)
        print(f"🔑 Token loaded - client_id: {token_data['client_id'][:20]}...")
        
        print(f"📧 Fetching {request.max_results} unread emails...")
        emails = gmail_service.fetch_unread_emails(token_data, max_results=request.max_results)
        print(f"✅ Fetched {len(emails)} emails")
        
        processed_count = 0
        for email_data in emails:
            print(f"📨 Processing: {email_data['subject']}")
            
            # ✅ Rate limiting is handled inside classifier_service.classify_email()
            classification = classifier_service.classify_email(
                subject=email_data['subject'],
                content=email_data['body']
            )
            
            department = classification['categories'][0] if classification['categories'] else 'Unknown'
            recipients = classification.get('recipients', [])
            
            print(f"🎯 Classified as: {department} ({classification['confidence']})")
            
            db.save_classification(
                email_id=email_data['id'],
                sender=email_data['sender'],
                subject=email_data['subject'],
                content=email_data['body'],
                categories=json.dumps(classification['categories']),
                confidence=classification['confidence'],
                recipients=json.dumps(recipients)
            )
            
            sender_email = email_data['sender'].split('<')[-1].strip('>')
            auto_reply_body = f"""Hello,

Thank you for contacting us. Your email has been received and automatically routed to our {department} department.

Our team will review your message and respond as soon as possible.

Best regards,
Emailia Auto-Routing System
"""
            
            try:
                gmail_service.send_email(
                    token_data=token_data,
                    to=sender_email,
                    subject=f"Re: {email_data['subject']}",
                    body=auto_reply_body
                )
                print(f"✅ Auto-reply sent to {sender_email}")
            except Exception as reply_error:
                print(f"⚠️ Failed to send auto-reply: {reply_error}")
            
            if classification['confidence'] < 0.7:
                db.add_to_review_queue(
                    email_id=email_data['id'],
                    sender=email_data['sender'],
                    subject=email_data['subject'],
                    content=email_data['body'],
                    reason=f"Low confidence: {classification['confidence']}"
                )
                print(f"⚠️ Added to review queue (low confidence)")
            
            gmail_service.mark_as_read(token_data, email_data['id'])
            processed_count += 1
        
        print(f"✅ Successfully processed {processed_count} emails")
        
        return {
            "message": f"Processed {processed_count} emails",
            "processed_count": processed_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in fetch_and_process_emails: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing emails: {str(e)}")

@router.post("/manual-forward")
async def manual_forward(request: ManualForwardRequest):
    """Manually forward an email"""
    try:
        print(f"🔄 Manual forward for email ID: {request.email_id}")
        
        token_data = get_token_data(request.user_email)
        
        gmail_service.forward_email_via_api(
            token_data=token_data,
            email_id=str(request.email_id),
            to=request.recipient_email
        )
        
        print(f"✅ Email forwarded to {request.recipient_email}")
        
        return {"message": "Email forwarded successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in manual_forward: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test-connection")
async def test_gmail_connection(email: str):
    """Test Gmail API connection"""
    try:
        print(f"🔄 Testing connection for {email}")
        
        token_data = get_token_data(email)
        profile = gmail_service.get_profile(token_data)
        
        print(f"✅ Connection successful: {profile['emailAddress']}")
        
        return {
            "status": "connected",
            "email": profile['emailAddress'],
            "messages_total": profile.get('messagesTotal', 0),
            "threads_total": profile.get('threadsTotal', 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Connection test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Connection failed: {str(e)}")