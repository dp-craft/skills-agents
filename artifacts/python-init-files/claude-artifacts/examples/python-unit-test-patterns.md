# Unit & Integration Test Patterns (Python)

Code examples for pytest. Uses AAA structure, builders, boundary mocking.

## Test Structure (AAA)

```python
import pytest
from src.features.chat.utils.message_transforms import filter_by_role
from tests.builders import create_test_message


class TestFilterByRole:
    def test_should_return_only_messages_matching_given_role(self):
        # Arrange
        messages = [
            create_test_message(role="user"),
            create_test_message(role="assistant"),
            create_test_message(role="user"),
        ]
        # Act
        result = filter_by_role(messages, "user")
        # Assert
        assert len(result) == 2
        assert all(m.role == "user" for m in result)

    def test_should_return_empty_when_no_messages_match(self):
        result = filter_by_role(
            [create_test_message(role="user")], "system"
        )
        assert len(result) == 0

    def test_should_return_empty_when_input_is_empty(self):
        assert len(filter_by_role([], "user")) == 0
```

## Test Data Builder

```python
# tests/builders.py
from dataclasses import replace
from datetime import datetime
from src.domain.entities import Message

_DEFAULT_MESSAGE = Message(
    id="test-msg-id",
    session_id="test-session-id",
    role="user",
    content="Test message content",
    created_at=datetime(2024, 1, 1),
)


def create_test_message(**overrides: object) -> Message:
    return replace(_DEFAULT_MESSAGE, **overrides)
```

## Service Test (with boundary mocking)

```python
import pytest
from unittest.mock import AsyncMock
from src.features.users.service import UserService
from tests.builders import create_test_user


@pytest.fixture
def mock_repo():
    return AsyncMock()


@pytest.fixture
def service(mock_repo):
    return UserService(repo=mock_repo)


class TestUserService:
    @pytest.mark.asyncio
    async def test_should_return_user_when_exists(self, service, mock_repo):
        # Arrange
        expected = create_test_user(name="Alice")
        mock_repo.get_by_id.return_value = expected

        # Act
        result = await service.get_user("test-id")

        # Assert
        assert result is not None
        assert result.name == "Alice"
        mock_repo.get_by_id.assert_called_once_with("test-id")

    @pytest.mark.asyncio
    async def test_should_return_none_when_user_not_found(self, service, mock_repo):
        mock_repo.get_by_id.return_value = None
        result = await service.get_user("nonexistent")
        assert result is None
```

## Result Type Testing

```python
from src.lib.validation import parse_api_key


def test_should_return_ok_when_input_is_valid():
    result = parse_api_key("sk-valid-key-1234567890")
    assert result.ok is True
    assert result.value == "sk-valid-key-1234567890"


def test_should_return_error_when_key_is_too_short():
    result = parse_api_key("sk")
    assert result.ok is False
    assert "at least" in result.error
```

## Boundary Mocking

```python
# Mock at DB boundary
@pytest.fixture
def mock_session(mocker):
    return mocker.patch("src.db.get_session")

# Mock at HTTP boundary
@pytest.fixture
def mock_httpx(mocker):
    return mocker.patch("httpx.AsyncClient.get")

# FORBIDDEN: mocking internal helpers
# mocker.patch("src.lib.format_name")  # Don't mock your own code
```

## Async Testing

```python
@pytest.mark.asyncio
async def test_should_resolve_with_data_when_fetch_succeeds(mock_httpx):
    mock_httpx.return_value = httpx.Response(
        200, json={"models": ["gpt-4"]}
    )
    result = await fetch_models("openai")
    assert result.ok is True


@pytest.mark.asyncio
async def test_should_return_error_when_fetch_fails(mock_httpx):
    mock_httpx.side_effect = httpx.ConnectError("Network error")
    result = await fetch_models("openai")
    assert result.ok is False
```

## Parametrized Tests

```python
@pytest.mark.parametrize(
    "input_value,expected",
    [
        ("hello", "Hello"),
        ("HELLO", "Hello"),
        ("", ""),
        ("hello world", "Hello world"),
    ],
)
def test_should_capitalize_first_letter(input_value, expected):
    assert capitalize_first(input_value) == expected
```

## Fixture Composition

```python
# conftest.py — narrowest scope
@pytest.fixture
async def db_session(engine):
    async with AsyncSession(engine) as session:
        yield session
        await session.rollback()


@pytest.fixture
def user_repo(db_session):
    return UserRepository(db_session)


@pytest.fixture
def user_service(user_repo):
    return UserService(user_repo)
```

## Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| Test implementation, not behavior | Assert on return values, not internal calls |
| Shared mutable state | Fresh fixtures per test |
| Too many assertions | One concept per test |
| Missing cleanup | Use fixtures with proper teardown |
| Mocking everything | Mock only at boundaries |
| `time.sleep()` in tests | Mock time or use async patterns |
