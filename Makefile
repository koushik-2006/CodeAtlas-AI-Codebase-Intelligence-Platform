.PHONY: help install dev dev-frontend dev-backend build build-pages test test-frontend test-backend lint typecheck docker-up docker-down

help:
	@echo "CodeAtlas Development Commands:"
	@echo "  make install        Install all frontend and backend dependencies"
	@echo "  make dev            Start frontend and backend development servers"
	@echo "  make dev-frontend   Start Next.js frontend on localhost:3000"
	@echo "  make dev-backend    Start FastAPI backend on localhost:8000"
	@echo "  make build          Build production Next.js frontend"
	@echo "  make build-pages    Build static export bundle for GitHub Pages"
	@echo "  make test           Run all frontend and backend test suites"
	@echo "  make lint           Run frontend linter"
	@echo "  make typecheck      Run TypeScript type checks"
	@echo "  make docker-up      Start full stack via Docker Compose"
	@echo "  make docker-down    Stop all Docker Compose services"

install:
	cd frontend && npm ci
	cd backend && pip install -r requirements.txt

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev:
	@echo "Starting full-stack development..."
	@make -j 2 dev-frontend dev-backend

build:
	cd frontend && npm run build

build-pages:
	cd frontend && npm run build:pages

test-frontend:
	cd frontend && npm test

test-backend:
	cd backend && pytest

test: test-frontend test-backend

lint:
	cd frontend && npm run lint

typecheck:
	cd frontend && npm run typecheck

docker-up:
	docker compose up -d

docker-down:
	docker compose down

