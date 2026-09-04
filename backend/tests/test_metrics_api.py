def _create_model(client):
    return client.post("/api/v1/models", json={"name": "M", "owner": "O", "framework": "sklearn"}).json()


def _seed_metric(db, model_id):
    from app.models.orm import ModelMetric
    m = ModelMetric(model_id=model_id, version="1.0.0", environment="production", latency_ms=42.0, error_rate=0.01)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def test_get_metrics_empty(client):
    model = _create_model(client)
    r = client.get(f"/api/v1/models/{model['id']}/metrics")
    assert r.status_code == 200
    assert r.json() == []


def test_get_metrics_returns_data(client, db):
    model = _create_model(client)
    _seed_metric(db, model["id"])
    r = client.get(f"/api/v1/models/{model['id']}/metrics")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["latency_ms"] == 42.0
    assert data[0]["error_rate"] == 0.01


def test_get_metrics_model_not_found(client):
    r = client.get("/api/v1/models/nonexistent/metrics")
    assert r.status_code == 404


def test_get_metrics_ordered_by_timestamp_desc(client, db):
    from app.models.orm import ModelMetric
    from datetime import datetime, timezone, timedelta
    model = _create_model(client)
    now = datetime.now(timezone.utc)
    db.add(ModelMetric(model_id=model["id"], version="1.0", environment="prod", latency_ms=10.0, timestamp=now - timedelta(hours=1)))
    db.add(ModelMetric(model_id=model["id"], version="1.0", environment="prod", latency_ms=99.0, timestamp=now))
    db.commit()
    r = client.get(f"/api/v1/models/{model['id']}/metrics")
    assert r.status_code == 200
    assert r.json()[0]["latency_ms"] == 99.0
