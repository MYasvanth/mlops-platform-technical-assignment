import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MLModel {
  id: string; name: string; owner: string; framework: string;
  algorithm?: string; description?: string; tags?: string;
  created_at: string; updated_at: string;
}

export interface ModelVersion {
  id: string; model_id: string; version: string; stage: string;
  approved: boolean; artifact_uri?: string; training_data_ref?: string;
  tags?: string; created_at: string; updated_at: string;
}

export interface DeploymentEvent {
  id: string; deployment_id: string; event: string;
  status: string; detail?: string; created_at: string;
}

export interface Deployment {
  id: string; model_id: string; version_id: string; environment: string;
  status: string; idempotency_key?: string; error_message?: string;
  created_at: string; updated_at: string; events: DeploymentEvent[];
}

export interface Metric {
  id: string; model_id: string; version: string; environment: string;
  timestamp: string; latency_ms?: number; throughput_rpm?: number;
  error_rate?: number; quality_score?: number; drift_score?: number;
  availability?: number; last_inference_at?: string; monitoring_status?: string;
}

import { environment } from '../environments/environment';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getModels(): Observable<MLModel[]> { return this.http.get<MLModel[]>(`${BASE}/models`); }
  getModel(id: string): Observable<MLModel> { return this.http.get<MLModel>(`${BASE}/models/${id}`); }
  createModel(data: Partial<MLModel>): Observable<MLModel> { return this.http.post<MLModel>(`${BASE}/models`, data); }

  getVersions(modelId: string): Observable<ModelVersion[]> { return this.http.get<ModelVersion[]>(`${BASE}/models/${modelId}/versions`); }
  createVersion(modelId: string, data: Partial<ModelVersion>): Observable<ModelVersion> { return this.http.post<ModelVersion>(`${BASE}/models/${modelId}/versions`, data); }
  updateStage(modelId: string, versionId: string, stage: string, approved?: boolean): Observable<ModelVersion> {
    return this.http.patch<ModelVersion>(`${BASE}/models/${modelId}/versions/${versionId}/stage`, { stage, approved });
  }

  getDeployments(): Observable<Deployment[]> { return this.http.get<Deployment[]>(`${BASE}/deployments`); }
  getDeployment(id: string): Observable<Deployment> { return this.http.get<Deployment>(`${BASE}/deployments/${id}`); }
  createDeployment(data: Partial<Deployment>): Observable<Deployment> { return this.http.post<Deployment>(`${BASE}/deployments`, data); }
  retryDeployment(id: string): Observable<Deployment> { return this.http.post<Deployment>(`${BASE}/deployments/${id}/retry`, {}); }
  rollbackDeployment(id: string): Observable<Deployment> { return this.http.post<Deployment>(`${BASE}/deployments/${id}/rollback`, {}); }

  getMetrics(modelId: string): Observable<Metric[]> { return this.http.get<Metric[]>(`${BASE}/models/${modelId}/metrics`); }

  compareVersions(modelId: string, v1: string, v2: string): Observable<ModelVersion[]> {
    return this.http.get<ModelVersion[]>(`${BASE}/models/${modelId}/versions/compare?v1=${v1}&v2=${v2}`);
  }
}
