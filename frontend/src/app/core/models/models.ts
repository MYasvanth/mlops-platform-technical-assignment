export type LifecycleStage = 'DRAFT' | 'VALIDATED' | 'APPROVED' | 'STAGING' | 'PRODUCTION' | 'ARCHIVED';
export type DeploymentStatus = 'REQUESTED' | 'VALIDATING' | 'DEPLOYING' | 'SUCCEEDED' | 'FAILED' | 'ROLLED_BACK';

export interface MLModel {
  id: string;
  name: string;
  owner: string;
  framework: string;
  algorithm?: string;
  description?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface ModelVersion {
  id: string;
  model_id: string;
  version: string;
  stage: LifecycleStage;
  approved: boolean;
  artifact_uri?: string;
  training_data_ref?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface DeploymentEvent {
  id: string;
  deployment_id: string;
  event: string;
  status: DeploymentStatus;
  detail?: string;
  created_at: string;
}

export interface Deployment {
  id: string;
  model_id: string;
  version_id: string;
  environment: string;
  status: DeploymentStatus;
  idempotency_key?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  events: DeploymentEvent[];
}

export interface ModelMetric {
  id: string;
  model_id: string;
  version: string;
  environment: string;
  timestamp: string;
  latency_ms?: number;
  throughput_rpm?: number;
  error_rate?: number;
  quality_score?: number;
  drift_score?: number;
  availability?: number;
}

export interface DeploymentCreate {
  model_id: string;
  version_id: string;
  environment: string;
  idempotency_key?: string;
}

export interface VersionCreate {
  version: string;
  artifact_uri?: string;
  training_data_ref?: string;
  tags?: string;
}

export interface VersionStageUpdate {
  stage: LifecycleStage;
  approved?: boolean;
}

export interface ModelCreate {
  name: string;
  owner: string;
  framework: string;
  algorithm?: string;
  description?: string;
  tags?: string;
}
