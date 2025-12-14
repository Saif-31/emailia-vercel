from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Gmail API
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/callback"
    
    # Gemini API
    GEMINI_API_KEY: str
    
    # Database
    DATABASE_URL: str = "sqlite:///./email_routing.db"
    
    # Classification
    CONFIDENCE_THRESHOLD: float = 0.7
    
    # Team Members (comma-separated: name:email:department)
    TEAM_MEMBERS: str = ""
    TEAM_LEAD_EMAIL: str
    
    # Auto-reply template
    AUTO_REPLY_TEMPLATE: str = "Thank you for your email. It has been forwarded to {department}. We'll reach out soon."
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()