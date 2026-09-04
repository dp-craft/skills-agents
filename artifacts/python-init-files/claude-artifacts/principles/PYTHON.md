<!-- LLM-PRIMARY: Python-specific coding principles. Loaded alongside COMMON.md. -->
<!-- Extends Core Principles §III (Code Quality), §III (Paradigm), §IV (Testing) with Python-specific enforcement. -->

## Python Principles

### Glossary (COMMON term → Python implementation)

| Core Term | Python Implementation |
|---|---|
| Public API boundary | `__init__.py` with explicit `__all__` list |
| State manager | Service class or module-level functions with DI |
| Composition mechanism | Dependency injection, protocols (`typing.Protocol`) |
| Infrastructure layer | ORM / raw DB driver (e.g., SQLAlchemy engine, asyncpg) |
| Service layer | Repository / service modules |
| Linter + type checker | Ruff + mypy (or pyright) `--strict` |
| Imperative iteration alternative | List/dict/set comprehensions, `map()`, `filter()`, generator expressions |

### Type System Enforcement

- Type hints are MANDATORY on all function signatures (parameters + return type)
- `mypy --strict` (or `pyright --strict`) MUST pass with zero errors
- No `Any` — use `object`, `Protocol`, or generic `TypeVar` with bounds
- `Final` for constants, `ClassVar` for class-level attributes
- `TypedDict` for structured dictionaries, `Literal` for constrained string values
- Union types (`X | Y`) over `Optional` for clarity (Python 3.10+)

### Linting & Type Checking

Ruff (`ruff check --fix .`) + mypy (`mypy --strict .`) MUST be run and pass before committing code changes.

### Functional Programming (MANDATORY)

Enforces Core Principles §III Paradigm Rules for Python:

| Rule | Enforcement |
|---|---|
| Side-effect-free business logic | Pure functions — I/O at boundaries (FastAPI routes, CLI entry points) |
| Immutability | `@dataclass(frozen=True)` for data, `tuple` over `list` for fixed collections, no reassignment |
| No imperative iteration for transforms | Comprehensions, `map()`, `filter()`, generator expressions |
| Classes as data carriers only | `@dataclass(frozen=True)` or `NamedTuple` — behavior in standalone functions |
| Explicit error handling | Return `Result`-style tuples or raise typed exceptions — no bare `except:` |

#### Anti-Pattern Table (LLM Imperative Bias Counters)

| Forbidden (LLM Default) | Required | Why LLMs default wrong |
|---|---|---|
| `result = []; for x in items: result.append(...)` | `result = [transform(x) for x in items]` | Imperative accumulation dominates Python training data |
| `class Config: def __init__(self): self.x = ...` | `@dataclass(frozen=True) class Config: x: str` | LLMs generate mutable classes by default |
| `def process(data): data['key'] = value` | `def process(data: Data) -> Data: return Data(..., key=value)` | In-place dict mutation is Python convention |
| `except Exception as e: pass` | `except SpecificError as e: logger.error(...)` | Bare except / silent catch dominates training data |
| `global counter; counter += 1` | Pass state as parameters, return new state | Global mutable state is common in tutorials |
| `def f(x, y, z, a, b, c):` | `def f(config: ProcessConfig):` | LLMs generate flat parameter lists; use dataclass for >3 params |
| `if x is not None: ... else: ...` | `match x: case Some(v): ... case None: ...` | Pattern matching (3.10+) is underrepresented in training data |

### Module Encapsulation (Python-specific)

- `__init__.py` MUST define `__all__` — only public API symbols
- Internal modules MUST use `_` prefix convention (e.g., `_helpers.py`)
- Cross-package imports MUST use the package's public API, not reach into internal modules

### Testing

- Test files are exempt from FP strict rules (mutable fixtures, monkey-patching, relaxed typing)
- pytest is the standard test runner
- `conftest.py` for shared fixtures, scoped to the narrowest directory possible
