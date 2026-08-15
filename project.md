---
title: Course Project
subtitle: One query engine, exposed one inspectable stage at a time
author: Modern Query Processing
date: Fall 2026
status: Work in progress
layout: prose
---

# The project in one sentence

Students extend a supplied Rust query engine from a binary physical plan to
semi-naive recursive evaluation, preserving query meaning while making each
physical choice and its work visible.

[Open the homework repository](https://github.com/StarGazerM/modern-query-processing-homework)
for the released starter branches, code, tests, and branch-specific handouts.

This is not a build-a-database-engine course. Staff supplies the CQ frontend,
relation and index representations, reference semantics, workloads, tests, and
work counters. Students implement the named transformations and operators
inside that scaffold.

# Required common stages and advanced choice

| Stage | Required implementation | Points |
|---|---|---:|
| 1. Logical and physical lowering | Lower CQ through named relational and indexed stages to the supplied execution boundary | 5 |
| 2. Execution control | Compare the supplied pull path with a synchronous push lowering over the same concrete accesses | 3 |
| 3. Semijoin reduction | Implement a semijoin and both Yannakakis passes over a supplied join tree | 6 |
| 4. Triejoin | Implement leapfrog intersection and variable-at-a-time enumeration using a supplied **variable order** and tries | 10 |
| 5. Semi-naive evaluation | Maintain full and delta relations, remove duplicates, and run to a fixed point | 8 |
| 6. Pick one advanced extension | Complete one released language, execution, parallel, incremental, or sharing extension | 8 |
| Final presentation | Demonstrate one result and explain the relevant choices, evidence, and limitations | 10 |
| **Total** | | **50** |

# Releases

The stages are submitted as three releases:

- **R1:** Stages 1–2;
- **R2:** Stages 3–4; and
- **R3:** Stages 5–6.

The [course schedule](schedule.html#release-map) is the authoritative public
source for planned due weeks. Required recursion will be bounded to linear
positive rules unless the starter code supplies general delta-rule generation.

Each release consists of code, tests, and one-command benchmark output—no
proposal or long report. Correctness tests and algorithm-specific counters,
not raw speed, determine the stage score. DuckDB is a diagnostic baseline; the
goal is to explain differences, not beat it.

After R1 and R2, staff will release compatible reference checkpoints. Students
may use them for later stages without losing later-stage points.

# Homework and extension branches

The public homework repository uses immutable `hw1`, `hw2`, and `hw3` starter
branches. A later branch is published only after its prerequisite reference
answer may be released. The default `main` branch follows the latest announced
common starter; students create submission branches from the assigned numbered
branch.

After the common core, each team completes one released branch named
`pick-one/<name>`. Planned families include:

- safe negation and aggregation;
- Tokio channel execution;
- incremental maintenance with explicit progress;
- Rayon parallel physical lowering; and
- exact index sharing across several queries.

Teams rank three preferences. With an expected enrollment below 20, the
instructor balances assignments so different groups investigate different
extensions when practical. If an option is shared, teams use different
workloads, claims, or adversarial cases. Accessibility, team composition, and a
verified staff checkpoint take priority over uniqueness. An option is offered
only after its complete scaffold, tests, and reference implementation pass the
release checks.

# What students inspect

The supplied procedural-macro frontend makes the compilation path visible:

```text
CQ → typed logical IRs → physical choices → executable Rust
```

Students inspect macro expansions and implement ordinary Rust transformations
inside supplied interfaces. They do not build token parsing, procedural-macro
infrastructure, SQL parsing, transactions, a storage manager, a cost-based
optimizer, or a parallel runtime.

# Evidence expected in every release

1. correctness tests that distinguish the intended semantics from plausible wrong implementations;
2. one explicit invariant and one student-chosen adversarial case;
3. an adjacent-stage trace showing exactly what was added, preserved, or erased;
4. algorithm-specific work counters that expose intermediates, probes, intersections, candidates, or deltas as appropriate;
5. one-command benchmark output that another reader can reproduce; and
6. a brief `AI-USE.md` naming material assistance and one material AI correction or rejection.

Each release also includes a short individual check on an unseen case. Code may
be submitted by a team; the ability to explain its behavior is assessed
individually.

The final presentation selects one result and explains the relevant choice,
evidence, failure case, and limitation. It is not a general project demo.
