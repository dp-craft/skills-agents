# Python Patterns

Code examples for business logic, services, and error handling.

## Pure Function Module

```python
# src/features/chat/utils/message_transforms.py
from collections.abc import Sequence
from src.config import MESSAGE_LIMITS
from ..types import Message, MessageRole


def filter_by_role(
    messages: Sequence[Message],
    role: MessageRole,
) -> tuple[Message, ...]:
    return tuple(msg for msg in messages if msg.role == role)


def truncate_to_limit(
    messages: Sequence[Message],
    limit: int = MESSAGE_LIMITS.MAX_CONTEXT,
) -> tuple[Message, ...]:
    return tuple(messages[-limit:])


def count_tokens(messages: Sequence[Message]) -> int:
    return sum(len(msg.content) for msg in messages)
```

## Error Handling

### When to use each pattern

| Pattern | Use when | Example |
|---|---|---|
| `Result` discriminated union | Expected failure paths (validation, parsing, user input) | `parse_api_key`, `validate_config` |
| `try/except` specific | Unexpected failures at boundaries (DB, HTTP, file I/O) | `fetch_models`, `save_to_db` |
| Early return / guard | Guard clauses in functions | `if not input: return None` |
| Typed exceptions | Domain errors crossing boundaries | `raise UserNotFoundError(user_id)` |

### Result Type

```python
from __future__ import annotations
from dataclasses import dataclass
from typing import Generic, TypeVar, Union

T = TypeVar("T")
E = TypeVar("E")


@dataclass(frozen=True)
class Ok(Generic[T]):
    value: T
    ok: bool = True


@dataclass(frozen=True)
class Err(Generic[E]):
    error: E
    ok: bool = False


Result = Union[Ok[T], Err[E]]


def parse_api_key(raw: str) -> Result[str, str]:
    if len(raw) < MIN_KEY_LENGTH:
        return Err(f"Key must be at least {MIN_KEY_LENGTH} chars")
    return Ok(raw)
```

### Error propagation through layers

```
Repository (db/)      → try/except at DB boundary → return Result[T, E]
Service               → consume Result, raise domain exception or return → expose via return
Route handler         → catch domain exceptions → return HTTP error response
```

## Constants and Config

```python
# src/config.py — never hardcode values in logic files
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    max_context_messages: int = 100
    max_content_length: int = 32_000
    api_timeout_seconds: float = 30.0
    max_retries: int = 3
    database_url: str = "sqlite:///app.db"

    model_config = {"env_prefix": "APP_"}


settings = Settings()
```

## Frozen Dataclass (Immutable Data)

```python
from dataclasses import dataclass, replace
from datetime import datetime


@dataclass(frozen=True)
class User:
    id: str
    name: str
    email: str
    is_active: bool = True
    created_at: datetime = datetime.min


# Create modified copy (never mutate)
def deactivate_user(user: User) -> User:
    return replace(user, is_active=False)
```

## Repository Pattern

```python
# src/features/users/repository.py
from collections.abc import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db.models.user import UserModel
from ..types import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: str) -> User | None:
        stmt = select(UserModel).where(UserModel.id == user_id)
        result = await self._session.execute(stmt)
        row = result.scalar_one_or_none()
        return _to_entity(row) if row else None

    async def get_all(self) -> Sequence[User]:
        stmt = select(UserModel).order_by(UserModel.created_at.desc())
        result = await self._session.execute(stmt)
        return tuple(_to_entity(row) for row in result.scalars())

    async def create(self, user: User) -> User:
        model = _to_model(user)
        self._session.add(model)
        await self._session.flush()
        return _to_entity(model)


def _to_entity(model: UserModel) -> User:
    return User(
        id=model.id,
        name=model.name,
        email=model.email,
        is_active=model.is_active,
        created_at=model.created_at,
    )


def _to_model(entity: User) -> UserModel:
    return UserModel(
        id=entity.id,
        name=entity.name,
        email=entity.email,
        is_active=entity.is_active,
    )
```

## Service Pattern

```python
# src/features/users/service.py
from ..repository import UserRepository
from ..types import User, UserCreate
from src.lib.id_gen import generate_id


class UserService:
    def __init__(self, repo: UserRepository) -> None:
        self._repo = repo

    async def create_user(self, data: UserCreate) -> User:
        user = User(
            id=generate_id(),
            name=data.name,
            email=data.email,
        )
        return await self._repo.create(user)

    async def get_user(self, user_id: str) -> User | None:
        return await self._repo.get_by_id(user_id)
```

## Comprehension Patterns (Functional Style)

```python
# ✅ List comprehension (not for-loop + append)
active_users = [u for u in users if u.is_active]

# ✅ Dict comprehension
user_map = {u.id: u for u in users}

# ✅ Generator expression for lazy evaluation
total_length = sum(len(msg.content) for msg in messages)

# ✅ Chained transforms via functions
from functools import reduce
from operator import add

def pipeline(data: Sequence[RawItem]) -> Sequence[ProcessedItem]:
    validated = [validate(item) for item in data]
    filtered = [item for item in validated if item.is_valid]
    return tuple(transform(item) for item in filtered)
```

## AsyncGenerator Return Types

```python
# ✅ Explicit return type for async generators
from collections.abc import AsyncGenerator

async def stream_chat(
    params: StreamParams,
) -> AsyncGenerator[str | StreamEvent, None]:
    async for chunk in provider.stream(params):
        yield chunk
```
