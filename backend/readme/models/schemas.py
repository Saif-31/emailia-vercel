from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class EmailClassification(BaseModel):
    email_id: str
    sender: str
    subject: str
    content: str
    categories: List[str]
    confidence: float
    recipients: List[str]
    status: str

class ReviewQueueItem(BaseModel):
    id: int
    email_id: str
    sender: str
    subject: str
    content: str
    reason: str
    reviewed: bool
    created_at: datetime

class ClassificationResponse(BaseModel):
    categories: List[str]
    confidence: float
    recipients: List[str]
    reasoning: Optional[str] = None

class DashboardStats(BaseModel):
    total_classified: int
    pending_reviews: int
    today_classified: int
    avg_confidence: float
    category_breakdown: List[dict]

class OAuthToken(BaseModel):
    user_email: str
    access_token: str
    refresh_token: str
    token_expiry: Optional[str] = None