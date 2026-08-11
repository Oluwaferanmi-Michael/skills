---
name: dart-flutter-coding-standards
description: Enforces non-negotiable Dart & Flutter engineering standards, architectural blueprints, state management, and strict file organization. Use when writing, modifying, reviewing, refactoring, or structuring Dart or Flutter code, features, models, or widgets.
---

# Dart & Flutter Engineering Standards

This skill governs the architecture, code organization, state management, and quality discipline for Dart and Flutter development in this repository.

---

## Non-Negotiable Mandates

1. **Strict 1-Class-Per-File**: Every file with a `class` declaration must contain **exactly one class** matching `snake_case.dart`. Co-located private helper/widget classes are strictly forbidden across all layers (Domain, Data, Presentation).
2. **Domain Isolation**: The Domain layer must be pure Dart. Zero dependencies on `package:flutter`, Riverpod, Dio, or database packages.
3. **Smart vs. Dumb UI Boundaries**:
   - **Shared Atomic UI (`lib/ui/shared/`)**: Strictly pure presentation widgets accepting primitive values or tokens via constructor and reporting actions via callbacks.
   - **Feature UI (`lib/features/...`)**: May watch granular Riverpod providers (Smart Widgets) for rebuild isolation and performance.
   - **Local Ephemeral State**: Use Flutter Hooks (`useState`, `useTextEditingController`, `useAnimationController`) inside `HookWidget` / `HookConsumerWidget`.
4. **Explicit Error Handling**: All business logic and repository functions must return a `Result<T>` wrapper. Never bubble unhandled exceptions to UI.
5. **Code Safety & Quality**:
   - Line length capped at 100 characters.
   - No force unwrapping with `!`. Use null-aware operators or pattern matching.
   - Riverpod code generation (`@riverpod`) is mandatory for providers.

---

## Operational Execution Workflow

### Step 1: Context & Architecture Alignment
Inspect the target directory structure and determine the architecture pattern:
- **Feature-Driven (High-Scale)**: Check `lib/features/<feature>/` (data, domain, presentation).
- **Platform-Modular (RBAC/Config)**: Check `lib/core/` and `lib/capabilities/`.

### Step 2: File Creation & Modular Placement
When creating or refactoring code:
- Ensure **every class** (entities, models, repositories, widgets, providers) gets its own dedicated file.
- Group domain enums, typedefs, and extensions in dedicated grouped files (`enums.dart`, `typedefs.dart`, `extensions.dart`).

### Step 3: Implementation & State Wiring
- Use `@riverpod` annotations for provider generation.
- Keep widget build methods under 60 lines.
- Utilize design tokens from `lib/ui/themes/` rather than hardcoded colors, spacing, or text styles.

### Step 4: Verification & Quality Gate
Run mandatory validation before completing any task:
1. Format code: `dart format --line-length 100 .`
2. Analyze project: `flutter analyze` or `dart analyze`
3. Ensure zero linter warnings or errors.

### Completion Criterion
The task is complete **only** when `dart format` and `flutter analyze` pass cleanly with zero warnings/errors, all classes follow 1-Class-Per-File, and all domain rules are respected.

---

## Disclosed References

- Detailed strategic beliefs and rules: [PRINCIPLES.md](file:///C:/Users/aeche/Documents/Projects/aitools/.DartStandards/PRINCIPLES.md)
- Syntax, Riverpod, Hooks, and widget guidelines: [CODING.md](file:///C:/Users/aeche/Documents/Projects/aitools/.DartStandards/CODING.md)
- Structural architectural blueprints: [ARCHITECTURE.md](file:///C:/Users/aeche/Documents/Projects/aitools/.DartStandards/ARCHITECTURE.md)
