from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ModelCreate, ModelResponse, VersionCreate, VersionStageUpdate, VersionResponse
from app.services import create_model, list_models, get_model, create_version, list_versions, update_version_stage

router = APIRouter(prefix="/models", tags=["models"])


@router.post("", response_model=ModelResponse, status_code=201)
def register_model(data: ModelCreate, db: Session = Depends(get_db)):
    return create_model(db, data)


@router.get("", response_model=list[ModelResponse])
def get_models(db: Session = Depends(get_db)):
    return list_models(db)


@router.get("/{model_id}", response_model=ModelResponse)
def get_model_by_id(model_id: str, db: Session = Depends(get_db)):
    return get_model(db, model_id)


@router.post("/{model_id}/versions", response_model=VersionResponse, status_code=201)
def register_version(model_id: str, data: VersionCreate, db: Session = Depends(get_db)):
    return create_version(db, model_id, data)


@router.get("/{model_id}/versions", response_model=list[VersionResponse])
def get_versions(model_id: str, db: Session = Depends(get_db)):
    return list_versions(db, model_id)


@router.patch("/{model_id}/versions/{version_id}/stage", response_model=VersionResponse)
def update_stage(model_id: str, version_id: str, data: VersionStageUpdate, db: Session = Depends(get_db)):
    return update_version_stage(db, model_id, version_id, data)


@router.get("/{model_id}/versions/compare", response_model=list[VersionResponse])
def compare_versions(model_id: str, v1: str, v2: str, db: Session = Depends(get_db)):
    """Compare two versions by their IDs. Pass ?v1=<id>&v2=<id>"""
    from fastapi import HTTPException
    from app.models.orm import ModelVersion
    results = db.query(ModelVersion).filter(
        ModelVersion.model_id == model_id,
        ModelVersion.id.in_([v1, v2])
    ).all()
    if len(results) != 2:
        raise HTTPException(status_code=404, detail="One or both version IDs not found for this model")
    return results
