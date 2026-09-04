<!-- LLM-PRIMARY: E2E testing patterns for Python projects. Self-contained for e2e-test-writer agent. Shared patterns in PY-TESTING.md. -->

# E2E Testing (Python)

Shared testing rules (TDD, naming, coverage, test code exemptions): `claude-artifacts/standards/PY-TESTING.md`

## API E2E Test Structure (FastAPI)

```python
import pytest
from httpx import AsyncClient, ASGITransport
from src.main import app

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
class TestUserWorkflow:
    async def test_should_create_and_retrieve_user(self, client: AsyncClient):
        # Given
        user_data = {"name": "Test User", "email": "test@example.com"}

        # When - Create
        create_response = await client.post("/api/users", json=user_data)

        # Then
        assert create_response.status_code == 201
        user_id = create_response.json()["id"]

        # When - Retrieve
        get_response = await client.get(f"/api/users/{user_id}")

        # Then
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Test User"
```

## CLI E2E Test Structure

```python
from click.testing import CliRunner
from src.cli.main import app

@pytest.fixture
def runner():
    return CliRunner()

def test_should_complete_full_workflow(runner, tmp_path):
    # Given
    config_file = tmp_path / "config.toml"
    config_file.write_text('[database]\nurl = "sqlite:///test.db"')

    # When
    result = runner.invoke(app, ["init", "--config", str(config_file)])

    # Then
    assert result.exit_code == 0
    assert "Initialized" in result.output
```

## Database Fixtures

```python
@pytest.fixture(scope="session")
def engine():
    engine = create_engine("sqlite:///test.db")
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

@pytest.fixture
async def db_session(engine):
    async with AsyncSession(engine) as session:
        async with session.begin():
            yield session
        await session.rollback()
```

## Persistence (Full Cycle)

```python
@pytest.mark.asyncio
async def test_should_persist_across_requests(client: AsyncClient):
    # Create
    response = await client.post("/api/items", json={"title": "Persistent"})
    item_id = response.json()["id"]

    # Verify persistence
    response = await client.get(f"/api/items/{item_id}")
    assert response.json()["title"] == "Persistent"

    # Verify after "restart" (new client session)
    response = await client.get(f"/api/items/{item_id}")
    assert response.status_code == 200
```

## Error Handling

```python
@pytest.mark.asyncio
async def test_should_return_404_for_missing_resource(client: AsyncClient):
    response = await client.get("/api/users/nonexistent-id")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_should_return_422_for_invalid_input(client: AsyncClient):
    response = await client.post("/api/users", json={"name": ""})
    assert response.status_code == 422
```

## Batch Operations

```python
items = ["Item 1", "Item 2", "Item 3"]
for item in items:
    response = await client.post("/api/items", json={"title": item})
    assert response.status_code == 201

response = await client.get("/api/items")
titles = [i["title"] for i in response.json()]
for item in items:
    assert item in titles
```

## Coverage

- Happy paths: All user flows
- Edge cases: Empty, whitespace, boundaries
- Error paths: Validation, missing resources, auth failures
- Persistence: Create → Read → Update → Delete
- Concurrent: Parallel requests (where applicable)
- Auth: Protected endpoints, token expiry

## Waiting (No Arbitrary Timeouts)

```python
# Use proper async patterns, not sleep
# FORBIDDEN: await asyncio.sleep(1)

# For background task completion:
import asyncio

async def wait_for_condition(check, timeout=5.0):
    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        if await check():
            return
        await asyncio.sleep(0.1)
    raise TimeoutError("Condition not met")
```

Code examples: `claude-artifacts/examples/python-e2e-test-patterns.md`
