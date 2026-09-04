from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.orm import MLModel, ModelVersion, LIFECYCLE_TRANSITIONS, LifecycleStage
from app.schemas import ModelCreate, VersionCreate, VersionStageUpdate


def create_model(db: Session, data: ModelCreate) -> MLModel:
    if db.query(MLModel).filter(MLModel.name == data.name).first():
        raise HTTPException(status_code=409, detail=f"Model '{data.name}' already exists")
    model = MLModel(**data.model_dump())
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def list_models(db: Session) -> list[MLModel]:
    return db.query(MLModel).all()


def get_model(db: Session, model_id: str) -> MLModel:
    model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
    return model


def create_version(db: Session, model_id: str, data: VersionCreate) -> ModelVersion:
    get_model(db, model_id)  # ensure model exists
    if db.query(ModelVersion).filter(ModelVersion.model_id == model_id, ModelVersion.version == data.version).first():
        raise HTTPException(status_code=409, detail=f"Version '{data.version}' already exists for this model")
    version = ModelVersion(model_id=model_id, **data.model_dump())
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def list_versions(db: Session, model_id: str) -> list[ModelVersion]:
    get_model(db, model_id)
    return db.query(ModelVersion).filter(ModelVersion.model_id == model_id).all()


def update_version_stage(db: Session, model_id: str, version_id: str, data: VersionStageUpdate) -> ModelVersion:
    version = db.query(ModelVersion).filter(
        ModelVersion.id == version_id,
        ModelVersion.model_id == model_id,
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    allowed = LIFECYCLE_TRANSITIONS[version.stage]
    if data.stage not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid transition: {version.stage} → {data.stage}. Allowed: {[s.value for s in allowed]}",
        )

    # Enforce approval before PRODUCTION
    if data.stage == LifecycleStage.PRODUCTION and not version.approved:
        raise HTTPException(status_code=422, detail="Version must be approved before promoting to PRODUCTION")

    version.stage = data.stage
    if data.approved is not None:
        version.approved = data.approved
    db.commit()
    db.refresh(version)
    return version
