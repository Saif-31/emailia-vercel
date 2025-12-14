from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import database as db
import json

router = APIRouter()

class TeamMember(BaseModel):
    name: str
    email: str
    department: str

@router.get("/history")
def get_classification_history(limit: int = 50):
    """Get recent email classifications with team member names"""
    try:
        history = db.get_classification_history(limit)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pending-reviews")
def get_pending_reviews():
    """Get emails awaiting team lead review"""
    try:
        reviews = db.get_pending_reviews()
        return {"reviews": reviews}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_dashboard_stats():
    """Get overall statistics"""
    try:
        history = db.get_classification_history(limit=1000)
        total_processed = len(history)
        
        reviews = db.get_pending_reviews()
        pending_reviews = len(reviews)
        
        # Calculate department distribution
        dept_stats = {}
        for item in history:
            try:
                categories = json.loads(item['categories']) if isinstance(item['categories'], str) else item['categories']
                for cat in categories:
                    dept_stats[cat] = dept_stats.get(cat, 0) + 1
            except:
                pass
        
        return {
            "total_processed": total_processed,
            "pending_reviews": pending_reviews,
            "department_distribution": dept_stats
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/email-details/{email_id}")
def get_email_details(email_id: str):
    """Get details of a specific email"""
    try:
        history = db.get_classification_history(limit=1000)
        for item in history:
            if item['email_id'] == email_id:
                return item
        raise HTTPException(status_code=404, detail="Email not found")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== TEAM MEMBERS API ENDPOINTS ==========

@router.get("/team-members")
async def get_team_members():
    """Get all team members from database"""
    try:
        print("📥 GET /team-members - Fetching all team members")
        members = db.get_all_team_members()
        print(f"✅ Retrieved {len(members)} team members")
        return {"members": members}
    except Exception as e:
        print(f"❌ Error getting team members: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/team-members")
async def add_team_member(member: TeamMember):
    """Add new team member to database"""
    try:
        print(f"📝 POST /team-members - Adding: {member.name} ({member.email}) to {member.department}")
        
        member_id = db.add_team_member(
            name=member.name,
            email=member.email,
            department=member.department
        )
        
        print(f"✅ Team member added with ID: {member_id}")
        
        return {
            "message": "Team member added successfully",
            "member_id": member_id,
            "member": {
                "id": member_id,
                "name": member.name,
                "email": member.email,
                "department": member.department
            }
        }
    except Exception as e:
        print(f"❌ Error adding team member: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/team-members/{member_id}")
def update_team_member(member_id: int, member: TeamMember):
    """Update team member"""
    try:
        print(f"✏️ PUT /team-members/{member_id} - Updating to: {member.name} ({member.email}) - {member.department}")
        
        db.update_team_member(
            member_id=member_id,
            name=member.name,
            email=member.email,
            department=member.department
        )
        
        print(f"✅ Team member {member_id} updated")
        
        return {
            "message": "Team member updated successfully",
            "member": {
                "id": member_id,
                "name": member.name,
                "email": member.email,
                "department": member.department
            }
        }
    except Exception as e:
        print(f"❌ Error updating team member: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/team-members/{member_id}")
async def delete_team_member(member_id: int):
    """Delete team member from database"""
    try:
        print(f"🗑️ DELETE /team-members/{member_id}")
        
        db.delete_team_member(member_id)
        
        print(f"✅ Team member {member_id} deleted")
        
        return {"message": "Team member deleted successfully"}
    except Exception as e:
        print(f"❌ Error deleting team member: {e}")
        raise HTTPException(status_code=500, detail=str(e))