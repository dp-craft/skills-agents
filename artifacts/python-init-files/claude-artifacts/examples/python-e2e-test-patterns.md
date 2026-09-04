# E2E Test Patterns (Python)

Code examples for API E2E tests with httpx/TestClient and CLI tests.

## API Test Structure (FastAPI)

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
    async def test_should_create_user_and_retrieve(self, client: AsyncClient):
        # Given
        user_data = {"name": "Test User", "email": "test@example.com"}

        # When - Create
        response = await client.post("/api/users", json=user_data)

        # Then
        assert response.status_code == 201
        user_id = response.json()["id"]

        # When - Retrieve
        response = await client.get(f"/api/users/{user_id}")

        # Then
        assert response.status_code == 200
        assert response.json()["name"] == "Test User"
```

## CLI Test Structure

```python
from click.testing import CliRunner
from src.cli.main import app


@pytest.fixture
def runner():
    return CliRunner()


def test_should_complete_init_workflow(runner, tmp_path):
    # Given
    config = tmp_path / "config.toml"
    config.write_text('[db]\nurl = "sqlite:///test.db"')

    # When
    result = runner.invoke(app, ["init", "--config", str(config)])

    # Then
    assert result.exit_code == 0
    assert "Initialized" in result.output
```

## Database Setup / Teardown

```python
@pytest.fixture(scope="session")
async def engine():
    engine = create_async_engine("sqlite+aiosqlite:///test.db")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(engine):
    async with AsyncSession(engine) as session:
        yield session
        await session.rollback()
```

## CRUD Full Cycle

```python
@pytest.mark.asyncio
async def test_should_support_full_crud_lifecycle(client: AsyncClient):
    # Create
    response = await client.post("/api/items", json={"title": "Test"})
    assert response.status_code == 201
    item_id = response.json()["id"]

    # Read
    response = await client.get(f"/api/items/{item_id}")
    assert response.json()["title"] == "Test"

    # Update
    response = await client.put(
        f"/api/items/{item_id}", json={"title": "Updated"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated"

    # Delete
    response = await client.delete(f"/api/items/{item_id}")
    assert response.status_code == 204

    # Verify deleted
    response = await client.get(f"/api/items/{item_id}")
    assert response.status_code == 404
```

## Error Responses

```python
@pytest.mark.asyncio
async def test_should_return_404_for_missing_resource(client: AsyncClient):
    response = await client.get("/api/users/nonexistent")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_should_return_422_for_invalid_input(client: AsyncClient):
    response = await client.post("/api/users", json={"name": ""})
    assert response.status_code == 422
```

## Auth-Protected Endpoints

```python
@pytest.fixture
async def auth_headers(client: AsyncClient):
    response = await client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "secret"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_should_reject_unauthenticated_request(client: AsyncClient):
    response = await client.get("/api/protected")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_should_allow_authenticated_request(
    client: AsyncClient, auth_headers: dict
):
    response = await client.get("/api/protected", headers=auth_headers)
    assert response.status_code == 200
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

- Happy paths: All user flows (CRUD)
- Edge cases: Empty, whitespace, boundaries
- Error paths: Validation, missing resources, auth failures
- Persistence: Create → Read → Update → Delete
- Auth: Protected endpoints, expired tokens, wrong roles
- Concurrent: Parallel requests (where applicable)
