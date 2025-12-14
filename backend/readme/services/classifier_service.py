import google.generativeai as genai
from config import get_settings
import database as db
import json
import time
from functools import wraps
from datetime import datetime

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

# Rate limiting globals
last_api_call_time = 0
MIN_CALL_INTERVAL = 6
api_call_count = 0
api_call_window_start = datetime.now()

def rate_limit_decorator(func):
    """Decorator to enforce rate limiting"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        global last_api_call_time, api_call_count, api_call_window_start
        
        now = datetime.now()
        if (now - api_call_window_start).total_seconds() >= 60:
            api_call_count = 0
            api_call_window_start = now
            print(f"🔄 Rate limit window reset")
        
        if api_call_count >= 9:
            wait_time = 60 - (now - api_call_window_start).total_seconds()
            if wait_time > 0:
                print(f"⏱️ Approaching rate limit, waiting {wait_time:.1f}s...")
                time.sleep(wait_time)
                api_call_count = 0
                api_call_window_start = datetime.now()
        
        elapsed = time.time() - last_api_call_time
        if elapsed < MIN_CALL_INTERVAL:
            wait_time = MIN_CALL_INTERVAL - elapsed
            print(f"⏱️ Rate limiting: waiting {wait_time:.1f}s before next API call...")
            time.sleep(wait_time)
        
        result = func(*args, **kwargs)
        
        last_api_call_time = time.time()
        api_call_count += 1
        
        return result
    return wrapper

def build_classification_prompt(subject: str, content: str) -> str:
    """Build system prompt for classification"""
    # ✅ FIX: Get team members from DATABASE
    team_members_by_dept = db.get_team_members_by_department()
    
    # Debug: Print what we got from database
    print(f"📊 Database returned {len(team_members_by_dept)} departments")
    for dept, members in team_members_by_dept.items():
        print(f"  - {dept}: {len(members)} members")
    
    # Only fall back to .env if database is truly empty
    if not team_members_by_dept or len(team_members_by_dept) == 0:
        print("⚠️ No team members in database, falling back to .env")
        team_members_by_dept = parse_team_members_from_env()
    else:
        print("✅ Using team members from DATABASE")
    
    # Build department list
    dept_lines = []
    for dept, members in team_members_by_dept.items():
        member_list = ', '.join([f"{m['name']} ({m['email']})" for m in members])
        dept_lines.append(f"- {dept}: {member_list}")
    
    departments = "\n".join(dept_lines)
    
    prompt = f"""You are an intelligent email routing assistant for a company. Your task is to analyze incoming emails and route them to the most appropriate department(s) based on the email's content, context, and intent.

**Available Departments and Team Members:**
{departments}

**Email to Classify:**
Subject: {subject}
Content: {content}

**Your Analysis Task:**
1. Read and understand the email's main topic, intent, and any specific requests
2. Identify which department(s) would be best suited to handle this inquiry
3. Consider the expertise and responsibilities typically associated with each department name
4. Determine if multiple departments should be involved (e.g., cross-functional requests)
5. Assess your confidence level based on how clearly the email maps to department expertise

**Classification Guidelines:**
- AI/Technology: Software development, AI/ML inquiries, technical support, programming questions, system issues
- Business: Sales inquiries, partnerships, business proposals, pricing questions, contracts
- Marketing: Brand inquiries, advertising, social media, content requests, public relations
- Finance: Billing, payments, invoices, financial reports, accounting questions
- HR/Operations: Job applications, employee matters, company policies, general operations
- Support/Customer Service: Product help, user issues, general assistance, complaints

**Confidence Scoring:**
- 0.9-1.0: Email clearly and specifically mentions the department or its core functions
- 0.7-0.89: Email topic strongly aligns with department expertise, minor ambiguity
- 0.5-0.69: Email could reasonably belong to this department, but some interpretation needed
- 0.3-0.49: Weak connection, department is a possible but not ideal match
- Below 0.3: Poor match, avoid routing here

**Response Format:**
Respond ONLY with valid JSON (no markdown, no explanation outside JSON):
{{
    "categories": ["Department1", "Department2"],
    "confidence": 0.85,
    "recipients": ["email1@company.com", "email2@company.com"],
    "reasoning": "Brief explanation of why this department was chosen"
}}

**Important Rules:**
- Department names in "categories" MUST match EXACTLY as shown in the available departments list (case-sensitive)
- Include 1-3 most relevant departments only
- List recipients' emails from all selected departments
- Set confidence based on your analysis, not arbitrary thresholds
- If email is ambiguous or doesn't fit any department well, choose the closest match and set confidence accordingly
- Your reasoning should briefly explain the key factors in your decision

Analyze the email now and provide your classification:"""
    
    return prompt

def parse_team_members_from_env() -> dict:
    """Fallback: Parse TEAM_MEMBERS env var into department mapping"""
    members = {}
    if not settings.TEAM_MEMBERS:
        return members
        
    for member in settings.TEAM_MEMBERS.split(','):
        if ':' in member:
            parts = member.strip().split(':')
            if len(parts) == 3:
                name, email, dept = parts
                if dept not in members:
                    members[dept] = []
                members[dept].append({'name': name, 'email': email})
    
    print(f"📋 Loaded {len(members)} departments from .env")
    return members

def fallback_classify_email(subject: str, content: str) -> dict:
    """Simple keyword-based classification when API quota exceeded"""
    # ✅ FIX: Get from database first
    team_members_by_dept = db.get_team_members_by_department()
    
    if not team_members_by_dept:
        print("⚠️ Fallback: No database members, using .env")
        team_members_by_dept = parse_team_members_from_env()
    else:
        print("✅ Fallback using DATABASE team members")
    
    text = f"{subject} {content}".lower()
    
    # Keyword matching
    matches = []
    for dept in team_members_by_dept.keys():
        dept_lower = dept.lower()
        if dept_lower in text:
            matches.append(dept)
            print(f"🎯 Fallback matched keyword: {dept}")
    
    # If no matches, route to first department
    if not matches:
        matches = [list(team_members_by_dept.keys())[0]] if team_members_by_dept else ["General"]
        print(f"⚠️ No keyword match, routing to: {matches[0]}")
    
    # Get recipients for matched departments
    recipients = []
    for dept in matches:
        if dept in team_members_by_dept:
            recipients.extend([m['email'] for m in team_members_by_dept[dept]])
    
    if not recipients:
        recipients = [settings.TEAM_LEAD_EMAIL]
    
    print(f"📧 Fallback recipients: {recipients}")
    
    return {
        "categories": matches,
        "confidence": 0.6,
        "recipients": recipients,
        "reasoning": "Classified using fallback keyword matching"
    }

@rate_limit_decorator
def classify_email(subject: str, content: str) -> dict:
    """Classify email using Gemini API with fallback and retry logic"""
    max_retries = 2
    
    for attempt in range(max_retries):
        try:
            model = genai.GenerativeModel('gemini-2.5-flash-lite')
            
            prompt = build_classification_prompt(subject, content)
            
            print(f"🤖 AI Classification attempt {attempt + 1}/{max_retries}...")
            
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if result_text.startswith('```json'):
                result_text = result_text.replace('```json', '').replace('```', '').strip()
            elif result_text.startswith('```'):
                result_text = result_text.replace('```', '').strip()
            
            classification = json.loads(result_text)
            
            # Validate required fields
            if not all(k in classification for k in ['categories', 'confidence', 'recipients']):
                raise ValueError("Missing required fields in classification")
            
            print(f"✅ AI Classification successful:")
            print(f"   Categories: {classification['categories']}")
            print(f"   Confidence: {classification['confidence']}")
            print(f"   Recipients: {classification['recipients']}")
            
            return classification
        
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON parsing error: {e}")
            print(f"Raw response: {result_text[:200]}...")
            if attempt < max_retries - 1:
                print(f"Retrying...")
                time.sleep(3)
                continue
            else:
                print(f"⚠️ Using fallback after JSON errors")
                return fallback_classify_email(subject, content)
        
        except Exception as e:
            error_msg = str(e).lower()
            
            if any(keyword in error_msg for keyword in ['429', 'quota', 'resource_exhausted', 'rate limit']):
                if attempt < max_retries - 1:
                    wait_time = 10
                    print(f"⚠️ Rate limit detected, waiting {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"⚠️ Rate limit persists, using fallback classification")
                    return fallback_classify_email(subject, content)
            else:
                print(f"❌ Classification error: {e}")
                return fallback_classify_email(subject, content)
    
    print(f"⚠️ All retries exhausted, using fallback")
    return fallback_classify_email(subject, content)