def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_create_and_list_model(client):
    payload = {"name": "Test Model", "owner": "Team A", "framework": "scikit-learn"}
    r = client.post("/api/v1/models", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Test Model"
    assert data["id"]

    r2 = client.get("/api/v1/models")
    assert r2.status_code == 200
    assert len(r2.json()) == 1


def test_get_model_not_found(client):
    r = client.get("/api/v1/models/nonexistent")
    assert r.status_code == 404


def test_create_version(client):
    model = client.post("/api/v1/models", json={"name": "M", "owner": "O", "framework": "pytorch"}).json()
    r = client.post(f"/api/v1/models/{model['id']}/versions", json={"version": "1.0.0", "artifact_uri": "s3://bucket/model"})
    assert r.status_code == 201
    assert r.json()["stage"] == "DRAFT"
    assert r.json()["approved"] is False


def test_valid_stage_transition(client):
    model = client.post("/api/v1/models", json={"name": "M", "owner": "O", "framework": "pytorch"}).json()
    version = client.post(f"/api/v1/models/{model['id']}/versions", json={"version": "1.0.0"}).json()

    r = client.patch(
        f"/api/v1/models/{model['id']}/versions/{version['id']}/stage",
        json={"stage": "VALIDATED"},
    )
    assert r.status_code == 200
    assert r.json()["stage"] == "VALIDATED"


def test_invalid_stage_transition(client):
    model = client.post("/api/v1/models", json={"name": "M", "owner": "O", "framework": "pytorch"}).json()
    version = client.post(f"/api/v1/models/{model['id']}/versions", json={"version": "1.0.0"}).json()

    r = client.patch(
        f"/api/v1/models/{model['id']}/versions/{version['id']}/stage",
        json={"stage": "PRODUCTION"},
    )
    assert r.status_code == 422


def test_unapproved_version_blocked_from_production(client):
    model = client.post("/api/v1/models", json={"name": "M", "owner": "O", "framework": "pytorch"}).json()
    version = client.post(f"/api/v1/models/{model['id']}/versions", json={"version": "1.0.0"}).json()

    # Advance to APPROVED stage but keep approved=False
    client.patch(f"/api/v1/models/{model['id']}/versions/{version['id']}/stage", json={"stage": "VALIDATED"})
    client.patch(f"/api/v1/models/{model['id']}/versions/{version['id']}/stage", json={"stage": "APPROVED"})
    client.patch(f"/api/v1/models/{model['id']}/versions/{version['id']}/stage", json={"stage": "STAGING"})

    r = client.patch(
        f"/api/v1/models/{model['id']}/versions/{version['id']}/stage",
        json={"stage": "PRODUCTION"},
    )
    assert r.status_code == 422
    assert "approved" in r.json()["detail"].lower()
