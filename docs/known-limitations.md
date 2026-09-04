# Known Limitations

- **No JWT authentication** — API accepts any bearer token; auth middleware is a stub for extension
- **No real model runtime** — deployment transitions simulate the workflow; no real model serving integration
- **Celery worker handles async completion** — `process_deployment` task advances DEPLOYING → SUCCEEDED; falls back to synchronous if Redis is unavailable
- **No HTTPS in local dev** — TLS termination expected at load balancer in production
- **Monitoring data is seeded** — metrics come from CSV seed data; no live inference pipeline connected
- **No pagination** — list endpoints return all records; large datasets will need pagination added
- **Architecture diagram is a text diagram** — PNG diagram requires manual creation with a diagramming tool
