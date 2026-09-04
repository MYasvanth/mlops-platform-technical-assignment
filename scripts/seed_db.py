"""Seed the database with sample data from data/ folder."""
import csv
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import sys as _sys
if '/app' not in _sys.path:
    _sys.path.insert(0, '/app')

from app.database import SessionLocal, engine
from app.models.orm import Base, MLModel, ModelVersion, ModelMetric, LifecycleStage

DATA_DIR = os.environ.get('DATA_DIR', os.path.join(os.path.dirname(__file__), '..', 'data'))


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(MLModel).count() > 0:
            print("Database already seeded, skipping.")
            return

        # Load model registry
        with open(os.path.join(DATA_DIR, "sample_model_registry.json")) as f:
            registry = json.load(f)

        model_map: dict[str, MLModel] = {}
        for entry in registry:
            model = MLModel(
                id=entry["model_id"],
                name=entry["name"],
                owner=entry["owner"],
                framework=entry["framework"],
            )
            db.add(model)
            db.flush()
            model_map[entry["model_id"]] = model

            for v in entry["versions"]:
                version = ModelVersion(
                    model_id=model.id,
                    version=v["version"],
                    stage=LifecycleStage(v["stage"]),
                    approved=v["approved"],
                    artifact_uri=v.get("artifact_uri"),
                )
                db.add(version)

        # Load metrics
        with open(os.path.join(DATA_DIR, "sample_model_metrics.csv")) as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["model_id"] not in model_map:
                    continue
                db.add(ModelMetric(
                    model_id=row["model_id"],
                    version=row["version"],
                    environment=row["environment"],
                    timestamp=datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00")),
                    latency_ms=float(row["latency_ms"]),
                    throughput_rpm=float(row["throughput_rpm"]),
                    error_rate=float(row["error_rate"]),
                    quality_score=float(row["quality_score"]),
                    drift_score=float(row["drift_score"]),
                    availability=float(row["availability"]),
                ))

        db.commit()
        print(f"Seeded {len(registry)} models with versions and metrics.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
