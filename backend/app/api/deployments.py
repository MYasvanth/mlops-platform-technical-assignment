from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import DeploymentCreate, DeploymentResponse
from app.services import request_deployment, list_deployments, get_deployment, retry_deployment, rollback_deployment

router = APIRouter(prefix="/deployments", tags=["deployments"])


@router.post("", response_model=DeploymentResponse, status_code=202)
def create_deployment(data: DeploymentCreate, db: Session = Depends(get_db)):
    return request_deployment(db, data)


@router.get("", response_model=list[DeploymentResponse])
def get_deployments(db: Session = Depends(get_db)):
    return list_deployments(db)


@router.get("/{deployment_id}", response_model=DeploymentResponse)
def get_deployment_by_id(deployment_id: str, db: Session = Depends(get_db)):
    return get_deployment(db, deployment_id)


@router.post("/{deployment_id}/retry", response_model=DeploymentResponse)
def retry(deployment_id: str, db: Session = Depends(get_db)):
    return retry_deployment(db, deployment_id)


@router.post("/{deployment_id}/rollback", response_model=DeploymentResponse)
def rollback(deployment_id: str, db: Session = Depends(get_db)):
    return rollback_deployment(db, deployment_id)
