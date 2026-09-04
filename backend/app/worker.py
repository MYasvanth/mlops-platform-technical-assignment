from celery import Celery
from app.config import settings

celery_app = Celery("mlops", broker=settings.redis_url, backend=settings.redis_url)

celery_app.conf.update(task_serializer="json", result_serializer="json", accept_content=["json"])


@celery_app.task(name="tasks.process_deployment")
def process_deployment(deployment_id: str) -> dict:
    """Async task: advance a DEPLOYING deployment to SUCCEEDED or FAILED."""
    from app.database import SessionLocal
    from app.models.orm import Deployment, DeploymentEvent, DeploymentStatus
    import logging
    logger = logging.getLogger(__name__)

    db = SessionLocal()
    try:
        dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
        if not dep or dep.status != DeploymentStatus.DEPLOYING:
            return {"skipped": True}

        dep.status = DeploymentStatus.SUCCEEDED
        db.add(DeploymentEvent(
            deployment_id=dep.id, event="deployment_completed",
            status=DeploymentStatus.SUCCEEDED
        ))
        db.commit()
        logger.info("Async deployment succeeded id=%s", deployment_id)
        return {"deployment_id": deployment_id, "status": "SUCCEEDED"}
    except Exception as exc:
        db.rollback()
        logger.exception("Async deployment failed id=%s", deployment_id)
        raise
    finally:
        db.close()
