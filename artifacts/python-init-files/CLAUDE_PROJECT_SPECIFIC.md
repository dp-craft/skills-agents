## Active Targets

### Backend API

<!-- REPLACE: Describe your deployment target (e.g., FastAPI on Docker, Django on Heroku, CLI tool) -->

| Rule | Detail |
|---|---|
| Entry point | `src/main.py` or `src/app.py` |
| Framework | <!-- FastAPI / Django / Flask / CLI (click/typer) --> |
| Package manager | <!-- uv / poetry / pip --> |
| Python version | <!-- 3.11+ / 3.12+ --> |

## Product Overview

<!-- REPLACE: 1-3 sentence description of what this project does -->

## Active Technologies

<!-- REPLACE: List your actual stack -->
- Python 3.12+, type hints (strict mypy)
- <!-- Framework: FastAPI / Django / Flask -->
- <!-- ORM: SQLAlchemy / Django ORM / raw SQL -->
- <!-- Database: PostgreSQL / SQLite / Redis -->
- <!-- Testing: pytest, pytest-asyncio, httpx -->
- <!-- Linting: Ruff, mypy --strict -->

## Features

<!-- REPLACE: List features following the pattern below -->

### Example Feature

Description of what this feature does.

| Layer | Module | What it provides |
|---|---|---|
| Entry Point | `src/features/example/routes.py` | API endpoints |
| Service | `src/features/example/service.py` | Business logic |
| Repository | `src/features/example/repository.py` | Data access |

**Snapshot**: `features/example.md`

## Module Registry

Each row maps a directory to its architectural layer, role, and the features it serves. When a file in a module changes, ALL features in the "Serves" column should have their snapshot regenerated.

### Feature Modules

| Directory | Layer | Role | Serves |
|---|---|---|---|
| <!-- `src/features/X/` --> | <!-- Feature --> | <!-- Description --> | <!-- Feature names --> |

### Service Modules

| Directory | Layer | Role | Serves |
|---|---|---|---|
| <!-- `src/services/X/` --> | <!-- Service --> | <!-- Description --> | <!-- Feature names --> |

### Infrastructure

| Directory | Layer | Role | Serves |
|---|---|---|---|
| `src/db/` | Infrastructure | Database connection, migrations | (all services) |
| `src/lib/` | Utility | Shared pure functions | (all) |
| `src/domain/` | Domain | Shared types, constants, enums | (all features) |
| `src/config.py` | Config | App configuration, env loading | (all) |

## Import Rules

`src/` is the package root. Cross-feature: barrel only (`src.features.{name}`). Same feature: relative (`.`, `..`).

| Package | Exports |
|---|---|
| <!-- `src.features.example` --> | <!-- ExampleService, ExampleModel --> |

Shared (direct path OK): `src.lib.*`, `src.domain.*`, `src.db.*`, `src.config`

## Feature Discovery Convention

### Standard features

Features live in `src/features/*/`. Each feature directory maps to:
- **Package**: `src/features/{name}/__init__.py` (public API via `__all__`)
- **Internal structure**: `routes.py`, `service.py`, `repository.py`, `models.py`, `schemas.py`
- **Snapshot**: `claude-artifacts/project-snapshot/features/{name}.md`

### Snapshot regeneration rule

When a file changes, find its module in the Module Registry → read the "Serves" column → regenerate snapshot files for all listed features.

## Maintenance Protocol

When a session creates, renames, or removes a module:
1. Update the Features section if a feature was added/removed/changed
2. Update the Module Registry rows for affected directories
3. The snapshot command will pick up changes automatically via the registry
