from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ...core.database import get_session
from ...core.security import require_admin
from ...models.user import User
from ...models.project_assignment import ProjectAssignment

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


@router.get("")
async def list_users(
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    users = session.exec(select(User).where(User.role == "learner")).all()
    result = []
    for u in users:
        project_count = len(
            session.exec(select(ProjectAssignment).where(ProjectAssignment.user_id == u.id)).all()
        )
        result.append({
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat(),
            "project_count": project_count,
        })
    return result
