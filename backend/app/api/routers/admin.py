from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import ROLE_PERMISSIONS, require_permission
from app.database.models import AIConversation, AIMessage, Alert, AssessmentResult, AuditLog, DailyJournal, RiskEvent, SupportRequest, User
from app.database.session import get_db
from app.schemas import AlertUpdateRequest
from app.services.audit import log_audit

router = APIRouter(prefix="/api/admin", tags=["Administration"])


def profile(user: User) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email, "service_number": user.service_number, "unit": user.unit, "status": user.status}


@router.get("/dashboard")
def dashboard(request: Request, actor: User = Depends(require_permission("VIEW_USER_PROFILE")), db: Session = Depends(get_db)) -> dict:
    total = db.scalar(select(func.count()).select_from(User).where(User.role == "USER")) or 0
    active = db.scalar(select(func.count()).select_from(User).where(User.role == "USER", User.status == "ACTIVE")) or 0
    risks = {level: db.scalar(select(func.count()).select_from(RiskEvent).where(RiskEvent.level == level)) or 0 for level in ("ELEVATED", "HIGH", "CRITICAL")}
    log_audit(db, request=request, actor_id=actor.id, action="admin_dashboard_viewed"); db.commit()
    return {"total_personnel": total, "active_users": active, "elevated_indicators": risks["ELEVATED"], "high_indicators": risks["HIGH"], "critical_alerts": risks["CRITICAL"]}


@router.get("/personnel")
def personnel(
    request: Request,
    q: str = Query("", max_length=120), page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
    actor: User = Depends(require_permission("VIEW_USER_PROFILE")), db: Session = Depends(get_db),
) -> dict:
    statement = select(User).where(User.role == "USER")
    if q:
        term = f"%{q}%"
        statement = statement.where((User.name.ilike(term)) | (User.service_number.ilike(term)) | (User.unit.ilike(term)))
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    users = db.scalars(statement.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    rows = []
    for person in users:
        last_risk = db.scalar(select(RiskEvent).where(RiskEvent.user_id == person.id).order_by(RiskEvent.created_at.desc()))
        rows.append({**profile(person), "wellbeing_indicator": last_risk.level if last_risk else "NORMAL", "last_check_in": last_risk.created_at if last_risk else None})
    log_audit(db, request=request, actor_id=actor.id, action="admin_view_personnel"); db.commit()
    return {"items": rows, "page": page, "page_size": page_size, "total": total}


@router.get("/personnel/{user_id}")
def person_detail(
    user_id: str, request: Request, include_sensitive: bool = False,
    actor: User = Depends(require_permission("VIEW_USER_PROFILE")), db: Session = Depends(get_db),
) -> dict:
    person = db.get(User, user_id)
    if not person or person.role != "USER":
        raise HTTPException(status_code=404, detail="Personnel record not found")
    latest_risk = db.scalar(select(RiskEvent).where(RiskEvent.user_id == user_id).order_by(RiskEvent.created_at.desc()))
    result: dict = {"profile": profile(person), "wellbeing_indicator": latest_risk.level if latest_risk else "NORMAL", "support_requests": [{"id": item.id, "type": item.type, "status": item.status, "created_at": item.created_at} for item in db.scalars(select(SupportRequest).where(SupportRequest.user_id == user_id)).all()]}
    if include_sensitive:
        permissions = ROLE_PERMISSIONS.get(actor.role, set())
        if "VIEW_JOURNAL" not in permissions:
            raise HTTPException(status_code=403, detail="Explicit sensitive-content permission is required")
        result["journals"] = [{"id": item.id, "content": item.content, "created_at": item.created_at} for item in db.scalars(select(DailyJournal).where(DailyJournal.user_id == user_id).order_by(DailyJournal.created_at.desc())).all()]
        if "VIEW_AI_CONVERSATION" in permissions:
            conversations = db.scalars(select(AIConversation).where(AIConversation.user_id == user_id)).all()
            result["conversations"] = [{"id": conv.id, "messages": [{"role": msg.role, "content": msg.content, "created_at": msg.created_at} for msg in db.scalars(select(AIMessage).where(AIMessage.conversation_id == conv.id)).all()]} for conv in conversations]
        log_audit(db, request=request, actor_id=actor.id, action="sensitive_access", target_type="User", target_id=user_id)
    log_audit(db, request=request, actor_id=actor.id, action="user_profile_access", target_type="User", target_id=user_id)
    db.commit()
    return result


@router.get("/risk")
def risk_monitoring(actor: User = Depends(require_permission("VIEW_RISK_INDICATOR")), db: Session = Depends(get_db)) -> dict:
    distribution = {level: db.scalar(select(func.count()).select_from(RiskEvent).where(RiskEvent.level == level)) or 0 for level in ("NORMAL", "LOW", "MODERATE", "ELEVATED", "HIGH", "CRITICAL")}
    events = db.scalars(select(RiskEvent).order_by(RiskEvent.created_at.desc()).limit(100)).all()
    return {"distribution": distribution, "recent_events": [{"id": item.id, "user_id": item.user_id, "level": item.level, "source": item.source, "created_at": item.created_at} for item in events]}


@router.get("/alerts")
def alerts(actor: User = Depends(require_permission("MANAGE_ALERTS")), db: Session = Depends(get_db)) -> dict:
    items = db.scalars(select(Alert).order_by(Alert.created_at.desc())).all()
    return {"alerts": [{"id": item.id, "user_id": item.user_id, "severity": item.severity, "reason": item.reason, "source": item.source, "status": item.status, "assigned_to": item.assigned_to, "created_at": item.created_at} for item in items]}


@router.put("/alerts/{alert_id}")
def update_alert(alert_id: str, payload: AlertUpdateRequest, request: Request, actor: User = Depends(require_permission("MANAGE_ALERTS")), db: Session = Depends(get_db)) -> dict:
    item = db.get(Alert, alert_id)
    if not item:
        raise HTTPException(status_code=404, detail="Alert not found")
    item.status, item.assigned_to = payload.status, payload.assigned_to
    if payload.status == "RESOLVED": item.resolved_at = datetime.now(UTC)
    log_audit(db, request=request, actor_id=actor.id, action="alert_updated", target_type="Alert", target_id=item.id, metadata={"status": payload.status})
    db.commit(); return {"id": item.id, "status": item.status}


@router.get("/analytics")
def analytics(actor: User = Depends(require_permission("VIEW_ANALYTICS")), db: Session = Depends(get_db)) -> dict:
    by_unit = db.execute(select(User.unit, func.count(User.id)).where(User.role == "USER").group_by(User.unit)).all()
    return {"personnel_by_unit": [{"unit": unit or "Unassigned", "count": count} for unit, count in by_unit]}


@router.get("/audit-logs")
def audit_logs(limit: int = Query(100, ge=1, le=500), actor: User = Depends(require_permission("VIEW_AUDIT_LOGS")), db: Session = Depends(get_db)) -> dict:
    items = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)).all()
    return {"logs": [{"id": item.id, "actor_id": item.actor_id, "action": item.action, "target_type": item.target_type, "target_id": item.target_id, "metadata": item.metadata_, "created_at": item.created_at} for item in items]}
