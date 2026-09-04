from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.orm import LifecycleStage, DeploymentStatus


# ── Model ──────────────────────────────────────────────────────────────────────

class ModelCreate(BaseModel):
    name: str
    owner: str
    framework: str
    algorithm: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None


class ModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    owner: str
    framework: str
    algorithm: Optional[str]
    description: Optional[str]
    tags: Optional[str]
    created_at: datetime
    updated_at: datetime


# ── Model Version ──────────────────────────────────────────────────────────────

class VersionCreate(BaseModel):
    version: str
    artifact_uri: Optional[str] = None
    training_data_ref: Optional[str] = None
    tags: Optional[str] = None


class VersionStageUpdate(BaseModel):
    stage: LifecycleStage
    approved: Optional[bool] = None


class VersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    model_id: str
    version: str
    stage: LifecycleStage
    approved: bool
    artifact_uri: Optional[str]
    training_data_ref: Optional[str]
    tags: Optional[str]
    created_at: datetime
    updated_at: datetime


# ── Deployment ─────────────────────────────────────────────────────────────────

class DeploymentCreate(BaseModel):
    model_id: str
    version_id: str
    environment: str
    idempotency_key: Optional[str] = None
    simulate_failure: bool = False


class DeploymentEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    deployment_id: str
    event: str
    status: DeploymentStatus
    detail: Optional[str]
    created_at: datetime


class DeploymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    model_id: str
    version_id: str
    environment: str
    status: DeploymentStatus
    idempotency_key: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    events: list[DeploymentEventResponse] = []


# ── Metrics ────────────────────────────────────────────────────────────────────

class MetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    model_id: str
    version: str
    environment: str
    timestamp: datetime
    latency_ms: Optional[float]
    throughput_rpm: Optional[float]
    error_rate: Optional[float]
    quality_score: Optional[float]
    drift_score: Optional[float]
    availability: Optional[float]
    last_inference_at: Optional[datetime]
    monitoring_status: Optional[str]


# ── Error ──────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
