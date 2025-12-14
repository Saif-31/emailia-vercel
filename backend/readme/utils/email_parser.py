import re
from html import unescape

def clean_email_content(content: str) -> str:
    """Clean and normalize email content"""
    content = re.sub(r'<[^>]+>', '', content)
    content = unescape(content)
    content = re.sub(r'\s+', ' ', content)
    content = re.sub(r'--\s*\n.*', '', content, flags=re.DOTALL)
    return content.strip()

def extract_email_address(email_string: str) -> str:
    """Extract email from 'Name <email@domain.com>' format"""
    match = re.search(r'<(.+?)>', email_string)
    return match.group(1) if match else email_string.strip()

def is_external_email(sender: str, company_domain: str) -> bool:
    """Check if email is from outside company"""
    email = extract_email_address(sender)
    return company_domain not in email.lower()

def truncate_content(content: str, max_length: int = 1000) -> str:
    """Truncate content for classification"""
    if len(content) <= max_length:
        return content
    return content[:max_length] + "..."