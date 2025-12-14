import sqlite3
from contextlib import contextmanager
from typing import Optional, List, Dict, Any

DATABASE_FILE = "email_routing.db"

def init_db():
    """Initialize database with required tables"""
    conn = sqlite3.connect(DATABASE_FILE)
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS classifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_id TEXT UNIQUE NOT NULL,
        sender TEXT NOT NULL,
        subject TEXT,
        content TEXT,
        categories TEXT,
        confidence REAL,
        recipients TEXT,
        status TEXT DEFAULT 'forwarded',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS review_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_id TEXT UNIQUE NOT NULL,
        sender TEXT NOT NULL,
        subject TEXT,
        content TEXT,
        reason TEXT,
        reviewed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS oauth_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT UNIQUE NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Team members table
    c.execute('''CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def save_classification(email_id: str, sender: str, subject: str, content: str, 
                       categories: str, confidence: float, recipients: str, status: str = "forwarded"):
    """Save email classification to database"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''INSERT OR REPLACE INTO classifications 
                     (email_id, sender, subject, content, categories, confidence, recipients, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                  (email_id, sender, subject, content, categories, confidence, recipients, status))
        conn.commit()

def add_to_review_queue(email_id: str, sender: str, subject: str, content: str, reason: str):
    """Add email to review queue for team lead"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''INSERT OR REPLACE INTO review_queue 
                     (email_id, sender, subject, content, reason)
                     VALUES (?, ?, ?, ?, ?)''',
                  (email_id, sender, subject, content, reason))
        conn.commit()

def get_pending_reviews() -> List[Dict[str, Any]]:
    """Get all pending reviews from queue"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM review_queue WHERE reviewed = 0 ORDER BY created_at DESC')
        rows = c.fetchall()
        return [dict(row) for row in rows]

def mark_review_completed(review_id: int):
    """Mark a review as completed"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('UPDATE review_queue SET reviewed = 1 WHERE id = ?', (review_id,))
        conn.commit()

def get_classification_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Get recent classification history"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM classifications ORDER BY created_at DESC LIMIT ?', (limit,))
        rows = c.fetchall()
        return [dict(row) for row in rows]

def save_oauth_token(user_email: str, access_token: str, refresh_token: str, token_expiry: str):
    """Save OAuth tokens for user"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''INSERT OR REPLACE INTO oauth_tokens 
                     (user_email, access_token, refresh_token, token_expiry, updated_at)
                     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)''',
                  (user_email, access_token, refresh_token, token_expiry))
        conn.commit()

def get_oauth_token(user_email: str) -> Optional[Dict[str, Any]]:
    """Get stored OAuth tokens for user"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM oauth_tokens WHERE user_email = ?', (user_email,))
        row = c.fetchone()
        return dict(row) if row else None

# ========== TEAM MEMBERS FUNCTIONS ==========

def get_team_members() -> List[Dict[str, Any]]:
    """Get all team members"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT id, name, email, department, created_at FROM team_members ORDER BY department, name')
        rows = c.fetchall()
        return [dict(row) for row in rows]

def get_all_team_members() -> List[Dict[str, Any]]:
    """Alias for get_team_members() - used by dashboard.py"""
    return get_team_members()

def add_team_member(name: str, email: str, department: str) -> int:
    """Add a new team member"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('INSERT INTO team_members (name, email, department) VALUES (?, ?, ?)',
                  (name, email, department))
        conn.commit()
        member_id = c.lastrowid
        print(f"✅ Added team member: {name} ({email}) to {department} with ID: {member_id}")
        return member_id

def update_team_member(member_id: int, name: str, email: str, department: str):
    """Update team member"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('UPDATE team_members SET name = ?, email = ?, department = ? WHERE id = ?',
                  (name, email, department, member_id))
        conn.commit()
        print(f"✅ Updated team member ID: {member_id}")

def delete_team_member(member_id: int):
    """Delete team member"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM team_members WHERE id = ?', (member_id,))
        conn.commit()
        print(f"✅ Deleted team member ID: {member_id}")

def get_team_members_by_department() -> Dict[str, List[Dict[str, Any]]]:
    """Get team members grouped by department"""
    members = get_team_members()
    by_dept = {}
    for member in members:
        dept = member['department']
        if dept not in by_dept:
            by_dept[dept] = []
        by_dept[dept].append({
            'name': member['name'],
            'email': member['email']
        })
    
    print(f"✅ Retrieved {len(members)} team members from {len(by_dept)} departments")
    return by_dept

# Initialize database on import
init_db()