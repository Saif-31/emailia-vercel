from datetime import datetime
from typing import Dict, List

def format_timestamp(timestamp: str) -> str:
    """Format timestamp for display"""
    dt = datetime.fromisoformat(timestamp)
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def parse_recipients_string(recipients: str) -> List[str]:
    """Parse comma-separated recipients string"""
    return [r.strip() for r in recipients.split(',') if r.strip()]

def parse_categories_string(categories: str) -> List[str]:
    """Parse comma-separated categories string"""
    return [c.strip() for c in categories.split(',') if c.strip()]

def calculate_confidence_level(confidence: float) -> str:
    """Convert confidence score to label"""
    if confidence >= 0.9:
        return "High"
    elif confidence >= 0.7:
        return "Medium"
    else:
        return "Low"

def validate_email_format(email: str) -> bool:
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))