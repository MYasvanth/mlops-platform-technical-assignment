def _create_approved_version(client):
    model = client.post("/api/v1/models", json={"name": "M", "owner": "O", "framework": "sklearn"}).json()
    version = client.post(f"/api/v1/models/{model['id']}/versions", json={"version": "1.0.0"}).json()
    # Approve and advance to STAGING
    client.patch(f"/api/v1/models/{model['id']}/versions/{version['id']}/stage", json={"stage": "VALIDATED", "approved": True})
    client.patch(f"/api/v1/models/{model['id']}/versions/{version['id']}/stage", json={"stage": "APPROVED"})
    client.patch(f"/api/v1/models/{model['id']}/versions/{version['id']}/stage", json={"stage": "STAGING"})
    return model, version


def test_deploy_to_staging(client):
    model, version = _create_approved_version(client)
    r = client.post("/api/v1/deployments", json={
        "model_id": model["id"], "version_id": version["id"], "environment": "staging"
    })
    assert r.status_code == 202
    assert r.json()["status"] == "SUCCEEDED"


def test_deploy_unapproved_to_production_blocked(client):
    model = client.post("/api/v1/models", json={"name": "M", "owner": "O", "framework": "sklearn"}).json()
    version = client.post(f"/api/v1/models/{model['id']}/versions", json={"version": "1.0.0"}).json()

    r = client.post("/api/v1/deployments", json={
        "model_id": model["id"], "version_id": version["id"], "environment": "production"
    })
    assert r.status_code == 422
    assert "approved" in r.json()["detail"].lower()


def test_idempotent_deployment(client):
    model, version = _create_approved_version(client)
    payload = {"model_id": model["id"], "version_id": version["id"], "environment": "staging", "idempotency_key": "key-abc"}

    r1 = client.post("/api/v1/deployments", json=payload)
    r2 = client.post("/api/v1/deployments", json=payload)
    assert r1.status_code == 202
    assert r2.status_code == 202
    assert r1.json()["id"] == r2.json()["id"]


def test_rollback_deployment(client):
    model, version = _create_approved_version(client)
    dep = client.post("/api/v1/deployments", json={
        "model_id": model["id"], "version_id": version["id"], "environment": "staging"
    }).json()

    r = client.post(f"/api/v1/deployments/{dep['id']}/rollback")
    assert r.status_code == 200
    assert r.json()["status"] == "ROLLED_BACK"


def test_retry_non_failed_deployment_rejected(client):
    model, version = _create_approved_version(client)
    dep = client.post("/api/v1/deployments", json={
        "model_id": model["id"], "version_id": version["id"], "environment": "staging"
    }).json()

    r = client.post(f"/api/v1/deployments/{dep['id']}/retry")
    assert r.status_code == 422


def test_get_deployment_not_found(client):
    r = client.get("/api/v1/deployments/nonexistent")
    assert r.status_code == 404


def test_deployment_has_events(client):
    model, version = _create_approved_version(client)
    dep = client.post("/api/v1/deployments", json={
        "model_id": model["id"], "version_id": version["id"], "environment": "staging"
    }).json()

    r = client.get(f"/api/v1/deployments/{dep['id']}")
    assert r.status_code == 200
    assert len(r.json()["events"]) > 0


def test_simulate_failure(client):
    model, version = _create_approved_version(client)
    r = client.post("/api/v1/deployments", json={
        "model_id": model["id"], "version_id": version["id"],
        "environment": "staging", "simulate_failure": True
    })
    assert r.status_code == 202
    assert r.json()["status"] == "FAILED"
    assert r.json()["error_message"] is not None


def test_retry_after_simulated_failure(client):
    model, version = _create_approved_version(client)
    dep = client.post("/api/v1/deployments", json={
        "model_id": model["id"], "version_id": version["id"],
        "environment": "staging", "simulate_failure": True
    }).json()

    r = client.post(f"/api/v1/deployments/{dep['id']}/retry")
    assert r.status_code == 200
    assert r.json()["status"] == "SUCCEEDED"
