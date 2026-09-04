# API Design

## Base URL
`http://localhost:8000/api/v1`

## Authentication
`Authorization: Bearer <token>` header (stub — extend with JWT).

## Endpoints

### Models
| Method | Path | Status | Description |
|--------|------|--------|-------------|
| POST | `/models` | 201 | Register a new model |
| GET | `/models` | 200 | List all models |
| GET | `/models/{model_id}` | 200 | Get model details |
| POST | `/models/{model_id}/versions` | 201 | Register a new version |
| GET | `/models/{model_id}/versions` | 200 | List versions for a model |
| PATCH | `/models/{model_id}/versions/{version_id}/stage` | 200 | Update lifecycle stage / approval |
| GET | `/models/{model_id}/versions/compare?v1=<id>&v2=<id>` | 200 | Compare two versions side-by-side |

### Deployments
| Method | Path | Status | Description |
|--------|------|--------|-------------|
| POST | `/deployments` | 202 | Request a deployment. Pass `simulate_failure: true` to simulate a FAILED state for testing retry. |
| GET | `/deployments` | 200 | List all deployments |
| GET | `/deployments/{deployment_id}` | 200 | Get deployment + event history |
| POST | `/deployments/{deployment_id}/retry` | 200 | Retry a FAILED deployment |
| POST | `/deployments/{deployment_id}/rollback` | 200 | Roll back a SUCCEEDED deployment |

### Metrics
| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | `/models/{model_id}/metrics` | 200 | Get monitoring metrics for a model |

### Health
| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | `/health` | 200 | Liveness check |

## Error Format
All errors return `{"detail": "<message>"}` with appropriate HTTP status codes:
- `404` — resource not found
- `422` — validation error or invalid lifecycle transition
- `500` — unhandled server error

## Lifecycle Stage Transitions
```
DRAFT → VALIDATED → APPROVED → STAGING → PRODUCTION → ARCHIVED
```
- Unapproved versions are blocked from PRODUCTION (HTTP 422)
- Invalid transitions return HTTP 422 with allowed transitions listed

## Idempotency
Pass `idempotency_key` in deployment requests to safely retry without creating duplicates.

## Interactive Docs
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
