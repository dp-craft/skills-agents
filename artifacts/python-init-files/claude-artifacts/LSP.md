<!-- LLM-PRIMARY: Code navigation guide for Python projects using Pyright LSP. -->

## Code Navigation

### Tool Priority Chain

| Priority | Tool | Use When | Availability |
|---|---|---|---|
| 1 | LSP (orchestrator pre-delegation) | Structural queries: exports, types, references, call sites | Orchestrator only (see Availability Status) |
| 2 | Grep / Glob | Text patterns, file discovery, regex search | All agents |
| 3 | Read | Behavior understanding: logic, control flow, error handling | All agents |

**Rule:** Structure questions → LSP or pre-delegated context. Behavior questions → Read.

### Operations Reference

All LSP operations require: `filePath`, `line` (1-based), `character` (1-based). Each call <100ms.

| Operation | Purpose | Use When | Grep Equivalent |
|---|---|---|---|
| `goToDefinition` | Where is this symbol defined? | Navigating to source of import/function/type | `Grep "def {name}\|class {name}"` |
| `goToImplementation` | What implements this Protocol? | Finding concrete implementations | `Grep "class.*Protocol"` + consumers |
| `findReferences` | Where is this symbol used? | Impact analysis, refactoring scope, blast radius | `Grep "import.*{name}"` + `Grep "{name}"` |
| `hover` | What is the type/signature? | Understanding types without reading file | Read the type definition file |
| `documentSymbol` | What's in this file? | File overview, public API surface, finding symbol positions | `Grep "^def \|^class "` in the file |
| `workspaceSymbol` | Find symbol by name across workspace | Discovering where something is defined | `Grep "def {name}\|class {name}"` across all files |
| `prepareCallHierarchy` | Get call hierarchy item at position | Setting up for incoming/outgoing analysis | — |
| `incomingCalls` | Who calls this function? | Understanding usage patterns, call sites | `Grep "{functionName}"` |
| `outgoingCalls` | What does this function call? | Understanding dependencies, data flow | Read the function body |

### When to Use LSP vs Read

| Question | Use LSP | Use Read |
|---|---|---|
| What does this module export? | `documentSymbol` | — |
| What are the params of this function? | `hover` on function name | — |
| What imports this module? | `findReferences` on exports | — |
| What does this function call? | `outgoingCalls` | — |
| Who calls this function? | `incomingCalls` | — |
| What type is this variable? | `hover` | — |
| What tests exist for a file? | `documentSymbol` on test file | — |
| What does this function DO? | — | Read the file |
| How does this service handle errors? | — | Read the file |

### Pre-Delegation Protocol

Before launching a subagent for a task involving specific files, the orchestrator gathers structural context via LSP and passes it as a `<navigation_context>` block. This saves ~50% cost vs agents discovering structure themselves.

**Steps:**

1. Identify target files from the task description
2. Run LSP queries on those files:
   - `documentSymbol` → exports, function signatures, class members
   - `hover` → type definitions, parameter types
   - `findReferences` → call sites, consumers, blast radius
3. Format results as a `<navigation_context>` block in the agent prompt:

```xml
<navigation_context>
## src/features/users/service.py
Exports: create_user, get_user, delete_user
Key types: UserCreate(BaseModel), UserResponse(BaseModel), User(SQLAlchemy model)
References: used by routes.py (line 12), tests/test_service.py (line 5)

## src/db/repositories/user_repo.py
Exports: UserRepository
Types: UserRepository { get_by_id, get_all, create, delete }
</navigation_context>
```

4. **Branching summary** (REQUIRED for modules with conditional code paths): Map conditions → code paths so agents mock/test the correct path:

```xml
<branching_summary>
| Condition | Code Path |
|---|---|
| user.is_admin=True | admin_workflow() → full access |
| user.is_admin=False | standard_workflow() → filtered results |
| db connection fails | raise DatabaseError → 503 |
</branching_summary>
```

**Cost:** ~5-15 LSP calls, <2s total.

### Agent Navigation Protocol

Two paths depending on whether the orchestrator provided pre-delegation context:

**Path A — Context provided (`<navigation_context>` block in prompt):**
1. Use the provided exports, types, line numbers, and call sites directly
2. Skip Grep/Glob/Read discovery for files covered in the context
3. Read files only for behavior understanding (logic, control flow)

**Path B — No context provided:**
1. Use Grep/Glob for file discovery and structure
2. Read files for both structure and behavior
3. Follow the Grep Equivalent column in the Operations Reference table

### LSP Availability Status

| Context | LSP Available | Why |
|---|---|---|
| Main conversation (orchestrator) | **Yes** | Full tool access |
| Agents with `LSP` in `tools:` field | **Yes** | Explicitly granted via allowlist |
| Agents without `LSP` in `tools:` field | **No** | Not in tool allowlist |

**Pre-delegation benefits:** Even with direct LSP access, orchestrator pre-delegation remains valuable — it saves 20-50% tokens and 59-75% time by gathering context once rather than agents discovering it independently.
