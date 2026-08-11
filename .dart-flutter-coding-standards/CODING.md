# Coding.md - Dart & Flutter Coding Standards
<!-- Linting, syntax, formatting, and framework-specific patterns -->
<!-- Establishes non-negotiable standards for code quality and idiomatic Dart -->
<!-- Last updated: 2026-06-10 -->
For project-specific structure and architectural patterns, see [ARCHITECTURE.md](./ARCHITECTURE.md). For agent coding guidelines and development principles, see [PRINCIPLES.md](file:///C:/Users/aeche/Documents/Projects/aitools/.DartStandards/PRINCIPLES.md).

## 1. Tooling & Linting

### Analysis Configuration
All projects follow `very_good_analysis` with mandatory documentation and a strict 100-character line limit.

**Analysis Options** (`analysis_options.yaml`):
```yaml
include: package:very_good_analysis/analysis_options.yaml

linter:
  rules:
    public_member_api_docs: true
    lines_longer_than_80_chars: false # Capped at 100 characters
    sort_constructors_first: true
    prefer_final_locals: true
```

### Modern Syntax Preferences
1. **Static Member Shorthands**: Use dot-shorthands (e.g., `.primary` instead of `Colors.primary`).
2. **Constructor Tear-offs**: Prefer `.new` or named constructor tear-offs.
3. **Pattern Matching**: Use exhaustive `switch` expressions and destructuring.

### 1.3 Syntax & Idiomatic Dart
To ensure consistency and safety, we follow these non-negotiable syntax rules:

1. **Null Safety**: 
   - Never use the bang operator (`!`) unless a value is absolutely guaranteed to be non-null by a previous check in the same block.
   - Prefer null-aware operators (`?.`, `??`, `??=`) and the "if-case" pattern for null guarding.
2. **Strings**: 
   - Use **String Interpolation** (`'Hello, $name!'`) instead of concatenation.
   - Use triple quotes (`'''`) for multi-line strings.
3. **Collections**:
   - Use **Collection Literals** (`[]`, `{}`) instead of constructors (`List()`, `Map()`).
   - Use **Collection if/for** and the **Spread Operator** (`...`) for building complex collections declaratively.
4. **Asynchronous Code**:
   - Always use `async/await` instead of `.then()` for readability.
   - Use `Future.wait` for independent parallel operations.
5. **Cascades**: Use the cascade operator (`..`) when performing multiple operations on the same object to reduce variable repetition.
6. **Type Inference**: Use `var` or `final` for local variables when the type is obvious from the right-hand side (e.g., `final user = User();`). Always specify types for class members and function signatures.
7. **Parameters**: Prefer **Named Parameters** for constructors and functions with more than 2 arguments to improve call-site readability.
8. **Enums**: Standardize on **Simple Enums**. Avoid "Enhanced Enums" to prevent bloat in the domain layer. 
   - **Metadata**: Use separate helper methods or extension methods in the relevant layer to map enums to metadata (e.g., mapping a `Status` enum to a `Color` in the UI layer).
9. **Extensions**: Encouraged for adding utility methods to standard Dart or external types. Keep global extensions in `lib/core/extensions/`.
10. **Late Variables**: Use `late` with extreme caution. Only use it when initialization is strictly guaranteed before access (e.g., inside `initState`). Otherwise, prefer nullable types.

---

## 2. State Management & Data Flow

### Riverpod + Flutter Hooks
Standardize on `hooks_riverpod` for DI, presentation controllers, and local UI state.

- **Business Logic & Event Delegation**: Use `@riverpod` (Code Gen) with `AsyncNotifier` or `Notifier` for business logic and application state. Widgets are free to use asynchronous logic and local handlers when appropriate, while delegating complex domain operations to Notifiers.
- **UI & Ephemeral State**: Use Flutter Hooks (`useState`, `useTextEditingController`, `useAnimationController`) inside `HookWidget` / `HookConsumerWidget` for widget-scoped ephemeral state.
- **Smart vs. Dumb Widgets**:
  - **Shared UI** (`lib/ui/shared/`): Strictly dumb presentation widgets (data via constructor, events via callbacks).
  - **Feature UI** (`lib/features/...`): Feature widgets may watch specific Riverpod providers directly when fine-grained rebuild efficiency or state isolation is needed.
- **Data Flow**: Default to **Imperative (Futures)** for repository methods unless a reactive (Stream) requirement is explicitly justified.

---

## 3. Error Handling

### Hybrid Pattern
- **Infrastructure**: Throw `Exception` for unrecoverable failures.
- **Business Logic**: Return a **Result** type for expected domain errors.

```dart
abstract class Failure {
  final String message;
  final Exception? exception;
  final StackTrace? stackTrace;
  const Failure(this.message, [this.exception, this.stackTrace]);
}

sealed class Result<T> {
  const Result();
  const factory Result.ok(T value) = Ok._;
  const factory Result.error(Failure error) = Error._;

  TResult fold<TResult>({
    required TResult Function(T data) onSuccess,
    required TResult Function(Failure failure) onFailure,
  });
}
```

---

## 4. Widget Creation Standards

### Principles
1. **Stateless by Default**: Use `StatelessWidget`, `HookWidget`, or `HookConsumerWidget`.
2. **Dedicated Files**: Break down large build methods by extracting sub-widgets into separate dedicated files in a `widgets/` directory. Private co-located classes in the same file are strictly forbidden (enforcing 1-Class-Per-File).
3. **Small & Focused**: Keep `build` methods under 60 lines. Focus on clear, readable widget structure.

### UI Consistency
- **Static Style Classes**: Use centralized static classes in `ui/themes/` (see ARCHITECTURE.md) for all design tokens. No magic numbers.

---

## 5. Infrastructure & Environments

### Networking (Dio)
- Use `dio` with Interceptors. Map exceptions to domain `Failure` types in the Data layer.

### Environments
Use **Dart Define** + **Envied** for type-safe, obfuscated environment management.

---

## 6. Testing & Documentation

- **Core/Domain/Data**: **100% Coverage mandatory**.
- **Shared UI**: Widget and Golden tests required.
- **Documentation**: Use `dartdoc` format (`///`) for all public APIs.

---

## 7. Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Files | snake_case | `user_card.dart` |
| Classes | PascalCase | `UserRepository` |
| Functions / Variables | camelCase | `householdSize` |
| Constants | lowerCamelCase | `maxRetryCount` |
| Extensions | PascalCase | `StringX` |
| Commits | Conventional | `feat(auth): ...` |

---

## 8. Library & Import Organization (Barrel Files)

To reduce import bloat and elevate code readability, we use **Barrel Files** (export files) in major architectural directories.

### Conventions
- **Naming**: Use `barrel.dart` for the export file name within the directory (e.g., `lib/features/barrel.dart`).
- **Standard Locations**:
  - `lib/core/barrel.dart`: Exports shared infrastructure and base classes.
  - `lib/ui/shared/barrel.dart`: Exports all atomic UI components.
  - `lib/features/barrel.dart`: Exports the public screens/providers for all features.
- **Internal Layer Barrels**: For complex features, use barrels for internal layers (e.g., `lib/features/auth/domain/barrel.dart`).

### Usage
Instead of multiple imports:
```dart
// Bad
import 'package:app/ui/shared/app_button.dart';
import 'package:app/ui/shared/app_input.dart';
import 'package:app/ui/shared/app_dialog.dart';

// Good
import 'package:app/ui/shared/barrel.dart';
```

### Warning: Circular Dependencies
Be cautious when using barrel files. If `File A` in a barrel depends on `File B`, and `File B` imports the barrel itself, you may trigger a circular dependency. **Never import a barrel file from within the same directory it resides in.**
