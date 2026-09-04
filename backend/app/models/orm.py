import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class LifecycleStage(str, enum.Enum):
    DRAFT = "DRAFT"
    VALIDATED = "VALIDATED"
    APPROVED = "APPROVED"
    STAGING = "STAGING"
    PRODUCTION = "PRODUCTION"
    ARCHIVED = "ARCHIVED"


class DeploymentStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    VALIDATING = "VALIDATING"
    DEPLOYING = "DEPLOYING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    ROLLED_BACK = "ROLLED_BACK"


# Valid forward transitions
LIFECYCLE_TRANSITIONS: dict[LifecycleStage, set[LifecycleStage]] = {
    LifecycleStage.DRAFT: {LifecycleStage.VALIDATED, LifecycleStage.ARCHIVED},
    LifecycleStage.VALIDATED: {LifecycleStage.APPROVED, LifecycleStage.ARCHIVED},
    LifecycleStage.APPROVED: {LifecycleStage.STAGING, LifecycleStage.ARCHIVED},
    LifecycleStage.STAGING: {LifecycleStage.PRODUCTION, LifecycleStage.ARCHIVED},
    LifecycleStage.PRODUCTION: {LifecycleStage.ARCHIVED},
    LifecycleStage.ARCHIVED: set(),
}


class MLModel(Base):
    __tablename__ = "models"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    owner: Mapped[str] = mapped_column(String, nullable=False)
    framework: Mapped[str] = mapped_column(String, nullable=False)
    algorithm: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(String, nullable=True)  # comma-separated
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    versions: Mapped[list["ModelVersion"]] = relationship("ModelVersion", back_populates="model", cascade="all, delete-orphan")
    metrics: Mapped[list["ModelMetric"]] = relationship("ModelMetric", back_populates="model", cascade="all, delete-orphan")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    model_id: Mapped[str] = mapped_column(String, ForeignKey("models.id"), nullable=False)
    version: Mapped[str] = mapped_column(String, nullable=False)
    stage: Mapped[LifecycleStage] = mapped_column(Enum(LifecycleStage), default=LifecycleStage.DRAFT)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    artifact_uri: Mapped[str | None] = mapped_column(String, nullable=True)
    training_data_ref: Mapped[str | None] = mapped_column(String, nullable=True)
    tags: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    model: Mapped["MLModel"] = relationship("MLModel", back_populates="versions")
    deployments: Mapped[list["Deployment"]] = relationship("Deployment", back_populates="version")


class Deployment(Base):
    __tablename__ = "deployments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    model_id: Mapped[str] = mapped_column(String, ForeignKey("models.id"), nullable=False)
    version_id: Mapped[str] = mapped_column(String, ForeignKey("model_versions.id"), nullable=False)
    environment: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[DeploymentStatus] = mapped_column(Enum(DeploymentStatus), default=DeploymentStatus.REQUESTED)
    idempotency_key: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    version: Mapped["ModelVersion"] = relationship("ModelVersion", back_populates="deployments")
    events: Mapped[list["DeploymentEvent"]] = relationship("DeploymentEvent", back_populates="deployment", cascade="all, delete-orphan")


class DeploymentEvent(Base):
    __tablename__ = "deployment_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    deployment_id: Mapped[str] = mapped_column(String, ForeignKey("deployments.id"), nullable=False)
    event: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[DeploymentStatus] = mapped_column(Enum(DeploymentStatus))
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    deployment: Mapped["Deployment"] = relationship("Deployment", back_populates="events")


class ModelMetric(Base):
    __tablename__ = "model_metrics"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    model_id: Mapped[str] = mapped_column(String, ForeignKey("models.id"), nullable=False)
    version: Mapped[str] = mapped_column(String, nullable=False)
    environment: Mapped[str] = mapped_column(String, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    throughput_rpm: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    drift_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    availability: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_inference_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    monitoring_status: Mapped[str | None] = mapped_column(String, nullable=True)

    model: Mapped["MLModel"] = relationship("MLModel", back_populates="metrics")
