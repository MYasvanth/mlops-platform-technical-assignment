.PHONY: up down build test-backend test-frontend lint migrate

up:
	docker compose up --build

down:
	docker compose down -v

build:
	docker compose build

test-backend:
	cd backend && pytest

test-frontend:
	cd frontend && npm test -- --watch=false --browsers=ChromeHeadless

lint:
	cd backend && flake8 app tests
	cd frontend && npm run lint

migrate:
	cd backend && alembic upgrade head
