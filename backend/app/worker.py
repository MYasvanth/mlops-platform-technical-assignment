from celery import Celery
from app.config import settings

celery_app = Celery("mlops", broker=settings.redis_url, backend=settings.redis_url)

celery_app.conf.update(task_serializer="json", result_serializer="json", accept_content=["json"])


@celery_app.task(name="tasks.deploy_model")
def deploy_model(deployment_id: str) -> dict:
    """Placeholder for async model deployment task."""
    return {"deployment_id": deployment_id, "status": "processed"}
