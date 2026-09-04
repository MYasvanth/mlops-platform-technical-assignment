# Architecture

## Context
An industrial organization operates many ML models across plants and environments. This platform manages the full model lifecycle: registration, versioning, approval, deployment, monitoring and rollback.

## Scope
- Model registry with lifecycle stage management
- Deployment workflow with retry and rollback
- Monitoring metrics per model/version/environment
- Angular operational UI
- REST API backend with PostgreSQL persistence

## Architecture Overview
Three-tier architecture: Angular SPA → FastAPI backend → PostgreSQL. Async tasks handled by Celery workers via Redis.

## Components

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| Angular SPA | Angular 17, Angular Material | Operational UI |
| API Server | FastAPI, Python 3.11 | REST API, validation, business logic |
| Domain Services | SQLAlchemy ORM | Model registry, deployment, metrics |
| Database | PostgreSQL 16 | Persistent storage |
| Worker | Celery + Redis | Async background tasks |
| Auth boundary | Bearer token (header) | API access control |

## Domain Model

```
MLModel (1) ──── (*) ModelVersion
                        │
                        └──── (*) Deployment ──── (*) DeploymentEvent
MLModel (1) ──── (*) ModelMetric
```

**LifecycleStage:** `DRAFT → VALIDATED → APPROVED → STAGING → PRODUCTION → ARCHIVED`

**DeploymentStatus:** `REQUESTED → VALIDATING → DEPLOYING → SUCCEEDED | FAILED → ROLLED_BACK`

Rules:
- Only `APPROVED` versions (approved=true) may be deployed to `production`
- Invalid stage transitions are rejected with HTTP 422
- Duplicate deployment requests with the same `idempotency_key` return the existing deployment

## Key Workflows

**Register and promote a model version:**
1. `POST /api/v1/models` → create model
2. `POST /api/v1/models/{id}/versions` → register version (DRAFT)
3. `PATCH .../stage` → VALIDATED → APPROVED (set approved=true)
4. `PATCH .../stage` → STAGING → PRODUCTION

**Deploy and rollback:**
1. `POST /api/v1/deployments` → triggers REQUESTED → DEPLOYING → SUCCEEDED
2. `POST /api/v1/deployments/{id}/rollback` → ROLLED_BACK
3. `POST /api/v1/deployments/{id}/retry` → re-runs from FAILED

## Reliability
- Idempotency key on deployments prevents duplicate processing
- Database transactions wrap deployment state transitions
- Health endpoint at `GET /health` for liveness checks

## Security
- No secrets committed — all config via environment variables
- CORS configured via middleware
- Bearer token header for API authentication (extensible)

## Observability
- Structured logging on all service operations (Python `logging`)
- Deployment event history stored per deployment
- Metrics endpoint per model: latency, throughput, error rate, drift, availability

## Scaling
- Backend is stateless — horizontally scalable behind a load balancer
- Celery workers scale independently via Redis queue
- PostgreSQL connection pooling via SQLAlchemy

## Trade-offs
- SQLite used in tests for isolation; PostgreSQL in production
- Synchronous deployment simulation (no real model runtime) — extensible to async Celery tasks
- No JWT auth implemented — bearer token stub is the extension point

## Diagram
See [architecture-diagram.png](architecture-diagram.png).

```
┌─────────────────────────────────────────────────────────┐
│                     Angular SPA                         │
│  Model Inventory │ Deployment View │ Monitoring Dashboard│
└────────────────────────┬────────────────────────────────┘
                         │ HTTP REST
┌────────────────────────▼────────────────────────────────┐
│                   FastAPI Backend                        │
│  /models  /deployments  /metrics  /health               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ ModelService │  │DeployService │  │MetricsService │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼────────────────┼───────────────────┼──────────┘
          │                │                   │
┌─────────▼────────────────▼───────────────────▼──────────┐
│                    PostgreSQL                            │
│  models │ model_versions │ deployments │ model_metrics   │
└─────────────────────────────────────────────────────────┘
          │
┌─────────▼──────────┐    ┌──────────────┐
│   Redis (broker)   │◄───│Celery Worker │
└────────────────────┘    └──────────────┘
```
