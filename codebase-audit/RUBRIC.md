# Codebase Audit Rubric & Output Standards

This reference document defines the evaluation criteria, severity mapping, priority tiers, and standardized reporting templates for `codebase-audit`.

---

## 1. Classification & Severity Rubric

| Tier | Badge | Definition | Impact on Software | Priority Range |
| :--- | :--- | :--- | :--- | :--- |
| **The Good** | 🟢 Green | Architectural strengths, robust abstractions, clean domain boundaries, high test coverage, strict adherence to project specs (`AGENTS.md`, etc.). | Enhances stability, readability, and maintainability. | N/A (Praise / Pattern) |
| **The Bad** | 🟠 Orange | Technical debt, code duplication, missing types/docs, non-critical performance bottlenecks, minor pattern deviations, test gaps. | Degrades maintainability, slows development velocity. | `P2` – `P3` |
| **The Ugly** | 🔴 Red | Critical security risks, data loss/corruption hazards, unhandled crash vectors, severe architectural boundary leaks, direct violations of core rules. | Threatens system stability, security, or data integrity. | `P0` – `P1` |

---

## 2. Priority Levels (P0 through Pn)

- **`P0` - Critical Blocker**: Immediate blocker to production or deployment. Includes remote code execution, secret exposure, data corruption bugs, build failures, or fatal runtime crash loops. Must be resolved immediately.
- **`P1` - High Urgency**: Severe defects and major architectural leaks. Examples: bypassing domain isolation, unhandled async errors in critical business paths, leaking database connections, or breaking contract rules in `AGENTS.md`.
- **`P2` - Medium Priority**: Core maintainability and tech debt. Examples: high cyclomatic complexity, tight coupling between feature modules, duplicate business logic, missing validation on non-critical inputs.
- **`P3` - Low Priority**: Minor code smells, styling drift, missing public documentation, suboptimal collection iterations, or minor lint warnings.
- **`Pn` - Housekeeping / Nice-to-Have**: Cosmetic refactoring, non-breaking dependency upgrades, or optional convenience helpers.

---

## 3. Standardized Audit Report Template

When executing `codebase-audit`, format the output strictly according to the following schema:

```markdown
# 🔍 Codebase Audit Report

**Audit Target**: `<repository-name or path>`
**Governance Baseline**: `AGENTS.md` (or `Industry Best Practices Fallback`)
**Stack Detected**: `<Languages, Frameworks, Build Tools>`

---

## 🟢 The Good (Strengths & Best Practices)

- **<Strength Title>**: Detailed description of the architectural or engineering strength.
  - *Location*: [`path/to/file.ext:Lxx-Lyy`](file:///path/to/file.ext#Lxx-Lyy)
  - *Observed Standard*: Why this pattern is exemplary and should be preserved/emulated.

---

## 🟠 The Bad (Technical Debt & Code Smells)

### [BAD-01] <Issue Title>
- **Severity**: 🟠 Orange (`P2` or `P3`)
- **Location**: [`path/to/file.ext:Lxx-Lyy`](file:///path/to/file.ext#Lxx-Lyy)
- **Problem**: Clear description of the technical debt or code smell and its operational impact.
- **Requirement Reference**: `<AGENTS.md section, Architecture Doc, or Industry Standard>`
- **Proposed Fix**:
```<language>
// Show concrete proposed code or diff
- oldSuboptimalCode();
+ newCleanCode();
```

---

## 🔴 The Ugly (Critical Defects & Architectural Violations)

### [UGLY-01] <Issue Title>
- **Severity**: 🔴 Red (`P0` or `P1`)
- **Location**: [`path/to/file.ext:Lxx-Lyy`](file:///path/to/file.ext#Lxx-Lyy)
- **Problem**: Clear explanation of the flaw, vulnerability, crash vector, or architectural boundary violation.
- **Requirement Reference**: `<AGENTS.md section, Architecture Doc, or Security Baseline>`
- **Proposed Fix**:
```<language>
// Show exact replacement code or diff fixing the defect
- dangerousOrCrashingCode();
+ resilientSafeCode();
```

---

## 📋 Recommended Action Plan

Prioritized remediation roadmap from **P0** down to **Pn**:

| Priority | Issue ID & Title | Location | Violated Requirement | Remediation Summary | Complexity |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **P0** | `[UGLY-01]` Fatal Crash / Risk | [`file.ext:L10-L20`](file:///path/to/file.ext#L10-L20) | Security / Reliability Mandate | Implement sanitization & boundary check | Low / Med / High |
| **P1** | `[UGLY-02]` Domain Breach | [`repo.ext:L45-L60`](file:///path/to/repo.ext#L45-L60) | `AGENTS.md#architecture` | Move DB query out of domain entity | Med |
| **P2** | `[BAD-01]` Logic Duplication | [`service.ext:L30-L70`](file:///path/to/service.ext#L30-L70) | Clean Code / DRY | Extract shared utility service | Low |
| **P3** | `[BAD-02]` Missing Null Guard | [`view.ext:L15-L25`](file:///path/to/view.ext#L15-L25) | Linter / Style Rules | Add safe navigation operator | Low |
```
