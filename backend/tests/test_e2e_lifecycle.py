def test_full_mlops_lifecycle(client, db):
    """E2E: register model → register version → approve → deploy → view metrics → roll back."""
    # 1. Register model
    model = client.post("/api/v1/models", json={"name": "E2E Model", "owner": "Team A", "framework": "pytorch"}).json()
    assert model["id"]

    # 2. Register version
    version = client.post(f"/api/v1/models/{model['id']}/versions", json={"version": "1.0.0", "artifact_uri": "s3://bucket/e2e"}).json()
    assert version["stage"] == "DRAFT"
    assert version["approved"] is False

    # 3. Advance lifecycle and approve
    client.patch(f"/api/v1/models/{model['id']}/versions/{version['id']}/stage", json={"stage": "VALIDATED", "approved": True})
    client.patch(f"/api/v1/models/{model['id']}/versions/{version['id']}/stage", json={"stage": "APPROVED"})
    r = client.patch(f"/api/v1/models/{model['id']}/versions/{version['id']}/stage", json={"stage": "STAGING"})
    assert r.status_code == 200
    assert r.json()["approved"] is True

    # 4. Deploy to staging
    dep = client.post("/api/v1/deployments", json={
        "model_id": model["id"], "version_id": version["id"], "environment": "staging"
    }).json()
    assert dep["status"] == "SUCCEEDED"

    # 5. View metrics (seed one directly, then fetch via API)
    from app.models.orm import ModelMetric
    db.add(ModelMetric(model_id=model["id"], version="1.0.0", environment="staging", latency_ms=55.0, error_rate=0.02))
    db.commit()
    metrics = client.get(f"/api/v1/models/{model['id']}/metrics").json()
    assert len(metrics) == 1
    assert metrics[0]["latency_ms"] == 55.0

    # 6. Roll back deployment
    rb = client.post(f"/api/v1/deployments/{dep['id']}/rollback").json()
    assert rb["status"] == "ROLLED_BACK"
