# PRINCIPLES.md - Dart & Flutter Agent Coding Guidelines
<!-- Strategic core beliefs, development practices, and non-negotiable rules for AI agents -->
<!-- Last updated: 2026-07-22 -->

This document serves as the primary guidance for AI coding agents operating in this repository. It defines our core development principles and establishes concrete rules that agents must adhere to when generating, modifying, or refactoring code.

For structural patterns, see [ARCHITECTURE.md](file:///C:/Users/aeche/Documents/Projects/aitools/.DartStandards/ARCHITECTURE.md). For syntax and coding conventions, see [CODING.md](file:///C:/Users/aeche/Documents/Projects/aitools/.DartStandards/CODING.md).

---

## 1. Core Mindset: Craftsmanship over Convenience

We do not write "throwaway" or placeholder code. Every line of code written by an agent must match or exceed the quality of code written by a senior engineer.

1. **Complete Implementations**: Never leave unresolved `// TODO` tags, empty logic blocks, or stub functions unless explicitly instructed.
2. **Defensive Programming**: Write code that anticipates failure. Handle edge cases, nullability, network timeouts, and incorrect user inputs proactively.
3. **Self-Documenting Code**: Prefer clean, readable code and descriptive names over complex tricks. When writing non-obvious logic, write clear docstrings (`///`) and comments explaining the *why*, not just the *what*.
4. **KISS (Keep It Simple, Stupid)**: Do not over-engineer. Avoid adding speculative features, complex design patterns, or unnecessary levels of abstraction before they are actually needed (YAGNI). Write straightforward, readable code that is easy for human developers to reason about and debug.
5. **DRY (Don't Repeat Yourself)**: Avoid duplicating logic. When similar code blocks appear in multiple places, extract them into reusable extension methods (e.g. within `lib/core/extensions/`), domain services, or static utility classes (`abstract final class`). Never create loose top-level functions. Maintain semantic separation—do not force coupling between unrelated modules just to share superficially similar code.

---

## 2. One Class Per File & File Organization

To maintain clean module boundaries, high discoverability, and prevent file bloating, we strictly enforce our file organization patterns:

### Rule 2.1: One Class Per File
- **Strict 1-Class Limit Across All Layers**: Every Dart file containing a `class` declaration must contain **exactly one class**. The filename must strictly match the class name in `snake_case.dart` (e.g., `user_repository.dart` contains `UserRepository`).
  - **Domain Classes**: Every Domain entity, model, value object, failure, use case, or repository interface must reside in its own dedicated file within its respective domain directory (e.g., `domain/models/user_profile.dart`, `domain/repositories/user_repository.dart`).
  - **Widget Classes**: Every widget class must reside in its own dedicated file.
- **No Co-located Private Classes**: Declaring private helper classes or private widget classes inside the same file as a main class/widget is strictly **forbidden**. Extracted classes must be placed into their own dedicated files (e.g. inside a `widgets/` or `models/` directory).
- **Exceptions**:
  - **Freezed & Sealed Union Classes**: Union state representations using `@freezed` or Dart `sealed class` (e.g. `@freezed class AuthState with _$AuthState` containing `_Initial`, `_Loading`, `_Authenticated`, `_Error`) are permitted within a single file.
  - **Generated Files**: Generated code using `part` / `part of` (e.g., `.g.dart` or `.freezed.dart`) attached to a single file.

### Rule 2.2: Grouped Domain Files for Enums, Typedefs, and Extensions
Non-class top-level definitions do **not** require individual dedicated files per item and may be grouped by domain or feature:
- **Grouped Enum Files**: Multiple `enum` declarations belonging to the same domain may be combined into a domain enum file (e.g., `user_enums.dart`, `order_enums.dart`, or `enums.dart` inside a feature directory).
- **Grouped Typedef Files**: Function signature aliases and type definitions belonging to the same domain may be combined into a domain typedef file (e.g., `user_typedefs.dart` or `typedefs.dart`).
- **Grouped Extension Files**: Related extension methods belonging to the same domain or type may be combined into a domain extension file (e.g., `string_extensions.dart`, `datetime_extensions.dart`, or `extensions.dart`).

### Rule 2.3: No Top-Level / Hanging Functions
Free-floating top-level ("hanging") functions declared outside of any class or extension scope are strictly **forbidden**.
- **Encapsulation Standards**: All helper, transformation, and utility logic must be properly encapsulated:
  - **Type-Specific Utilities**: Prefer `extension` or `extension type` methods operating directly on the receiver type (e.g., `extension DateTimeFormatX on DateTime` placed in `lib/core/extensions/` or grouped extension files).
  - **Stateless / General Utilities**: Encapsulate static helper methods inside an uninstantiable utility class using modern Dart class modifiers (`abstract final class DateUtils { DateUtils._(); static DateTime parse(...) { ... } }`).
  - **Domain / Business Operations**: Encapsulate inside domain services, repositories, or use case classes following Rule 2.1.
- **Allowed Exceptions**:
  - **Entrypoints**: `void main()` in application flavor entry points (`main_development.dart`, `main_staging.dart`, `main_production.dart`) and test files (`*_test.dart`).
  - **Extensions & Extension Types**: Methods declared inside `extension` or `extension type` definitions.
  - **Enums & Typedefs**: Member methods inside `enum` definitions and `typedef` function signatures.
  - **Riverpod Generators**: Top-level `@riverpod` annotated provider declarations generated via `riverpod_generator` (e.g., `@riverpod String userName(Ref ref) => ...`).

---

## 3. Strict Rules for AI Coding Agents

When working on this codebase, all AI agents **must** enforce the following rules:

### Rule 3.1: Safety & Null Safety
- **No Bang Operator**: Never use the bang operator `!` to force-unwrap values unless a prior check in the immediate block guarantees non-nullability. Use null-aware operators (`?.`, `??`, `??=`) or if-case pattern matching.
- **Explicit Types**: Always specify parameter and return types for functions, constructors, and class members. Use type inference (`final`, `var`) only for local variables where the type is clear from the RHS.
- **Late Initialization**: Minimize the use of the `late` keyword. Use nullable types and proper initialization techniques instead.

### Rule 3.2: Architecture and Domain Isolation
- **Domain Independence**: The Domain layer must be pure Dart. It should only depend on core Dart libraries and domain models.
  - **Whitelisted Packages**: `package:meta/meta.dart`, `package:freezed_annotation/freezed_annotation.dart`, and `package:uuid/uuid.dart`.
  - **Forbidden Packages**: `package:flutter/material.dart`, `package:flutter/widgets.dart`, `package:flutter_riverpod`, `package:dio`, database drivers/clients (`package:hive`, `package:isar`), or any UI-related packages.
- **Capability Headlessness**: Capability packages must remain entirely headless (UI-less) to allow them to be stitched into different visual shells.
- **State Isolation**: Never allow features to modify each other's state directly. Communication between features must pass through public providers or shared providers located in `lib/core`.
- **Environment Management**: Never branch configurations using compiler flags or debug constants (e.g., `if (kDebugMode)`). Use `envied` based environment configurations class fields loaded from the appropriate target entry points (`main_development.dart`, etc.).

### Rule 3.3: Error Handling Discipline
- **Result Type Wrapper**: All business logic and repository functions must return the Result wrapper type. Never bubble raw infrastructure exceptions to the presentation layer.
- **Reactive Streams**: When using reactive streams (e.g., database streams, real-time sync), return `Stream<Result<T>>` instead of `Stream<T>` to ensure that stream errors are treated as explicit data and handled safely downstream.
- **Failure Mapping**: Convert network, database, or device exceptions into structured subclasses of Failure (e.g., `ServerFailure`) at the Data layer boundaries.
- **Structured Error Logging**: Always record caught exceptions and unrecoverable failures using `AppLog.error()` or `AppLog.fatal()` with full `error` and `stackTrace` parameters and scoped tags. Never use `print()` or `debugPrint()`.

### Rule 3.4: Code Readability & Style
- **Line Length**: Adhere to the strict 100-character line limit. Ensure the automatic formatter is run before completing a task.
- **Widget Decomposition**: Keep widget `build` methods under 60 lines. When breaking large widgets down, extract sub-widgets into separate dedicated files in a `widgets/` directory rather than creating private classes in the same file.
- **Centralized Design Tokens**: Never hardcode colors, spacing, margins, or fonts in widgets. Use the design tokens defined in the UI/theme package (e.g., `AppColors`, `AppSpacing`, `AppTextStyles`).
- **Smart vs. Dumb & Self-Managing Widgets**:
  - **Shared Atomic UI Components** (`lib/ui/shared/`): Must remain strictly pure, data-agnostic presentation widgets. They receive raw primitive data or design tokens via constructors and report actions exclusively via callbacks (`VoidCallback`, `ValueChanged`).
  - **Feature Widgets** (`lib/features/...`): Feature-level sub-widgets may watch granular Riverpod providers directly (Smart Widgets) when doing so isolates rebuilds, improves rendering performance, or prevents deep prop-drilling from parent containers.
  - **Local Ephemeral UI State**: Ephemeral UI state (e.g., focus, text input controllers, animation controllers, localized toggle states) should be managed locally using Flutter Hooks (`useTextEditingController`, `useState`, `useAnimationController`) inside `HookWidget` or `HookConsumerWidget`.
- **Notifier / Controller Delegation**:
  - Prefer encapsulating complex domain business logic and shared state operations in Notifiers/Controllers.
  - Widgets may incorporate asynchronous logic, local event handling, and UI side-effects when practical for application needs or component state.
  - Widget `build` methods should aim to remain clear and readable, avoiding excessive overpopulation of business logic where a Notifier/Controller is more appropriate.
- **No Side Effects in Build**: Never execute side effects (such as routing, displaying dialogs/snackbars, or triggering asynchronous database operations) directly inside the widget `build` function. All network/data fetches must be driven by Notifier/Provider initialization. UI-centric initialization and lifecycle effects must use Flutter Hooks (`useEffect` with a stable dependency list), and active triggers must run inside callbacks or listeners wrapped in `WidgetsBinding.instance.addPostFrameCallback`.
- **Exhaustive Async UI States**: When building UI that consumes asynchronous data (such as Riverpod's `AsyncValue`), use the `.when()` or `.maybeWhen()` patterns to handle Loading, Error, and Data states exhaustively. Never use inline raw widgets like `CircularProgressIndicator` or plain `Text` for errors; always utilize centralized widgets like `AppLoadingIndicator` or `AppErrorWidget` defined in `lib/ui/shared`.

### Rule 3.5: State Management & Code Generation
- **Mandatory Riverpod Generator**: All providers must be defined using the `@riverpod` syntax from the `riverpod_generator` package. Legacy manual provider declarations (e.g., `StateNotifierProvider`, `ChangeNotifierProvider`, `StateProvider`) are strictly forbidden.
- **Run build_runner**: Agents must run the build runner (`dart run build_runner build`) after adding or editing any provider definition to generate the required `.g.dart` files.

---

## 4. How Agents Should Navigate the Codebase

1. **Read Existing Context First**: Before modifying any feature, check the `barrel.dart` exports, the existing tests, and the layer architecture.
2. **Review before Submitting**: Always verify that your changes do not introduce analysis errors, warnings, or breaking changes in dependent modules.
3. **Format and Analyze**: Before declaring a task complete, agents must run the following commands to ensure formatting and analysis are clean:
   - Run code formatter: `dart format --line-length 100 .`
   - Run compiler check: `dart/flutter analyze`
4. **Write Tests for New Code**: For any core business logic, helpers, repositories, or providers, write matching unit/widget tests. Aim for 100% test coverage on newly added core logic.
