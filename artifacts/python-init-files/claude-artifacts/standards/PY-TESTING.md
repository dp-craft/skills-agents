<!-- LLM-PRIMARY: Self-contained testing rules and patterns for Python test-writer agents. No dependency on COMMON.md. -->

# Common Testing Standards (Python)

## TDD Cycle (MANDATORY)

1. **Red**: Write failing test first
2. **Green**: Minimal code to pass
3. **Refactor**: Improve while tests green

Tests are ALWAYS written BEFORE implementation.

## Tools & Framework

- **pytest** — standard test runner, `pytest-asyncio` for async tests
- **pytest-cov** — coverage reporting
- **httpx** / **TestClient** — API integration testing (FastAPI)
- **factory_boy** or custom builders — test data factories
- **pytest-mock** (`mocker` fixture) — mocking at boundaries

## Test Code Rules

Test files follow project coding standards with these exemptions:

| Production rule | Test exemption | Reason |
|---|---|---|
| No mutable state | `let`-style reassignment in fixtures | Test lifecycle requires reassignment |
| No loops | `for` loops in parameterized setup | Sequential test data generation |
| No mutations | Mock mutations allowed (`mocker.patch`, fixture setup) | Mocking API is inherently imperative |
| Function max 20 lines | Relaxed to 30 lines | Complex arrange sections need space |
| No `Any` | Allowed sparingly in mock setup | Typed mocks preferred, but not always feasible |

All other project rules (strict types, pure logic, immutability, naming) apply to test code.

## Naming & Structure

- BDD naming: `test_should_{behavior}_when_{condition}`
- AAA structure: Arrange / Act / Assert (or Given / When / Then)
- One concept per test, no shared mutable state
- Mock only at boundaries (external deps, DB), not internal application code

## Coverage Requirements

Every test suite MUST cover:

- **Positive paths** — expected inputs produce correct outputs
- **Negative cases** — invalid inputs, error conditions, rejected states
- **Edge cases** — boundaries, empty, None, extremes, off-by-one
- **State transitions** — before/after comparison

## Test Organization

| Type | Location | Notes |
|---|---|---|
| Unit tests | `tests/unit/` or colocated `test_*.py` | Pure functions, services |
| Integration tests | `tests/integration/` | DB, external services |
| API tests | `tests/api/` | httpx / TestClient |
| E2E | `tests/e2e/` | Full workflow |

## Fixture Scoping

```python
# conftest.py — scope fixtures to the narrowest directory
@pytest.fixture
def user_repo(db_session: AsyncSession) -> UserRepository:
    return UserRepository(db_session)

@pytest.fixture
def sample_user() -> User:
    return create_test_user()
```

Shared fixtures live in the narrowest `conftest.py` that serves all consumers.

## Test Data Builders

```python
from dataclasses import replace
from src.domain.entities import User

DEFAULT_USER = User(
    id="test-id",
    name="Test User",
    email="test@example.com",
    is_active=True,
)

def create_test_user(**overrides: object) -> User:
    return replace(DEFAULT_USER, **overrides)
```

## Boundary Mocking

```python
# Mock at DB boundary
def test_should_return_user_when_exists(mocker):
    mock_repo = mocker.patch("src.features.users.service.user_repo")
    mock_repo.get_by_id.return_value = create_test_user()

    result = get_user("test-id")

    assert result.id == "test-id"

# Mock at HTTP boundary
def test_should_fetch_data(mocker):
    mock_response = mocker.patch("httpx.AsyncClient.get")
    mock_response.return_value = httpx.Response(200, json={"data": "value"})

# FORBIDDEN: mocking internal helpers
# mocker.patch("src.lib.format_name")  # Don't mock your own code
```

## Async Testing

```python
import pytest

@pytest.mark.asyncio
async def test_should_create_user(user_repo, db_session):
    user = create_test_user(name="New User")
    result = await user_repo.create(user)
    assert result.name == "New User"
```

## Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| Test implementation, not behavior | Assert on return values / side effects, not internal state |
| Shared mutable state | Fresh fixtures per test |
| Too many assertions | One concept per test |
| Missing cleanup | Use fixtures with proper teardown |
| Mocking everything | Mock only at boundaries |
| `time.sleep()` in tests | Use proper async waiting or mock time |

Code examples: `claude-artifacts/examples/python-unit-test-patterns.md`
