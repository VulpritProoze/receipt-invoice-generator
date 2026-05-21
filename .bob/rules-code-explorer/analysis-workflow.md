# Code Explorer: Analysis Workflow

**Purpose**: Defines the step-by-step process for analyzing existing codebase features.

---

## Analysis Process

### 1. Entry Point Discovery

- Find the main entry points for the feature or area
- Trace from user action or external trigger through the stack
- Identify the "front door" — where does execution begin?

**What to look for:**
- Route handlers in `src/app/api/`
- Page components in `src/app/`
- Event handlers in UI components
- Middleware or guards
- External API calls or webhooks

### 2. Execution Path Tracing

- Follow the call chain from entry to completion
- Note branching logic and async boundaries
- Map data transformations and error paths
- Document what happens at each layer

**Tracing guidelines:**
- Start at the entry point and follow function calls
- Document each significant step in the flow
- Note where data shape changes (parsing, validation, transformation)
- Identify error handling and edge cases
- Mark async boundaries (promises, async/await)
- Flag any side effects (database writes, external API calls)

### 3. Architecture Layer Mapping

- Identify which layers the code touches (UI, API, business logic, data)
- Understand how those layers communicate
- Note reusable boundaries and anti-patterns
- Flag tight coupling or circular dependencies

**Layer identification:**
- **Presentation**: React components, pages, UI primitives
- **API**: Route handlers, middleware
- **Business Logic**: Service modules, utilities
- **Data**: Database access, Redis operations, external APIs
- **Models**: Zod schemas, TypeScript types

**Communication patterns to document:**
- How does UI call API? (fetch, server actions)
- How does API call business logic? (direct import, dependency injection)
- How does business logic access data? (through abstraction or direct)
- Are there clear boundaries or is everything mixed?

### 4. Pattern Recognition

- Identify the patterns and abstractions already in use
- Note naming conventions and code organization principles
- Document what "good" looks like in this codebase
- Flag deviations from established patterns

**Patterns to identify:**
- File organization (co-location, feature folders, layer separation)
- Naming conventions (camelCase, PascalCase, kebab-case)
- Error handling patterns (try/catch, Result types, error boundaries)
- Data validation patterns (Zod schemas, manual checks)
- Testing patterns (unit, integration, mocks)
- State management patterns (React context, props, server state)

### 5. Dependency Documentation

- Map external libraries and services
- Map internal module dependencies
- Identify shared utilities worth reusing
- Note version constraints or compatibility requirements

**Dependency mapping:**
- External: npm packages used and their purpose
- Internal: which modules import which other modules
- Shared utilities: reusable functions in `src/lib/`
- Circular dependencies: flag any circular imports
- Version constraints: note any peer dependencies or version locks

---

## Workflow Sequence

1. **Receive exploration request** with feature/area scope
2. **Identify entry points** using file structure and search
3. **Trace execution paths** from entry to completion
4. **Map architecture layers** and communication patterns
5. **Recognize patterns** and conventions in use
6. **Document dependencies** both external and internal
7. **Generate report** using the output format
8. **Confirm completion** with report location

---

## Analysis Depth Guidelines

**Shallow exploration** (1-2 files):
- Entry point identification
- High-level flow description
- Key dependencies listed

**Medium exploration** (3-10 files):
- Full execution path traced
- Layer boundaries documented
- Patterns identified
- Recommendations provided

**Deep exploration** (10+ files):
- Complete call graph mapped
- All dependencies documented
- Anti-patterns flagged
- Refactor opportunities identified
- Architecture insights detailed