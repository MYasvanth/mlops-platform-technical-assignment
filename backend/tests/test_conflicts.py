def test_duplicate_model_name_conflict(client):
    payload = {"name": "UniqueModel", "owner": "Team A", "framework": "pytorch"}
    r1 = client.post("/api/v1/models", json=payload)
    assert r1.status_code == 201
    r2 = client.post("/api/v1/models", json=payload)
    assert r2.status_code == 409
    assert "already exists" in r2.json()["detail"].lower()


def test_duplicate_version_string_conflict(client):
    model = client.post("/api/v1/models", json={"name": "M", "owner": "O", "framework": "sklearn"}).json()
    client.post(f"/api/v1/models/{model['id']}/versions", json={"version": "1.0.0"})
    r = client.post(f"/api/v1/models/{model['id']}/versions", json={"version": "1.0.0"})
    assert r.status_code == 409
    assert "already exists" in r.json()["detail"].lower()
