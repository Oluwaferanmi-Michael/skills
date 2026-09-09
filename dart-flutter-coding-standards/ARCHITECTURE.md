# ARCHITECTURE.md - Dart & Flutter Architectural Blueprints
<!-- Detailed structural patterns for scalable Flutter applications -->
<!-- Last updated: 2026-06-10 -->

This document defines the structural patterns for our Flutter applications. We support two primary architectural styles depending on the application's core driver: **Features** or **Platform/RBAC**.

All architectural implementations must adhere to the naming and coding standards defined in [CODING.md](./CODING.md) and the core rules defined in [PRINCIPLES.md](file:///C:/Users/aeche/Documents/Projects/aitools/.DartStandards/PRINCIPLES.md).

---

## Pattern 1: High-Scale Hybrid (Feature-Driven)
**Best for**: Apps that are a collection of independent domain tools with moderate RBAC needs. 

### Directory Structure
```
lib/
├── ui/                     # Global UI Foundations
│   ├── shared/             # Atomic widgets (Buttons, Inputs, Dialogs)
│   └── themes/             # AppColors, AppSpacing, AppTextStyles
├── core/                   # Shared Infrastructure
│   ├── api/                # Dio client, Interceptors
│   ├── router/             # GoRouter configuration
│   └── error/              # Base Failure classes, Result type
├── features/               # Vertical Domain Slices
│   └── <feature_name>/     # e.g., auth, dashboard, payments
│       ├── data/           # Repositories, DataSources, DTOs
│       ├── domain/         # Entities (Freezed), Repository Interfaces
│       └── presentation/   # UI & State Logic
│           ├── screens/    # Full-page screens
│           ├── widgets/    # Feature-specific local widgets
│           └── providers/  # Riverpod Notifiers/Controllers
├── main_development.dart   # Flavor-based entry points
├── main_staging.dart
└── main_production.dart
```

### The Layer Rules
1.  **Domain (Core Logic)**: No dependencies on other layers. Zero `material.dart` imports. Entities must be immutable (`freezed`). Every model, entity, failure, use case, or repository interface must follow the strict **1-Class-Per-File** rule in its respective domain directory.
2.  **Data (Implementation)**: Depends on `domain`. Handles JSON mapping and DB queries. Translates DTOs to Entities. Follows **1-Class-Per-File**.
3.  **Presentation (UI & State)**: Depends on `domain` for business logic. Uses `providers/` (Notifiers/Controllers) for all state & event handling logic.
    - **Feature Widgets** (`presentation/widgets/`): May watch granular Riverpod providers (Smart Widgets) to prevent parent re-renders and isolate rebuilds.
    - **Global Shared UI** (`ui/shared/`): Strictly data-agnostic presentation components accepting raw data/tokens via constructors and actions via callbacks.

---

## Pattern 2: Platform-Modular (Config & RBAC Driven)
**Best for**: Enterprise platforms where the UI is dynamic and driven by user roles and server configuration.

### Directory Structure
```
lib/
├── core/                       # THE PLATFORM ENGINE
│   ├── rbac/                   # Role definitions, Permission evaluators
│   ├── config/                 # UI Configuration parser (Server-Driven logic)
│   ├── api/                    # Dio client & networking infrastructure
│   └── router/                 # GoRouter config with RBAC Redirect Guards
├── capabilities/               # HEADLESS BUSINESS LOGIC (Feature-First)
│   └── <feature_name>/         # Domain, Data, and Providers (No UI imports)
├── ui/                         # THE VISUAL SHELL (Role-Based)
│   ├── components/             # Dumb, atomic, data-agnostic UI pieces
│   ├── guards/                 # UI-specific RBAC wrappers (PermissionGuard)
│   ├── theme/                  # Static design tokens (Colors, Spacing)
│   └── screens/                # Assembled Layouts divided by User Role
│       ├── admin/              
│       ├── member/             
│       └── shared/             
└── main_<flavor>.dart
```

### The Layer Rules
1. **Capability Layer**: Must be "Headless" (Zero `material.dart` imports). Exposes state and data only.
2. **Visual Shell**: Responsible for "Stitching" capabilities into role-specific screens.
3. **Data Agnostic UI**: Components in `ui/components` should take raw data (Strings, Ints), not domain entities, for maximum reusability.

---

## Universal Architectural Mandates

### 1. Dependency Rule
Dependencies always point inwards. UI depends on Domain/Providers. Data depends on Domain interfaces. Domain depends on nothing.

### 2. State Isolation
State should never be shared directly between features or capabilities. If `Feature A` needs data from `Feature B`, it must access it through a shared Provider in `core` or by watching `Feature B's` public provider.

### 3. Navigation Guards
RBAC is enforced primarily at the **Router level** (`core/router`) and secondary at the **Widget level** (`ui/guards`).

### 4. Flavor Management
Never use `if (kDebugMode)` for configuration. Always use the flavor-based entry points and `envied` configurations as defined in [Coding.md](./Coding.md).
