---
name: codebase-audit
description: Audit codebases to evaluate architecture, health, and code quality using a Good/Bad/Ugly triage. Use when asked to audit, inspect code health, review architecture, or report the good, bad, and ugly of a repository.
---

# Codebase Audit: The Good, The Bad, and The Ugly

This skill performs a rigorous, evidence-grounded health audit of a codebase. It discovers architectural strengths, flags anti-patterns, prescribes concrete code fixes, and compiles an actionable priority roadmap.

---

## Core Mandates

1. **Grounded Findings**: Every identified defect must link to an exact file and line number range using clickable markdown links: `[filename.ext:L12-L34](file:///path/to/filename.ext#L12-L34)`. Vague, unlocated assertions are strictly forbidden.
2. **Requirements-Anchored**: Fixes must align with explicit project governance documents (`AGENTS.md`, `UBIQUITOUS_LANGUAGE.md`, `ARCHITECTURE.md`, `CODING.md`, or repository skills). If no such governance files exist, anchor recommendations against established industry standards.
3. **Prescriptive Remediations**: Every Bad and Ugly finding must provide a concrete, drop-in proposed fix or diff. Identifying problems without providing the code-level remedy is prohibited.
4. **Actionable Roadmap**: The audit must conclude with a consolidated Priority Action Plan table ranked from `P0` down to `Pn`.

---

## Operational Workflow

### Step 1: Requirements & Standards Discovery
Examine the repository root and docs for project governance:
1. Search for project specification files: `AGENTS.md`, `UBIQUITOUS_LANGUAGE.md`, `ARCHITECTURE.md`, `CODING.md`, `CONTRIBUTING.md`, and any `.cursorrules` or skill definitions.
2. Detect the technology stack, package managers, and configuration files (e.g., `package.json`, `pubspec.yaml`, `Cargo.toml`, `go.mod`, `pyproject.toml`).
3. Note whether the audit is **spec-governed** (governance files found) or **industry-standard fallback** (no governance files found).

*Completion criterion*: The project stack and governing requirements baseline are explicitly stated before code analysis begins.

### Step 2: Hybrid Codebase Diagnostics
Execute a combined static and automated diagnostic sweep:
1. **Automated Verification**: If the environment has project linters, analyzers, or test suites (e.g., `flutter analyze`, `npm run lint`, `cargo check`, `pytest`), run them to identify mechanical failures.
2. **Structural & Pattern Inspection**: Inspect core architectural layers (Domain, Data, Presentation, API, State Management):
   - Check file-to-class boundaries, modularity, and layer separation.
   - Scan for critical antipatterns (leaking abstractions, missing error handling, unchecked null/type casts, memory leaks, unclosed resources).
   - Check security configurations (hardcoded secrets, unescaped inputs, loose auth checks).

*Completion criterion*: Diagnostic logs or manual code inspection notes cover every primary directory in the source tree.

### Step 3: Triage & Classification
Categorize all findings using the three-tier model detailed in [RUBRIC.md](RUBRIC.md):
- 🟢 **The Good (Strengths)**: Exemplary architectural patterns, clean domain boundaries, high test coverage, robust error handling, and strict compliance with project specifications.
- 🟠 **The Bad (Technical Debt / P2–P3)**: Code smells, duplication, missing types/docs, minor performance bottlenecks, non-critical pattern deviations.
- 🔴 **The Ugly (Critical Defects / P0–P1)**: Security vulnerabilities, data integrity risks, unhandled crash vectors, severe architectural boundary violations, and direct violations of core project rules.

*Completion criterion*: Every finding is assigned to exactly one tier (🟢, 🟠, or 🔴) and mapped to a priority level (`P0` through `Pn`).

### Step 4: Remediation Formulation
For every 🟠 **Bad** and 🔴 **Ugly** issue:
1. Document the exact file location and line range: `[file.ext:Lxx-Lyy](file:///path/to/file.ext#Lxx-Lyy)`.
2. Formulate the root-cause problem statement.
3. Reference the violated project requirement or industry standard benchmark.
4. Provide a concrete code diff or replacement snippet showing the exact fix.

*Completion criterion*: No Bad or Ugly issue is left without a clickable location link, requirement citation, and proposed code fix.

### Step 5: Priority Action Plan Compilation
Assemble the consolidated **Recommended Action Plan** as a markdown table sorted from highest urgency (`P0`) to lowest (`Pn`). Follow the table schema in [RUBRIC.md](RUBRIC.md).

*Completion criterion*: All 🔴 Ugly and 🟠 Bad issues appear in the table, prioritized by risk and effort, with clear remediation summaries.

---

## Disclosed Reference

- Detailed scoring matrix, priority definitions, and output templates: [RUBRIC.md](RUBRIC.md)
