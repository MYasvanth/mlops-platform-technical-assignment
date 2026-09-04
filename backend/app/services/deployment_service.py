import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.orm import Deployment, DeploymentEvent, DeploymentStatus, ModelVersion, LifecycleStage
from app.schemas import DeploymentCreate

logger = logging.getLogger(__name__)


def _add_event(db: Session, deployment: Deployment, event: str, status: DeploymentStatus, detail: str | None = None) -> None:
    db.add(DeploymentEvent(deployment_id=deployment.id, event=event, status=status, detail=detail))


def request_deployment(db: Session, data: DeploymentCreate) -> Deployment:
    # Idempotency check
    if data.idempotency_key:
        existing = db.query(Deployment).filter(Deployment.idempotency_key == data.idempotency_key).first()
        if existing:
            logger.info("Idempotent deployment request returned existing id=%s", existing.id)
            return existing

    version = db.query(ModelVersion).filter(ModelVersion.id == data.version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Model version not found")

    # Block unapproved versions from production
    if data.environment.lower() == "production" and not version.approved:
        raise HTTPException(status_code=422, detail="Version must be approved before deploying to production")

    deployment = Deployment(
        model_id=data.model_id,
        version_id=data.version_id,
        environment=data.environment,
        idempotency_key=data.idempotency_key,
        status=DeploymentStatus.REQUESTED,
    )
    db.add(deployment)
    db.flush()
    _add_event(db, deployment, "deployment_requested", DeploymentStatus.REQUESTED)

    # Simulate synchronous validation + deploy transition
    deployment.status = DeploymentStatus.VALIDATING
    _add_event(db, deployment, "validation_started", DeploymentStatus.VALIDATING)
    deployment.status = DeploymentStatus.DEPLOYING
    _add_event(db, deployment, "deploy_started", DeploymentStatus.DEPLOYING)

    if data.simulate_failure:
        deployment.status = DeploymentStatus.FAILED
        deployment.error_message = "Simulated deployment failure"
        _add_event(db, deployment, "deployment_failed", DeploymentStatus.FAILED, "Simulated failure")
        logger.warning("Deployment simulated failure id=%s", deployment.id)
    else:
        deployment.status = DeploymentStatus.SUCCEEDED
        _add_event(db, deployment, "deployment_completed", DeploymentStatus.SUCCEEDED)
        logger.info("Deployment succeeded id=%s env=%s", deployment.id, deployment.environment)

    db.commit()
    db.refresh(deployment)
    return deployment


def list_deployments(db: Session) -> list[Deployment]:
    return db.query(Deployment).all()


def get_deployment(db: Session, deployment_id: str) -> Deployment:
    dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not dep:
        raise HTTPException(status_code=404, detail=f"Deployment '{deployment_id}' not found")
    return dep


def retry_deployment(db: Session, deployment_id: str) -> Deployment:
    dep = get_deployment(db, deployment_id)
    if dep.status != DeploymentStatus.FAILED:
        raise HTTPException(status_code=422, detail=f"Only FAILED deployments can be retried, current status: {dep.status}")

    dep.status = DeploymentStatus.DEPLOYING
    _add_event(db, dep, "retry_started", DeploymentStatus.DEPLOYING)
    dep.status = DeploymentStatus.SUCCEEDED
    dep.error_message = None
    _add_event(db, dep, "retry_succeeded", DeploymentStatus.SUCCEEDED)

    db.commit()
    db.refresh(dep)
    return dep


def rollback_deployment(db: Session, deployment_id: str) -> Deployment:
    dep = get_deployment(db, deployment_id)
    if dep.status != DeploymentStatus.SUCCEEDED:
        raise HTTPException(status_code=422, detail=f"Only SUCCEEDED deployments can be rolled back, current status: {dep.status}")

    dep.status = DeploymentStatus.ROLLED_BACK
    _add_event(db, dep, "rollback_executed", DeploymentStatus.ROLLED_BACK)

    db.commit()
    db.refresh(dep)
    logger.info("Deployment rolled back id=%s", dep.id)
    return dep
