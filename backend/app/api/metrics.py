from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.orm import ModelMetric, MLModel
from app.schemas import MetricResponse
from fastapi import HTTPException

router = APIRouter(tags=["metrics"])


@router.get("/models/{model_id}/metrics", response_model=list[MetricResponse])
def get_metrics(model_id: str, db: Session = Depends(get_db)):
    model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
    return db.query(ModelMetric).filter(ModelMetric.model_id == model_id).order_by(ModelMetric.timestamp.desc()).all()
