# ADR-001: FastAPI as Backend Framework

## Status
Accepted

## Context
The platform requires a Python REST API with typed request/response contracts, automatic OpenAPI documentation, async support and strong validation. The team evaluated Flask, Django REST Framework and FastAPI.

## Decision
Use FastAPI with Pydantic v2 for the backend API layer.

## Alternatives Considered
- **Flask** — minimal but requires manual validation, no built-in OpenAPI, no async
- **Django REST Framework** — full-featured but heavyweight for this scope; ORM coupling adds friction

## Consequences

### Positive
- Automatic OpenAPI/Swagger docs at `/docs` with zero configuration
- Pydantic v2 provides fast, typed validation with clear error messages
- Native async support for future Celery/WebSocket integration
- Dependency injection via `Depends` makes testing clean (DB override in tests)

### Negative
- Smaller ecosystem than Django for admin tooling
- Async patterns require care to avoid blocking the event loop

## Follow-up Actions
- Add JWT middleware when auth is hardened
- Evaluate async SQLAlchemy if query latency becomes a bottleneck
