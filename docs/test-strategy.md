# Test Strategy

## Unit Tests
- Lifecycle transition rules (`LIFECYCLE_TRANSITIONS` map)
- Invalid transition rejection
- Approval enforcement before PRODUCTION promotion
- Deployment status enum completeness

Files: `tests/test_lifecycle.py`

## API Tests
- Model CRUD: create, list, get, 404 on missing
- Version registration defaults (DRAFT, approved=false)
- Valid and invalid stage transitions (422 on bad transition)
- Unapproved version blocked from PRODUCTION (422)
- Deployment to staging succeeds
- Unapproved version blocked from production deployment
- Idempotent deployment (same id returned on duplicate key)
- Rollback SUCCEEDED deployment → ROLLED_BACK
- Retry rejected on non-FAILED deployment (422)
- 404 on missing deployment
- Deployment event history populated
- Simulate failure → FAILED with error_message set
- Retry after simulated failure → SUCCEEDED
- Duplicate model name → 409
- Duplicate version string on same model → 409
- Metrics returned for model; empty list if none; 404 on missing model; ordered by timestamp desc

Files: `tests/test_models_api.py`, `tests/test_deployments_api.py`, `tests/test_conflicts.py`, `tests/test_metrics_api.py`

## Integration Tests
- All API tests use a real SQLite DB (`test.db` file via pytest fixture)
- DB is created and dropped per test via `autouse` fixture
- FastAPI `dependency_overrides` isolates tests from production DB

## Angular Tests
- Component unit tests via Jasmine + Karma
- Service HTTP tests via `HttpClientTestingModule`
- Loading, error and empty state rendering
- Form validation

## End-to-End Scenario
1. Register model → register version → approve → promote to STAGING
2. Deploy to staging → verify SUCCEEDED
3. Seed metric directly → verify via metrics API
4. Roll back deployment → verify ROLLED_BACK
5. Attempt deploy unapproved version to production → verify 422

## CI, Coverage and Limitations
- CI runs `pytest` on every push via GitHub Actions
- SQLite used in tests; PostgreSQL used in production (parity via SQLAlchemy abstraction)
- No E2E browser tests in CI (Cypress not configured)
- Coverage not enforced by gate but target is 80%+
